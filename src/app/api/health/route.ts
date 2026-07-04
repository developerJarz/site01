import { NextResponse } from "next/server";

function cleanMongoUri(uri: string): string {
  if (!uri) return uri;
  const qIndex = uri.indexOf("?");
  if (qIndex === -1) return uri;
  const base = uri.substring(0, qIndex);
  const queryString = uri.substring(qIndex + 1);
  const unsupported = ["retrywrites", "w", "appname"];
  const params = queryString
    .split("&")
    .filter((param) => {
      const key = param.split("=")[0].toLowerCase();
      return !unsupported.includes(key);
    });
  if (params.length === 0) return base;
  return base + "?" + params.join("&");
}

export async function GET() {
  const rawUri = process.env.MONGODB_URI || "";
  const cleanedUri = cleanMongoUri(rawUri);
  
  // Extract just the query string for debugging (no credentials)
  const rawQuery = rawUri.includes("?") ? rawUri.split("?")[1] : "(no query string)";
  const cleanedQuery = cleanedUri.includes("?") ? cleanedUri.split("?")[1] : "(no query string)";
  
  return NextResponse.json({
    version: "2026-07-04-v4",
    timestamp: new Date().toISOString(),
    mongoDebug: {
      rawUriLength: rawUri.length,
      hasQuestionMark: rawUri.includes("?"),
      rawQueryString: rawQuery,
      cleanedQueryString: cleanedQuery,
      rawUriRedacted: rawUri.replace(/\/\/[^@]+@/, "//***:***@"),
      cleanedUriRedacted: cleanedUri.replace(/\/\/[^@]+@/, "//***:***@"),
    },
    env: {
      MONGODB_URI: rawUri ? "set" : "NOT SET",
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET ? "set" : "NOT SET",
      NEXTAUTH_URL: process.env.NEXTAUTH_URL || "NOT SET",
      SMTP_HOST: process.env.SMTP_HOST || "NOT SET",
      SMTP_USER: process.env.SMTP_USER ? "set" : "NOT SET",
      SMTP_FROM: process.env.SMTP_FROM || "NOT SET",
      BREVO_API_KEY: process.env.BREVO_API_KEY ? "set" : "NOT SET",
    },
  });
}

