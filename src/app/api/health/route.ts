import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Public uptime check: up or down, nothing about the configuration. Details live in Admin → System. */
export async function GET() {
  try {
    await connectToDatabase();
    await mongoose.connection.db?.admin().ping();
    return NextResponse.json({ ok: true, timestamp: new Date().toISOString() }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ ok: false, timestamp: new Date().toISOString() }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
