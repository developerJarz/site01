import "server-only";
import { v2 as cloudinary } from "cloudinary";
import { getCloudinaryConfig } from "./config";

let isConfigured = false;

/**
 * Ensures the Cloudinary SDK is initialized with validated credentials.
 */
export function getCloudinaryClient() {
  const config = getCloudinaryConfig();
  if (!isConfigured) {
    cloudinary.config({
      cloud_name: config.cloudName,
      api_key: config.apiKey,
      api_secret: config.apiSecret,
      secure: config.secure ?? true,
    });
    isConfigured = true;
  }
  return cloudinary;
}

export { cloudinary };
