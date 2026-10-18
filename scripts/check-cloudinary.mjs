#!/usr/bin/env node

/**
 * Cloudinary Connectivity & Health Check Script for CarHat
 *
 * Usage:
 *   node --env-file=.env scripts/check-cloudinary.mjs
 *   or: npm run check:cloudinary
 */

import { v2 as cloudinary } from "cloudinary";

console.log("==================================================");
console.log("  CarHat - Cloudinary Connection Diagnostic Check ");
console.log("==================================================");

const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

let activeConfig = null;

if (cloudinaryUrl) {
  try {
    const parsed = new URL(cloudinaryUrl);
    if (parsed.protocol === "cloudinary:" && parsed.hostname && parsed.username && parsed.password) {
      activeConfig = {
        cloud_name: parsed.hostname,
        api_key: decodeURIComponent(parsed.username),
        api_secret: decodeURIComponent(parsed.password),
        source: "CLOUDINARY_URL",
      };
    }
  } catch (err) {
    console.error("❌ CLOUDINARY_URL exists but could not be parsed as a URL:", err.message);
  }
}

if (!activeConfig && cloudName && apiKey && apiSecret) {
  activeConfig = {
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    source: "Individual environment variables",
  };
}

if (!activeConfig) {
  console.error("❌ Cloudinary credentials NOT FOUND!");
  console.error("   Please ensure either CLOUDINARY_URL or CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET are set in .env.");
  process.exit(1);
}

console.log(`Config source: ${activeConfig.source}`);
console.log(`Cloud name:    ${activeConfig.cloud_name}`);
console.log(`API Key:       ${activeConfig.api_key.substring(0, 4)}...${activeConfig.api_key.slice(-3)}`);
console.log("Pinging Cloudinary API...");

const started = Date.now();
cloudinary.config({
  cloud_name: activeConfig.cloud_name,
  api_key: activeConfig.api_key,
  api_secret: activeConfig.api_secret,
  secure: true,
});

try {
  const result = await cloudinary.api.ping();
  const latency = Date.now() - started;

  if (result?.status === "ok") {
    console.log(`✅ SUCCESS: Connected to Cloudinary in ${latency}ms!`);
    console.log(`   Status:             ${result.status}`);
    console.log(`   Rate limit allowed: ${result.rate_limit_allowed}`);
    console.log(`   Remaining requests: ${result.rate_limit_remaining}`);
    if (result.rate_limit_reset_at) {
      console.log(`   Rate limit reset:   ${new Date(result.rate_limit_reset_at).toLocaleString()}`);
    }
    console.log("==================================================");
    process.exit(0);
  } else {
    console.error("⚠️ Cloudinary responded but status was not 'ok':", result);
    process.exit(1);
  }
} catch (err) {
  console.error("❌ FAILED to connect to Cloudinary:", err.message || err);
  process.exit(1);
}
