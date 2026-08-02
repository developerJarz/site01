import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import sharp from "sharp";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files uploaded" }, { status: 400 });
    }

    const urls: string[] = [];
    const isVercel = !!process.env.VERCEL || process.env.NODE_ENV === "production";
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    let canWriteToDisk = false;

    // Only attempt local disk storage in local development mode
    if (!isVercel) {
      try {
        await fs.mkdir(uploadDir, { recursive: true });
        canWriteToDisk = true;
      } catch {
        canWriteToDisk = false;
      }
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const isImage =
        file.type?.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(file.name);

      if (canWriteToDisk) {
        try {
          const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
          const filepath = path.join(uploadDir, filename);

          if (isImage) {
            await sharp(buffer)
              .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 82 })
              .toFile(filepath);
          } else {
            await fs.writeFile(filepath, buffer);
          }

          urls.push(`/uploads/${filename}`);
          continue;
        } catch (diskError) {
          console.warn("Local disk write failed, switching to Data URL:", diskError);
        }
      }

      // Vercel serverless / read-only filesystem fallback -> Data URL (Base64)
      if (isImage) {
        try {
          // Compress image to WebP buffer for minimal Base64 footprint
          const webpBuffer = await sharp(buffer)
            .resize(1200, 800, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 80 })
            .toBuffer();

          const base64 = webpBuffer.toString("base64");
          urls.push(`data:image/webp;base64,${base64}`);
        } catch (sharpError) {
          // If sharp conversion fails, output raw image buffer as base64
          const mime = file.type || "image/jpeg";
          const base64 = buffer.toString("base64");
          urls.push(`data:${mime};base64,${base64}`);
        }
      } else {
        // Document / PDF / non-image file output as base64 data URL
        const mime = file.type || "application/pdf";
        const base64 = buffer.toString("base64");
        urls.push(`data:${mime};base64,${base64}`);
      }
    }

    return NextResponse.json({ success: true, urls });
  } catch (error: any) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process upload" },
      { status: 500 }
    );
  }
}

