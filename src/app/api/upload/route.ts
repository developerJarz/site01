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
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    let canWriteToDisk = false;
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      // Test writability
      const testFile = path.join(uploadDir, `.test-${Date.now()}`);
      await fs.writeFile(testFile, "ok");
      await fs.unlink(testFile);
      canWriteToDisk = true;
    } catch {
      canWriteToDisk = false;
    }

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const isImage =
        file.type?.startsWith("image/") ||
        /\.(jpg|jpeg|png|webp|gif|svg|avif)$/i.test(file.name);

      if (canWriteToDisk) {
        try {
          if (isImage) {
            const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
            const filepath = path.join(uploadDir, filename);

            await sharp(buffer)
              .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
              .webp({ quality: 80, effort: 4 })
              .toFile(filepath);

            urls.push(`/uploads/${filename}`);
            continue;
          } else {
            const originalExt = path.extname(file.name) || ".pdf";
            const cleanExt = originalExt.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 5);
            const filename = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${cleanExt}`;
            const filepath = path.join(uploadDir, filename);

            await fs.writeFile(filepath, buffer);
            urls.push(`/uploads/${filename}`);
            continue;
          }
        } catch (diskError) {
          console.warn("Local disk write failed, falling back to data URL:", diskError);
        }
      }

      // Vercel serverless / read-only filesystem fallback -> Compact Data URL (Base64)
      if (isImage) {
        try {
          // Compress image to WebP buffer for minimal Base64 footprint (< 100kb)
          const webpBuffer = await sharp(buffer)
            .resize(1200, 900, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();

          const base64 = webpBuffer.toString("base64");
          urls.push(`data:image/webp;base64,${base64}`);
        } catch (sharpError) {
          const mime = file.type || "image/jpeg";
          const base64 = buffer.toString("base64");
          urls.push(`data:${mime};base64,${base64}`);
        }
      } else {
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

