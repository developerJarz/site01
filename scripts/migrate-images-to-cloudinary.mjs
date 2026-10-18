#!/usr/bin/env node

/**
 * Moves photos that are not on Cloudinary yet (base64 strings inside MongoDB, or files in
 * public/uploads) to Cloudinary, compressing them on the way, and points the records at the new URLs.
 *
 * Covers: listing photos, listing paper scans (private), profile photos and blog cover images.
 *
 * Usage:
 *   node --env-file=.env scripts/migrate-images-to-cloudinary.mjs           # dry run: report only
 *   node --env-file=.env scripts/migrate-images-to-cloudinary.mjs --apply   # upload and update records
 *   npm run migrate:images -- --apply
 *
 * Safe to run more than once: anything already on Cloudinary is skipped. Each record is only
 * updated if it hasn't changed since it was read, so a seller editing a listing meanwhile is not overwritten.
 */

import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import mongoose from "mongoose";
import sharp from "sharp";
import { v2 as cloudinary } from "cloudinary";

const APPLY = process.argv.includes("--apply");
const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// Same targets as src/lib/image-processing.ts.
const TARGETS = {
  listing: { size: 1600, encode: (s) => s.avif({ quality: 58, effort: 3 }) },
  avatar: { size: 512, encode: (s) => s.avif({ quality: 60, effort: 3 }) },
  blog: { size: 1600, encode: (s) => s.avif({ quality: 60, effort: 3 }) },
  document: { size: 2400, encode: (s) => s.webp({ quality: 90, effort: 5, smartSubsample: true }) },
};

function configureCloudinary() {
  const url = process.env.CLOUDINARY_URL?.trim();
  if (url) {
    const u = new URL(url);
    cloudinary.config({ cloud_name: u.hostname, api_key: decodeURIComponent(u.username), api_secret: decodeURIComponent(u.password), secure: true });
  } else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    cloudinary.config({ cloud_name: process.env.CLOUDINARY_CLOUD_NAME, api_key: process.env.CLOUDINARY_API_KEY, api_secret: process.env.CLOUDINARY_API_SECRET, secure: true });
  } else {
    throw new Error("Cloudinary credentials are missing. Set CLOUDINARY_URL in .env.");
  }
}

/** Where a stored image string lives. Only "base64" and "local" are migrated. */
function kind(src) {
  if (!src || typeof src !== "string") return "empty";
  if (src.startsWith("data:")) return "base64";
  if (src.includes("res.cloudinary.com")) return "cloudinary";
  if (src.startsWith("/uploads/")) return "local";
  return "other";
}

async function readSource(src) {
  if (src.startsWith("data:")) {
    const match = /^data:([^;,]+)(;base64)?,([\s\S]*)$/.exec(src);
    if (!match) throw new Error("malformed data URL");
    return { mime: match[1], buffer: match[2] ? Buffer.from(match[3], "base64") : Buffer.from(decodeURIComponent(match[3])) };
  }
  const file = path.join(UPLOAD_DIR, path.basename(src));
  const buffer = await fs.readFile(file);
  return { mime: file.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/*", buffer };
}

async function compress(buffer, target) {
  const t = TARGETS[target];
  const image = sharp(buffer, { limitInputPixels: 50_000_000 }).rotate();
  const resized = target === "avatar"
    ? image.resize(t.size, t.size, { fit: "cover", position: "attention", withoutEnlargement: true })
    : image.resize(t.size, t.size, { fit: "inside", withoutEnlargement: true });
  return t.encode(resized).toBuffer();
}

function upload(buffer, options) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ overwrite: false, timeout: 120_000, ...options }, (err, res) => (err || !res ? reject(err || new Error("no result")) : resolve(res)));
    stream.end(buffer);
  });
}

const stats = { found: 0, migrated: 0, failed: 0, skippedChanged: 0, bytesBefore: 0, bytesAfter: 0 };

/** Upload one stored image string; returns the new URL, or null when it can't be migrated. */
async function migrateOne(src, target, ownerId) {
  const { mime, buffer } = await readSource(src);
  stats.bytesBefore += src.startsWith("data:") ? src.length : buffer.length;
  if (!APPLY) return null;

  if (target === "document") {
    const pdf = mime === "application/pdf" || buffer.subarray(0, 5).toString() === "%PDF-";
    const id = `carhat/documents/${ownerId}/${randomUUID()}`;
    const body = pdf ? buffer : await compress(buffer, "document");
    stats.bytesAfter += body.length;
    const res = await upload(body, pdf
      ? { public_id: `${id}.pdf`, resource_type: "raw", type: "authenticated", tags: ["carhat", "documents", "migrated"] }
      : { public_id: id, resource_type: "image", type: "authenticated", tags: ["carhat", "documents", "migrated"] });
    return res.secure_url;
  }

  const folder = target === "avatar" ? "avatars" : target === "blog" ? "blog" : "listings";
  const body = await compress(buffer, target);
  stats.bytesAfter += body.length;
  const res = await upload(body, { public_id: `carhat/${folder}/${ownerId}/${randomUUID()}`, resource_type: "image", tags: ["carhat", folder, "migrated"] });
  return res.secure_url;
}

/** Migrates every local/base64 entry of an array field, then saves only if the record is unchanged. */
async function migrateArray(collection, doc, field, target, ownerId) {
  const original = doc[field] || [];
  const next = [...original];
  let changed = false;
  for (let i = 0; i < original.length; i++) {
    const k = kind(original[i]);
    if (k !== "base64" && k !== "local") continue;
    stats.found++;
    try {
      const url = await migrateOne(original[i], target, ownerId);
      if (url) { next[i] = url; changed = true; stats.migrated++; }
    } catch (error) {
      stats.failed++;
      console.warn(`  ✗ ${collection.collectionName} ${doc._id} ${field}[${i}]: ${error.message}`);
    }
  }
  if (changed) {
    const res = await collection.updateOne({ _id: doc._id, [field]: original }, { $set: { [field]: next } });
    if (!res.modifiedCount) { stats.skippedChanged++; console.warn(`  ! ${doc._id} changed while migrating; left as is, run again.`); }
  }
}

async function migrateField(collection, doc, field, target, ownerId) {
  const value = doc[field];
  const k = kind(value);
  if (k !== "base64" && k !== "local") return;
  stats.found++;
  try {
    const url = await migrateOne(value, target, ownerId);
    if (!url) return;
    stats.migrated++;
    const res = await collection.updateOne({ _id: doc._id, [field]: value }, { $set: { [field]: url } });
    if (!res.modifiedCount) stats.skippedChanged++;
  } catch (error) {
    stats.failed++;
    console.warn(`  ✗ ${collection.collectionName} ${doc._id} ${field}: ${error.message}`);
  }
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error("MONGODB_URI is missing.");
  configureCloudinary();
  console.log(APPLY ? "Migrating images to Cloudinary…" : "Dry run: nothing will be uploaded or changed. Add --apply to migrate.");
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const notOnCloudinary = { $regex: "^(data:|/uploads/)" };

  const listings = db.collection("listings");
  const cursor = listings.find({ $or: [{ images: notOnCloudinary }, { documents: notOnCloudinary }] }, { projection: { images: 1, documents: 1, sellerId: 1 } });
  let n = 0;
  for await (const doc of cursor) {
    n++;
    const owner = String(doc.sellerId || "unknown");
    await migrateArray(listings, doc, "images", "listing", owner);
    await migrateArray(listings, doc, "documents", "document", owner);
  }
  console.log(`Listings with photos or papers to move: ${n}`);

  const users = db.collection("users");
  let u = 0;
  for await (const doc of users.find({ avatar: notOnCloudinary }, { projection: { avatar: 1 } })) {
    u++;
    await migrateField(users, doc, "avatar", "avatar", String(doc._id));
  }
  console.log(`Profile photos to move: ${u}`);

  const blogs = db.collection("blogs");
  let b = 0;
  for await (const doc of blogs.find({ coverImage: notOnCloudinary }, { projection: { coverImage: 1 } })) {
    b++;
    await migrateField(blogs, doc, "coverImage", "blog", "posts");
  }
  console.log(`Blog covers to move: ${b}`);

  const mb = (x) => `${(x / 1024 / 1024).toFixed(2)} MB`;
  console.log("──────────────────────────────────────────");
  console.log(`Images found off Cloudinary: ${stats.found}`);
  console.log(`Size today:                  ${mb(stats.bytesBefore)}`);
  if (APPLY) {
    console.log(`Migrated:                    ${stats.migrated}`);
    console.log(`Size on Cloudinary:          ${mb(stats.bytesAfter)}`);
    console.log(`Failed:                      ${stats.failed}`);
    console.log(`Skipped (edited meanwhile):  ${stats.skippedChanged}`);
  }
  await mongoose.disconnect();
}

main().catch(async (error) => {
  console.error("Migration stopped:", error.message);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
