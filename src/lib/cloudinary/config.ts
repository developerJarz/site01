import "server-only";
import { ImageUploadError } from "../image-upload";

export interface CloudinaryConfigOptions {
  cloudName: string;
  apiKey: string;
  apiSecret: string;
  secure?: boolean;
}

let cachedConfig: CloudinaryConfigOptions | null = null;

/**
 * Parses and returns Cloudinary credentials from either CLOUDINARY_URL
 * or individual CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET.
 */
export function getCloudinaryConfig(): CloudinaryConfigOptions {
  if (cachedConfig) return cachedConfig;

  // 1. Try standard CLOUDINARY_URL format (cloudinary://api_key:api_secret@cloud_name)
  const cloudinaryUrl = process.env.CLOUDINARY_URL?.trim();
  if (cloudinaryUrl) {
    try {
      const url = new URL(cloudinaryUrl);
      if (url.protocol === "cloudinary:" && url.hostname && url.username && url.password) {
        cachedConfig = {
          cloudName: url.hostname,
          apiKey: decodeURIComponent(url.username),
          apiSecret: decodeURIComponent(url.password),
          secure: true,
        };
        return cachedConfig;
      }
    } catch {
      // Malformed URL, fall through to separate environment variables
    }
  }

  // 2. Try individual environment variables
  const cloudName = (process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME)?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (cloudName && apiKey && apiSecret) {
    cachedConfig = {
      cloudName,
      apiKey,
      apiSecret,
      secure: true,
    };
    return cachedConfig;
  }

  throw new ImageUploadError("Cloudinary image storage is not configured. Please check environment variables.", 503);
}

/** Check whether Cloudinary credentials exist without throwing an error. */
export function isCloudinaryConfigured(): boolean {
  try {
    getCloudinaryConfig();
    return true;
  } catch {
    return false;
  }
}

/** Clear configuration cache (useful for testing or dynamic credential reloads). */
export function clearConfigCache(): void {
  cachedConfig = null;
}
