import "server-only";
import { randomUUID } from "node:crypto";
import type { UploadApiResponse } from "cloudinary";
import { getCloudinaryClient } from "./client";
import { ImageUploadError } from "../image-upload";
import { IMAGE_TARGETS } from "../image-processing";
import { cloudinaryWatermark, type WatermarkSpec } from "../watermark";

export type ImagePurpose = "listing" | "avatar" | "site";

function streamUpload(buffer: Buffer, options: Record<string, unknown>) {
  const client = getCloudinaryClient();
  return new Promise<UploadApiResponse>((resolve, reject) => {
    const stream = client.uploader.upload_stream({ overwrite: false, timeout: 60_000, ...options }, (error, result) => {
      if (error || !result) reject(error || new Error("No upload result received from Cloudinary"));
      else resolve(result);
    });
    stream.on("error", reject);
    stream.end(buffer);
  });
}

/** Same limits as image-processing, applied by Cloudinary when this host couldn't compress the photo itself. */
function incomingCompression(purpose: ImagePurpose | "document", watermark?: WatermarkSpec | null) {
  const t = IMAGE_TARGETS[purpose];
  return {
    format: t.format,
    transformation: [
      purpose === "avatar"
        ? { width: t.size, height: t.size, crop: "fill", gravity: "auto", quality: "auto:good" }
        : { width: t.size, height: t.size, crop: "limit", quality: "auto:good" },
      ...(watermark ? [cloudinaryWatermark(watermark)] : []),
    ],
  };
}

/**
 * Uploads an image buffer to Cloudinary. Pass `compressed: false` when the buffer is the original
 * file (sharp unavailable): Cloudinary then resizes, compresses and watermarks it before storing.
 */
export async function uploadImage(
  buffer: Buffer,
  ownerId: string,
  purpose: ImagePurpose,
  { compressed = true, watermark }: { compressed?: boolean; watermark?: WatermarkSpec | null } = {}
): Promise<UploadApiResponse> {
  const folder = purpose === "avatar" ? "avatars" : purpose === "site" ? "site" : "listings";
  try {
    return await streamUpload(buffer, {
      public_id: `carhat/${folder}/${ownerId}/${randomUUID()}`,
      resource_type: "image",
      tags: ["carhat", folder],
      // Already compressed (and watermarked) by sharp, or Cloudinary does both on the way in.
      ...(compressed ? {} : incomingCompression(purpose, watermark)),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload error";
    console.error("Cloudinary upload failed:", message);
    throw new ImageUploadError("Photo storage is temporarily unavailable. Please try again.", 502);
  }
}

/**
 * Car papers are uploaded as "authenticated" assets: Cloudinary only serves them through the signed
 * URL stored on the listing, which only admins are given. PDFs are stored as raw files so free plans,
 * which block PDF delivery as images, can still open them.
 */
export async function uploadDocument(
  buffer: Buffer,
  ownerId: string,
  { pdf, compressed = true }: { pdf: boolean; compressed?: boolean }
): Promise<UploadApiResponse> {
  const id = `carhat/documents/${ownerId}/${randomUUID()}`;
  try {
    return await streamUpload(buffer, pdf
      ? { public_id: `${id}.pdf`, resource_type: "raw", type: "authenticated", tags: ["carhat", "documents"] }
      : { public_id: id, resource_type: "image", type: "authenticated", tags: ["carhat", "documents"], ...(compressed ? {} : incomingCompression("document")) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Upload error";
    console.error("Cloudinary document upload failed:", message);
    throw new ImageUploadError("Document storage is temporarily unavailable. Please try again.", 502);
  }
}

const AUTHENTICATED_URL = /^https:\/\/res\.cloudinary\.com\/[^/]+\/(image|raw)\/authenticated\/(?:s--[^/]+--\/)?(?:v(\d+)\/)?(.+)$/;

/** Fresh signed link for a private paper scan; any other URL is returned unchanged. */
export function signDocumentUrl(url: string): string {
  const match = AUTHENTICATED_URL.exec(url);
  if (!match) return url;
  const [, resourceType, version, path] = match;
  const client = getCloudinaryClient();
  // Raw public IDs keep their extension; image IDs don't, the extension is the delivery format.
  const dot = path.lastIndexOf(".");
  const isImage = resourceType === "image" && dot > 0;
  return client.url(isImage ? path.slice(0, dot) : path, {
    resource_type: resourceType,
    type: "authenticated",
    sign_url: true,
    secure: true,
    version,
    ...(isImage ? { format: path.slice(dot + 1) } : {}),
  });
}

/**
 * Deletes an image from Cloudinary by its public ID.
 * IDs come from internal database records, never from untrusted client input.
 */
export async function deleteImage(publicId: string): Promise<void> {
  if (!publicId) return;
  const client = getCloudinaryClient();
  try {
    await client.uploader.destroy(publicId, { resource_type: "image", invalidate: true });
  } catch (err) {
    console.warn(`Failed to delete Cloudinary asset ${publicId}:`, err);
  }
}

/**
 * Generates an optimized Cloudinary delivery URL with automatic format and quality.
 */
export function getOptimizedImageUrl(
  publicIdOrUrl: string,
  options: { width?: number; height?: number; crop?: "fill" | "fit" | "limit" | "scale" } = {}
): string {
  if (!publicIdOrUrl) return "";
  if (!publicIdOrUrl.includes("res.cloudinary.com") && !publicIdOrUrl.startsWith("carhat/")) {
    return publicIdOrUrl;
  }

  const client = getCloudinaryClient();
  const transformations = [
    "f_auto",
    "q_auto",
    options.crop ? `c_${options.crop}` : "c_limit",
    options.width ? `w_${options.width}` : undefined,
    options.height ? `h_${options.height}` : undefined,
  ]
    .filter(Boolean)
    .join(",");

  if (publicIdOrUrl.startsWith("http")) {
    return publicIdOrUrl.replace("/upload/", `/upload/${transformations}/`);
  }

  return client.url(publicIdOrUrl, {
    fetch_format: "auto",
    quality: "auto",
    crop: options.crop || "limit",
    width: options.width,
    height: options.height,
    secure: true,
  });
}
