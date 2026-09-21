import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";

export const dynamic = "force-dynamic";

// Safely attempt to load sharp if available on the server runtime
async function getSharp() {
  try {
    const sharpModule = await import("sharp");
    return sharpModule.default || sharpModule;
  } catch (e) {
    console.warn("Sharp native module not available, using raw buffer fallback:", e);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const rawFiles = formData.getAll("files");

    if (!rawFiles || rawFiles.length === 0) {
      return NextResponse.json({ error: "No files provided in request" }, { status: 400 });
    }

    const files: File[] = [];
    for (const item of rawFiles) {
      if (item && typeof (item as any).arrayBuffer === "function") {
        files.push(item as File);
      }
    }

    if (files.length === 0) {
      return NextResponse.json({ error: "No valid file objects received" }, { status: 400 });
    }

    const urls: string[] = [];
    const uploadDir = path.join(process.cwd(), "public", "uploads");

    let canWriteToDisk = false;
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      const testFile = path.join(uploadDir, `.write-test-${Date.now()}`);
      await fs.writeFile(testFile, "ok");
      await fs.unlink(testFile);
      canWriteToDisk = true;
    } catch {
      canWriteToDisk = false;
    }

    const sharp = await getSharp();

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

            if (sharp) {
              try {
                await sharp(buffer)
                  .resize(1600, 1200, { fit: "inside", withoutEnlargement: true })
                  .webp({ quality: 80, effort: 4 })
                  .toFile(filepath);
                urls.push(`/uploads/${filename}`);
                continue;
              } catch (sharpProcessErr) {
                console.warn("Sharp image transform failed, writing buffer directly:", sharpProcessErr);
              }
            }

            // Direct buffer write (loss-free, fast, no native dependency needed)
            await fs.writeFile(filepath, buffer);
            urls.push(`/uploads/${filename}`);
            continue;
          } else {
            // Non-image Document (PDF, etc.)
            const rawExt = path.extname(file.name || "") || ".pdf";
            const cleanExt = rawExt.replace(/[^a-zA-Z0-9.]/g, "").slice(0, 6) || ".pdf";
            const filename = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${cleanExt}`;
            const filepath = path.join(uploadDir, filename);

            await fs.writeFile(filepath, buffer);
            urls.push(`/uploads/${filename}`);
            continue;
          }
        } catch (diskWriteErr) {
          console.warn("Disk write error, falling back to data URL:", diskWriteErr);
        }
      }

      // Read-only filesystem / Serverless Fallback -> Data URL (Base64)
      if (isImage && sharp) {
        try {
          const webpBuffer = await sharp(buffer)
            .resize(1200, 900, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 75 })
            .toBuffer();
          const base64 = webpBuffer.toString("base64");
          urls.push(`data:image/webp;base64,${base64}`);
          continue;
        } catch (sharpErr) {
          console.warn("Sharp buffer conversion failed, using raw buffer:", sharpErr);
        }
      }

      // Raw buffer to base64
      const mime = file.type || (isImage ? "image/webp" : "application/pdf");
      const base64 = buffer.toString("base64");
      urls.push(`data:${mime};base64,${base64}`);
    }

    return NextResponse.json({ success: true, urls });
  } catch (error: any) {
    console.error("Upload fatal error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process upload" },
      { status: 500 }
    );
  }
}


