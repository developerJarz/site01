"use client";

import { useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { Button, Field, inputClass } from "./ui";
import { useToast } from "./Toast";
import { compressImageFile } from "@/lib/image-client";
import { cn } from "@/lib/utils";

/** Uploads a website image (logo, banner, share image) to Cloudinary. Site images are never watermarked. */
export async function uploadSiteImage(file: File, { png = false }: { png?: boolean } = {}) {
  const fd = new FormData();
  fd.append("purpose", "site");
  if (png) fd.append("format", "png");
  // PNG keeps transparency and sharp edges for logos and favicons; photos are shrunk first.
  fd.append("files", png || file.type === "image/png" ? file : await compressImageFile(file, 2400, 0.9));
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.urls?.[0]) throw new Error(data.error || "Upload failed.");
  return data.urls[0] as string;
}

export function ImageField({
  id,
  label,
  value,
  onChange,
  hint,
  placeholder = "https://… or /og-default.jpg",
  png,
  preview = "wide",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  /** Keep the upload as PNG (favicons). */
  png?: boolean;
  preview?: "wide" | "logo" | "square" | false;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const toast = useToast();
  return (
    <Field label={label} htmlFor={id} hint={hint}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {preview && (
          <div
            className={cn(
              "relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-hairline bg-[conic-gradient(#f1f5f9_25%,#fff_0_50%,#f1f5f9_0_75%,#fff_0)] bg-[length:16px_16px]",
              preview === "wide" && "aspect-[1200/630] w-full sm:w-36",
              preview === "logo" && "h-12 w-full sm:w-36",
              preview === "square" && "size-12"
            )}
          >
            {value ? (
              // eslint-disable-next-line @next/next/no-img-element -- admin preview of any uploaded URL
              <img src={value} alt="" className={cn("max-h-full max-w-full", preview === "wide" ? "size-full object-cover" : "object-contain p-1")} />
            ) : (
              <span className="text-[11px] font-semibold text-slate-text">None</span>
            )}
          </div>
        )}
        <div className="flex min-w-0 grow gap-2">
          <input id={id} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={cn(inputClass, "min-w-0")} />
          {value && (
            <Button type="button" variant="ghost" onClick={() => onChange("")} aria-label={`Clear ${label}`} className="px-2.5">
              <X size={16} aria-hidden />
            </Button>
          )}
          <Button type="button" loading={busy} onClick={() => input.current?.click()}>
            <ImageUp size={16} aria-hidden /> <span className="hidden sm:inline">Upload</span>
          </Button>
        </div>
        <input
          ref={input}
          type="file"
          accept={png ? "image/png,image/jpeg,image/webp" : "image/jpeg,image/png,image/webp"}
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            setBusy(true);
            try {
              onChange(await uploadSiteImage(file, { png }));
              toast.success("Image uploaded. Save to publish it.");
            } catch (err) {
              toast.error((err as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        />
      </div>
    </Field>
  );
}
