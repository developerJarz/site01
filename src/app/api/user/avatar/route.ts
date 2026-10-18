import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { uploadImage, deleteImage } from "@/lib/cloudinary";
import { optimiseOrDefer } from "@/lib/image-processing";
import { ImageUploadError, MAX_IMAGE_BYTES, validateImageFile, validateUploadOrigin } from "@/lib/image-upload";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function removePrevious(publicId: string | undefined, userId: string) {
  if (publicId?.startsWith(`carhat/avatars/${userId}/`)) {
    try { await deleteImage(publicId); } catch { console.warn("Could not remove an unused profile photo from storage."); }
  }
}

function failure(error: unknown) {
  const known = error instanceof ImageUploadError;
  return NextResponse.json({ error: known ? error.message : "Couldn't update your photo. Please try again." }, { status: known ? error.status : 500 });
}

export async function POST(req: Request) {
  let newPublicId: string | undefined;
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return NextResponse.json({ error: "Sign in to change your photo." }, { status: 401 });
    validateUploadOrigin(req);
    if (Number(req.headers.get("content-length")) > MAX_IMAGE_BYTES + 1024 * 1024) {
      throw new ImageUploadError("Choose a photo smaller than 25 MB.", 413);
    }
    const form = await req.formData().catch(() => { throw new ImageUploadError("Invalid upload request."); });
    const files = form.getAll("file");
    if (files.length !== 1 || !(files[0] instanceof File)) throw new ImageUploadError("Choose one profile photo.");
    const file = files[0];
    validateImageFile(file);
    await connectToDatabase();
    if (!await User.exists({ _id: userId })) return NextResponse.json({ error: "Account not found." }, { status: 404 });

    const original = Buffer.from(await file.arrayBuffer());
    const compressed = await optimiseOrDefer(original, "avatar");
    const image = await uploadImage(compressed ?? original, userId, "avatar", { compressed: !!compressed });
    newPublicId = image.public_id;
    // Returning the previous value makes replacement safe when two uploads happen together.
    const previous = await User.findByIdAndUpdate(userId, { $set: { avatar: image.secure_url, avatarPublicId: image.public_id } }, { returnDocument: "before" }).select("+avatarPublicId");
    if (!previous) throw new ImageUploadError("Account not found.", 404);
    newPublicId = undefined;
    await removePrevious(previous.avatarPublicId, userId);
    return NextResponse.json({ avatar: image.secure_url });
  } catch (error) {
    if (newPublicId) { try { await deleteImage(newPublicId); } catch {} }
    return failure(error);
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as { id?: string } | undefined)?.id;
    if (!userId) return NextResponse.json({ error: "Sign in to change your photo." }, { status: 401 });
    validateUploadOrigin(req);
    await connectToDatabase();
    const previous = await User.findByIdAndUpdate(userId, { $unset: { avatar: "", avatarPublicId: "" } }, { returnDocument: "before" }).select("+avatarPublicId");
    if (!previous) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    await removePrevious(previous.avatarPublicId, userId);
    return NextResponse.json({ avatar: "" });
  } catch (error) { return failure(error); }
}
