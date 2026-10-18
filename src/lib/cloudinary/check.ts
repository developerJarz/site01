import "server-only";
import { getCloudinaryConfig } from "./config";
import { getCloudinaryClient } from "./client";

export interface CloudinaryHealthResult {
  ok: boolean;
  configured: boolean;
  cloudName?: string;
  latencyMs?: number;
  rateLimit?: {
    allowed: number;
    remaining: number;
    resetAt?: string;
  };
  message: string;
  error?: string;
}

/**
 * Actively checks connection to Cloudinary via live ping API,
 * measures round-trip latency, and gathers rate limit statistics.
 */
export async function checkCloudinaryConnection(): Promise<CloudinaryHealthResult> {
  let cloudName: string | undefined;
  try {
    const config = getCloudinaryConfig();
    cloudName = config.cloudName;
  } catch (err) {
    return {
      ok: false,
      configured: false,
      message: "Cloudinary credentials are not configured or incomplete.",
      error: err instanceof Error ? err.message : "Missing credentials",
    };
  }

  const started = Date.now();
  try {
    const client = getCloudinaryClient();
    const pingResponse = await client.api.ping();
    const latencyMs = Date.now() - started;

    if (pingResponse?.status === "ok") {
      return {
        ok: true,
        configured: true,
        cloudName,
        latencyMs,
        rateLimit: {
          allowed: Number(pingResponse.rate_limit_allowed) || 0,
          remaining: Number(pingResponse.rate_limit_remaining) || 0,
          resetAt: pingResponse.rate_limit_reset_at ? String(pingResponse.rate_limit_reset_at) : undefined,
        },
        message: `Successfully connected to Cloudinary account "${cloudName}" in ${latencyMs}ms.`,
      };
    }

    return {
      ok: false,
      configured: true,
      cloudName,
      latencyMs,
      message: "Cloudinary responded but status was not 'ok'.",
      error: JSON.stringify(pingResponse),
    };
  } catch (err) {
    const latencyMs = Date.now() - started;
    const errorMessage = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      configured: true,
      cloudName,
      latencyMs,
      message: "Failed to connect to Cloudinary API.",
      error: errorMessage,
    };
  }
}
