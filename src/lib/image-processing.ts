import type { Sharp } from "sharp";
import { ImageUploadError } from "./image-upload.ts";
import { buildWatermark, type WatermarkSpec } from "./watermark.ts";

export type ImageJob = "listing" | "avatar" | "document" | "site";

/**
 * Storage targets, tuned on real car photos:
 *  - Listing photos: AVIF, longest side 1600px. About 70 KB each, roughly 60% smaller than the
 *    old 2048px WebP at the same visual quality. next/image still serves WebP/JPEG to old browsers.
 *  - Avatars: 512px square AVIF.
 *  - Paper scans: WebP at high quality and a larger size, so small print stays readable.
 */
export const IMAGE_TARGETS = {
  listing: { size: 1600, format: "avif", quality: 58 },
  avatar: { size: 512, format: "avif", quality: 60 },
  document: { size: 2400, format: "webp", quality: 90 },
  // Logos, banners and share images from the admin: keep transparency and crisp edges.
  site: { size: 2400, format: "webp", quality: 88 },
} as const;

/** Thrown when the sharp native module can't load on this host; callers let Cloudinary compress instead. */
export class ImageProcessorUnavailable extends Error {}

type SharpFactory = (input?: Buffer | object, options?: object) => Sharp;
let sharpLoader: Promise<SharpFactory | null> | undefined;
function loadSharp() {
  sharpLoader ??= import("sharp")
    .then((m) => (m.default || m) as unknown as SharpFactory)
    .catch((error) => {
      console.warn("sharp is unavailable on this host; photos will be compressed by Cloudinary instead.", error);
      return null;
    });
  return sharpLoader;
}

/**
 * Decode trusted raster formats only, rotate phone photos, strip location/EXIF metadata and compress.
 * Listing photos can carry a watermark (site name and uploader), drawn after resizing so it is the
 * same size on every photo. A watermark that fails to render never blocks the upload.
 */
export async function optimiseImage(input: Buffer, purpose: ImageJob, { watermark, png }: { watermark?: WatermarkSpec | null; png?: boolean } = {}) {
  const sharp = await loadSharp();
  if (!sharp) throw new ImageProcessorUnavailable();
  const target = IMAGE_TARGETS[purpose];
  try {
    const image = sharp(input, { limitInputPixels: 50_000_000, failOn: "error" });
    const metadata = await image.metadata();
    if (!metadata.format || !["jpeg", "png", "webp", "heif", "avif", "gif"].includes(metadata.format)) {
      throw new ImageUploadError("Choose a valid, supported photo.");
    }
    const rotated = image.rotate();
    const avatarSize = Math.min(target.size, metadata.width || target.size, metadata.height || target.size);
    let resized = purpose === "avatar"
      ? rotated.resize(avatarSize, avatarSize, { fit: "cover", position: "attention", withoutEnlargement: true })
      : rotated.resize(target.size, target.size, { fit: "inside", withoutEnlargement: true });
    if (png) return await resized.png({ compressionLevel: 9 }).toBuffer();
    if (watermark) {
      // Raw pixels, so the photo is only compressed once.
      const { data, info } = await resized.raw().toBuffer({ resolveWithObject: true });
      resized = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
      try {
        const mark = await buildWatermark(sharp, info.width, info.height, watermark);
        if (mark) resized = resized.composite([mark]);
      } catch (error) {
        console.warn("Watermark could not be drawn; uploading the photo without it.", error);
      }
    }
    return target.format === "avif"
      // Effort 1 encodes in about half the time of effort 3 at the same file size on car photos
      // (measured: 174 ms vs 364 ms, both ~76 KB for a 1600px photo), which matters on small servers.
      ? await resized.avif({ quality: target.quality, effort: 1 }).toBuffer()
      : await resized.webp({ quality: target.quality, effort: 5, smartSubsample: true }).toBuffer();
  } catch (error) {
    if (error instanceof ImageUploadError) throw error;
    throw new ImageUploadError("This image is invalid, too large to decode, or unsupported. Try another photo.");
  }
}

/** Compress when possible; returns null when this host can't run sharp so Cloudinary can do it on upload. */
export async function optimiseOrDefer(input: Buffer, purpose: ImageJob, options?: Parameters<typeof optimiseImage>[2]) {
  try {
    return await optimiseImage(input, purpose, options);
  } catch (error) {
    if (error instanceof ImageProcessorUnavailable) return null;
    throw error;
  }
}
