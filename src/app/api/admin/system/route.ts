import { NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireAdmin } from "@/lib/admin-auth";
import { User } from "@/lib/models/User";
import { Listing } from "@/lib/models/Listing";
import { Conversation } from "@/lib/models/Conversation";
import { Message } from "@/lib/models/Message";
import { Favorite } from "@/lib/models/Favorite";
import { Blog } from "@/lib/models/Blog";
import { NewsletterSubscriber } from "@/lib/models/NewsletterSubscriber";
import { ContactMessage } from "@/lib/models/ContactMessage";
import { SiteSettings } from "@/lib/models/SiteSettings";
import { checkCloudinaryConnection } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

/** Configuration and health for Admin → System. Reports whether things are set, never their values. */
export async function GET() {
  const auth = await requireAdmin("system.view");
  if (!auth.ok) return auth.response;

  const started = Date.now();
  let db: { ok: boolean; latencyMs?: number; error?: string } = { ok: false };
  try {
    await connectToDatabase();
    await mongoose.connection.db?.admin().ping();
    db = { ok: true, latencyMs: Date.now() - started };
  } catch (e) {
    db = { ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "Unreachable" };
  }

  let uploads = false;
  try {
    const dir = path.join(process.cwd(), "public", "uploads");
    await fs.mkdir(dir, { recursive: true });
    const probe = path.join(dir, `.probe-${Date.now()}`);
    await fs.writeFile(probe, "ok");
    await fs.unlink(probe);
    uploads = true;
  } catch {}

  let sharp = false;
  try {
    await import("sharp");
    sharp = true;
  } catch {}

  const cloudinaryStatus = await checkCloudinaryConnection();

  let counts: Record<string, number> = {};
  let settings: Record<string, unknown> | null = null;
  if (db.ok) {
    const models = { users: User, listings: Listing, conversations: Conversation, messages: Message, favorites: Favorite, blogPosts: Blog, subscribers: NewsletterSubscriber, contactMessages: ContactMessage };
    const entries = await Promise.all(Object.entries(models).map(async ([k, m]) => [k, await (m as mongoose.Model<unknown>).estimatedDocumentCount()] as const));
    counts = Object.fromEntries(entries);
    settings = (await SiteSettings.findOne().select("autoApproveListings defaultListingStatus maxImagesPerListing maintenanceMode updatedAt").lean()) as Record<string, unknown> | null;
  }

  const set = (v?: string) => !!v && v.trim().length > 0;
  const env = process.env;
  return NextResponse.json({
    checkedAt: new Date().toISOString(),
    runtime: { node: process.version, env: env.NODE_ENV || "development" },
    db,
    storage: {
      uploadsWritable: uploads,
      imageOptimiser: sharp,
      cloudinaryConfigured: cloudinaryStatus.configured,
      cloudinaryOk: cloudinaryStatus.ok,
      cloudinaryLatencyMs: cloudinaryStatus.latencyMs,
      cloudinaryCloudName: cloudinaryStatus.cloudName,
      cloudinaryRateLimit: cloudinaryStatus.rateLimit,
    },
    config: [
      { key: "Database connection", ok: set(env.MONGODB_URI), note: "MONGODB_URI" },
      { key: "Session secret", ok: set(env.NEXTAUTH_SECRET), note: "NEXTAUTH_SECRET" },
      { key: "Cloudinary photo storage", ok: cloudinaryStatus.ok, note: cloudinaryStatus.ok ? `Connected (${cloudinaryStatus.cloudName}, ${cloudinaryStatus.latencyMs}ms)` : (cloudinaryStatus.error || "CLOUDINARY_URL (server only)") },
      { key: "Site address", ok: set(env.NEXTAUTH_URL) || set(env.APP_BASE_URL), note: "NEXTAUTH_URL / APP_BASE_URL" },
      { key: "Email sending", ok: set(env.BREVO_API_KEY) || (set(env.SMTP_HOST) && set(env.SMTP_USER) && set(env.SMTP_PASS)), note: "BREVO_API_KEY or SMTP_*; without it sign-up codes only go to the server log" },
      { key: "Google / Auth0 sign-in", ok: set(env.AUTH0_CLIENT_ID) && set(env.AUTH0_CLIENT_SECRET), note: "AUTH0_* (optional)" },
      { key: "Demo data seeding locked", ok: env.ALLOW_SEED !== "true", note: "ALLOW_SEED should be unset in production" },
    ],
    counts,
    settings,
  });
}
