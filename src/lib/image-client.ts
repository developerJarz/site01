import { validateImageFile } from "./image-upload";

/** Reduce phone photos before sending them, keeping the original when encoding would make it larger. */
export async function compressImageFile(file: File, maxDimension = 2048, quality = 0.92): Promise<File> {
  validateImageFile(file);
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    const finish = (result: File) => { URL.revokeObjectURL(url); resolve(result); };
    image.onerror = () => finish(file);
    image.onload = () => {
      const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
      if (ratio === 1 && file.size <= 300 * 1024) return finish(file);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
      const context = canvas.getContext("2d");
      if (!context) return finish(file);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      canvas.toBlob((blob) => {
        if (!blob || (ratio === 1 && blob.size >= file.size)) return finish(file);
        const extension = blob.type === "image/webp" ? "webp" : "png";
        finish(new File([blob], `${file.name.replace(/\.[^/.]+$/, "")}.${extension}`, { type: blob.type }));
      }, "image/webp", quality);
    };
    image.src = url;
  });
}
