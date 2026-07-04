import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    version: "2026-07-04-v3",
    timestamp: new Date().toISOString(),
    env: {
      MONGODB_URI: process.env.MONGODB_URI ? "set" : "NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "NOT SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
      SMTP_HOST: process.env.SMTP_HOST || "NOT SET",
      SMTP_USER: process.env.SMTP_USER ? "set" : "NOT SET",
      SMTP_FROM: process.env.SMTP_FROM || "NOT SET",
      BREVO_API_KEY: process.env.BREVO_API_KEY ? "set" : "NOT SET",
    },
  });
}
