import path from "node:path";
import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSiteSettings } from "@/lib/site-settings";
import { sanitizeWatermark } from "@/lib/site-config";
import { buildWatermark, watermarkSpecFromSettings } from "@/lib/watermark";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Sample photos for the preview (bundled with this route, see next.config.ts). */
const SAMPLES: Record<string, string> = {
  light: "images/home/hero-bmw.jpg",
  dark: "images/home/sell-banner.jpg",
  suv: "images/home/cat-suv.jpg",
};

/**
 * POST { watermark, sample, uploader } — the real watermark, drawn by the same code as listing
 * uploads, on a sample car photo. Nothing is saved; the settings come from the unsaved form.
 */
export async function POST(req: Request) {
  const auth = await requireAdmin("settings.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json().catch(() => ({}));
    const { siteName } = await getSiteSettings();
    const settings = sanitizeWatermark(body?.watermark);
    const uploader = typeof body?.uploader === "string" && body.uploader.trim() ? body.uploader.trim().slice(0, 40) : "Rahim Ahmed";
    const file = path.join(process.cwd(), "public", SAMPLES[body?.sample] || SAMPLES.light);

    let sharp;
    try {
      sharp = (await import("sharp")).default;
    } catch {
      return NextResponse.json({ error: "The preview needs the image processor, which isn't available on this server." }, { status: 503 });
    }
    // Same size as stored listing photos, so the mark has exactly the proportions buyers will see.
    const { data, info } = await sharp(await fs.readFile(file)).resize(1600, 1600, { fit: "inside" }).raw().toBuffer({ resolveWithObject: true });
    let image = sharp(data, { raw: { width: info.width, height: info.height, channels: info.channels } });
    if (settings.enabled) {
      const mark = await buildWatermark(sharp as unknown as Parameters<typeof buildWatermark>[0], info.width, info.height, watermarkSpecFromSettings(settings, siteName, uploader));
      if (mark) image = image.composite([mark]);
    }
    const jpeg = await image.resize(1100).jpeg({ quality: 84, mozjpeg: true }).toBuffer();
    return new NextResponse(new Uint8Array(jpeg), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Watermark preview failed:", error);
    return NextResponse.json({ error: "Couldn't draw the preview." }, { status: 500 });
  }
}
