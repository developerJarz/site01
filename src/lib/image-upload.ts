export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
export const IMAGE_ACCEPT = IMAGE_MIME_TYPES.join(",");
export const MAX_IMAGE_BYTES = 25 * 1024 * 1024;

export class ImageUploadError extends Error {
  status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "ImageUploadError";
    this.status = status;
  }
}

export function validateImageFile(file: Pick<File, "type" | "size">) {
  if (!IMAGE_MIME_TYPES.includes(file.type)) {
    throw new ImageUploadError("Choose a JPG, PNG, WebP, AVIF or GIF photo.");
  }
  if (!file.size) throw new ImageUploadError("This photo is empty. Choose another file.");
  if (file.size > MAX_IMAGE_BYTES) throw new ImageUploadError("Choose a photo smaller than 25 MB.", 413);
}

export function validateUploadOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ImageUploadError("This request must come from CarHat.", 403);
  }
}
