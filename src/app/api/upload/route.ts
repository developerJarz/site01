import { NextRequest, NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { uploadImage, uploadDocument, deleteImage } from "@/lib/cloudinary";
import { optimiseOrDefer } from "@/lib/image-processing";
import { ImageUploadError, MAX_IMAGE_BYTES, validateImageFile, validateUploadOrigin } from "@/lib/image-upload";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { getSiteSettings } from "@/lib/site-settings";
import { permissionsForRole } from "@/lib/staff-roles";
import { watermarkSpecFromSettings, type WatermarkSpec } from "@/lib/watermark";

/** Team roles that place images on the website itself (logo, favicon, banners, share images). */
const SITE_IMAGE_PERMISSIONS = ["appearance.manage", "seo.manage", "blogs.manage", "settings.manage"];

/**
 * The copyright mark for a listing photo, from Admin → Settings → Watermark: the site name and,
 * if switched on, the name of the person who posted it.
 */
async function listingWatermark(userId: string): Promise<WatermarkSpec | null> {
  const { siteName, watermark } = await getSiteSettings();
  if (!watermark.enabled) return null;
  let uploader = "";
  if (watermark.showUploader) {
    await connectToDatabase();
    const user = await User.findById(userId).select("name dealershipName role").lean().catch(() => null);
    uploader = (user?.role === "dealer" && user.dealershipName?.trim()) || user?.name?.trim() || "";
  }
  return watermarkSpecFromSettings(watermark, siteName, uploader);
}

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
// One photo is usually done in a second or two, but a slow Cloudinary response on a bad day can
// take longer; hosts that honour this give the request up to a minute instead of cutting it off.
export const maxDuration = 60;

/** Fallback when Cloudinary is unreachable: local disk where the host allows it, otherwise inline. */
async function saveDocumentLocally(output: Buffer, pdf: boolean) {
  const name = `doc-${randomUUID()}.${pdf ? "pdf" : "webp"}`;
  try {
    const directory = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, name), output);
    return `/uploads/${name}`;
  } catch {
    return `data:${pdf ? "application/pdf" : "image/webp"};base64,${output.toString("base64")}`;
  }
}

export async function POST(req: NextRequest) {
  const uploadedIds: string[] = [];
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return NextResponse.json({ error: "Sign in to upload photos." }, { status: 401 });
    validateUploadOrigin(req);
    if (Number(req.headers.get("content-length")) > MAX_IMAGE_BYTES + 1024 * 1024) {
      throw new ImageUploadError("Upload at most 25 MB at a time.", 413);
    }

    const form = await req.formData().catch(() => { throw new ImageUploadError("Invalid upload request."); });
    const purpose = form.get("purpose") || "listing";
    if (purpose !== "listing" && purpose !== "documents" && purpose !== "site") throw new ImageUploadError("Invalid upload purpose.");
    if (purpose === "site") {
      const granted = await permissionsForRole((session?.user as { role?: string }).role);
      if (!granted.some((p) => SITE_IMAGE_PERMISSIONS.includes(p))) throw new ImageUploadError("Only the team can upload website images.", 403);
    }
    // Favicons stay PNG so every browser can show them.
    const asPng = purpose === "site" && form.get("format") === "png";
    const files = form.getAll("files");
    if (!files.length || files.length > 15 || files.some((file) => !(file instanceof File))) {
      throw new ImageUploadError("Choose between 1 and 15 files.");
    }
    const uploads = files as File[];
    if (uploads.reduce((total, file) => total + file.size, 0) > MAX_IMAGE_BYTES) {
      throw new ImageUploadError("Upload at most 25 MB at a time.", 413);
    }
    for (const file of uploads) {
      if (purpose === "documents" && file.type === "application/pdf") {
        if (!file.size || file.size > 12 * 1024 * 1024) throw new ImageUploadError("Choose a PDF smaller than 12 MB.");
      } else validateImageFile(file);
    }

    const watermark = purpose === "listing" ? await listingWatermark(userId) : null;
    const urls: string[] = [];
    for (const file of uploads) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (purpose === "site") {
        const compressed = await optimiseOrDefer(buffer, "site", { png: asPng });
        const image = await uploadImage(compressed ?? buffer, userId, "site", { compressed: !!compressed });
        uploadedIds.push(image.public_id);
        urls.push(image.secure_url);
      } else if (purpose === "listing") {
        const compressed = await optimiseOrDefer(buffer, "listing", { watermark });
        const image = await uploadImage(compressed ?? buffer, userId, "listing", { compressed: !!compressed, watermark });
        uploadedIds.push(image.public_id);
        urls.push(image.secure_url);
      } else {
        const pdf = file.type === "application/pdf";
        if (pdf && buffer.subarray(0, 5).toString() !== "%PDF-") throw new ImageUploadError("Choose a valid PDF document.");
        const compressed = pdf ? buffer : await optimiseOrDefer(buffer, "document");
        try {
          // Private Cloudinary storage: papers never sit in the public photo library or in the database.
          const doc = await uploadDocument(compressed ?? buffer, userId, { pdf, compressed: !!compressed });
          urls.push(doc.secure_url);
        } catch (error) {
          if (!compressed) throw error;
          urls.push(await saveDocumentLocally(compressed, pdf));
        }
      }
    }
    return NextResponse.json({ success: true, urls });
  } catch (error) {
    await Promise.allSettled(uploadedIds.map(deleteImage));
    const known = error instanceof ImageUploadError;
    return NextResponse.json({ error: known ? error.message : "Couldn't upload your files. Please try again." }, { status: known ? error.status : 500 });
  }
}
