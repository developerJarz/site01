import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { checkCloudinaryConnection } from "@/lib/cloudinary";

export const dynamic = "force-dynamic";

/**
 * Checks Cloudinary connection status, rate limits, latency, and credentials.
 * Restricted to admins.
 */
export async function GET() {
  const auth = await requireAdmin("system.view");
  if (!auth.ok) return auth.response;

  const result = await checkCloudinaryConnection();
  return NextResponse.json(result, { status: result.ok ? 200 : 503 });
}
