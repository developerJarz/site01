import "server-only";
import { connectToDatabase } from "./db";
import { SiteSettings } from "./models/SiteSettings";
import { DEFAULT_APPEARANCE, DEFAULT_WATERMARK, resolveAppearance, resolveWatermark, type AppearanceSettings, type WatermarkSettings } from "./site-config";

export interface ServerSiteSettings {
  siteName: string;
  logoUrl: string;
  appearance: AppearanceSettings;
  watermark: WatermarkSettings;
}

const FALLBACK: ServerSiteSettings = { siteName: "CarHat.bd", logoUrl: "/car-hat-bd.png", appearance: DEFAULT_APPEARANCE, watermark: DEFAULT_WATERMARK };

// Read by the layout, the homepage and every photo upload; admin edits are rare.
const TTL_MS = 60_000;
let cache: { at: number; data: Promise<ServerSiteSettings> } | undefined;

async function fetchSettings(): Promise<ServerSiteSettings> {
  try {
    await connectToDatabase();
    const doc = await SiteSettings.findOne().select("siteName logoUrl appearance watermark").lean();
    return {
      siteName: doc?.siteName?.trim() || FALLBACK.siteName,
      logoUrl: doc?.logoUrl?.trim() || FALLBACK.logoUrl,
      appearance: resolveAppearance(doc?.appearance),
      watermark: resolveWatermark(doc?.watermark),
    };
  } catch (error) {
    console.error("Site settings failed to load; using defaults.", error);
    return FALLBACK;
  }
}

/** Server-side site settings for rendering and uploads, cached for a minute per server instance. */
export function getSiteSettings(): Promise<ServerSiteSettings> {
  if (!cache || Date.now() - cache.at > TTL_MS) cache = { at: Date.now(), data: fetchSettings() };
  return cache.data;
}

/** Called after an admin saves settings so this server instance picks them up straight away. */
export function invalidateSiteSettings() {
  cache = undefined;
}
