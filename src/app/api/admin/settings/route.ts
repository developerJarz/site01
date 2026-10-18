import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { connectToDatabase } from "@/lib/db";
import { SiteSettings } from "@/lib/models/SiteSettings";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateSeoCache } from "@/lib/seo";
import { invalidateSiteSettings } from "@/lib/site-settings";
import { resolveAppearance, resolveWatermark, safeHref, safeImageUrl, sanitizeAppearance, sanitizeWatermark } from "@/lib/site-config";

export const dynamic = "force-dynamic";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : undefined);

/** Fields Admin → Appearance may change (brand and website builder). */
function appearanceUpdate(body: Record<string, unknown>, current: unknown) {
  const update: Record<string, unknown> = {};
  const siteName = text(body.siteName, 60);
  if (siteName) update.siteName = siteName;
  const tagline = text(body.tagline, 240);
  if (tagline !== undefined) update.tagline = tagline;
  const copyright = text(body.copyrightText, 160);
  if (copyright !== undefined) update.copyrightText = copyright;
  if (body.logoUrl !== undefined) {
    const logo = safeImageUrl(body.logoUrl);
    if (!logo) throw new Error("The logo must be an uploaded image or a site path like /car-hat-bd.png.");
    update.logoUrl = logo;
  }
  if (body.appearance !== undefined) update.appearance = sanitizeAppearance(body.appearance, resolveAppearance(current));
  return update;
}

/** Fields Admin → Settings may change (contact details, listing rules, watermark, maintenance). */
function settingsUpdate(body: Record<string, unknown>, current: unknown) {
  const update: Record<string, unknown> = {};
  for (const [key, max] of [["contactEmail", 120], ["supportPhone", 40], ["address", 240], ["workingHours", 120], ["maintenanceMessage", 300]] as const) {
    const value = text(body[key], max);
    if (value !== undefined) update[key] = value;
  }
  if (body.googleMapsUrl !== undefined) update.googleMapsUrl = safeHref(body.googleMapsUrl);
  if (body.socialLinks && typeof body.socialLinks === "object") {
    const links = body.socialLinks as Record<string, unknown>;
    for (const key of ["facebook", "twitter", "instagram", "youtube", "linkedin"]) {
      if (links[key] !== undefined) update[`socialLinks.${key}`] = /^https:\/\//i.test(String(links[key]).trim()) ? safeHref(links[key]) : "";
    }
    if (links.whatsapp !== undefined) update["socialLinks.whatsapp"] = String(links.whatsapp).replace(/[^\d+]/g, "").slice(0, 20);
  }
  if (body.defaultListingStatus === "active" || body.defaultListingStatus === "pending") update.defaultListingStatus = body.defaultListingStatus;
  if (typeof body.autoApproveListings === "boolean") update.autoApproveListings = body.autoApproveListings;
  if (body.maxImagesPerListing !== undefined) {
    const n = Math.round(Number(body.maxImagesPerListing));
    if (!Number.isFinite(n) || n < 1 || n > 30) throw new Error("Photos per listing must be between 1 and 30.");
    update.maxImagesPerListing = n;
  }
  if (typeof body.maintenanceMode === "boolean") update.maintenanceMode = body.maintenanceMode;
  if (body.watermark !== undefined) update.watermark = sanitizeWatermark(body.watermark, resolveWatermark(current));
  return update;
}

export async function GET() {
  const auth = await requireAdmin("settings.manage", "appearance.manage");
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();

    // Get or create singleton settings document
    let settings = await SiteSettings.findOne().lean();
    if (!settings) {
      const created = await SiteSettings.create({});
      settings = JSON.parse(JSON.stringify(created));
    }

    return NextResponse.json({
      settings: {
        ...JSON.parse(JSON.stringify(settings)),
        appearance: resolveAppearance(settings?.appearance),
        watermark: resolveWatermark(settings?.watermark),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin("settings.manage", "appearance.manage");
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const body = await req.json();
    if (!body || typeof body !== "object") return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    const current = await SiteSettings.findOne().select("appearance watermark").lean();

    let update: Record<string, unknown>;
    try {
      update = {
        ...(auth.can("appearance.manage") ? appearanceUpdate(body, current?.appearance) : {}),
        ...(auth.can("settings.manage") ? settingsUpdate(body, current?.watermark) : {}),
      };
    } catch (error) {
      return NextResponse.json({ error: (error as Error).message }, { status: 400 });
    }
    if (Object.keys(update).length === 0) return NextResponse.json({ error: "Nothing your role can change was sent." }, { status: 400 });

    // Upsert the singleton settings document
    const settings = await SiteSettings.findOneAndUpdate(
      {},
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).lean();

    invalidateSiteSettings();
    invalidateSeoCache();
    // Header, footer, favicon and colours are in the root layout; the homepage is cached for a minute.
    revalidatePath("/", "layout");

    return NextResponse.json({
      success: true,
      settings: {
        ...JSON.parse(JSON.stringify(settings)),
        appearance: resolveAppearance(settings?.appearance),
        watermark: resolveWatermark(settings?.watermark),
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
