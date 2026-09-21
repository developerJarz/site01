import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

const MIME_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".avif": "image/avif",
};

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await props.params;
    
    // Prevent directory traversal attacks
    const sanitized = path.basename(filename);
    const filepath = path.join(process.cwd(), "public", "uploads", sanitized);

    const fileBuffer = await fs.readFile(filepath);
    const ext = path.extname(sanitized).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("File not found", { status: 404 });
  }
}
