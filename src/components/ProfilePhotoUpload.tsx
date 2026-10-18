"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { UserAvatar } from "@/components/UserAvatar";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/page";
import { compressImageFile } from "@/lib/image-client";
import { IMAGE_ACCEPT, validateImageFile } from "@/lib/image-upload";

export function ProfilePhotoUpload({ avatar, name, onChange }: { avatar?: string; name: string; onChange: (avatar: string) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<File | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState("");
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);

  useEffect(() => () => { if (preview) URL.revokeObjectURL(preview); }, [preview]);

  function choose(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setMessage(null);
    try {
      validateImageFile(file);
      setSelected(file);
      setPreview(URL.createObjectURL(file));
    } catch (error) { setMessage({ tone: "error", text: (error as Error).message }); }
  }

  async function save(remove = false) {
    if (!remove && !selected) return;
    setBusy(true);
    setMessage(null);
    try {
      let body: FormData | undefined;
      if (!remove && selected) {
        setProgress("Optimising photo…");
        const photo = await compressImageFile(selected, 1024, 0.9);
        body = new FormData();
        body.append("file", photo);
      }
      setProgress(remove ? "Removing photo…" : "Saving photo…");
      const response = await fetch("/api/user/avatar", { method: remove ? "DELETE" : "POST", body });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Couldn't save your photo. Please try again.");
      onChange(data.avatar);
      setSelected(null);
      setPreview("");
      setMessage({ tone: "success", text: remove ? "Profile photo removed." : "Profile photo saved." });
    } catch (error) { setMessage({ tone: "error", text: (error as Error).message }); }
    finally { setBusy(false); setProgress(""); }
  }

  return (
    <div aria-busy={busy}>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <UserAvatar src={preview || avatar} name={name} size={88} className="rounded-3xl text-3xl" />
        <div className="min-w-0 space-y-3">
          <p id="photo-help" className="text-sm text-slate-text">JPG, PNG, WebP, AVIF or GIF, up to 25 MB. Photos are cropped square and compressed automatically.</p>
          <input ref={input} type="file" accept={IMAGE_ACCEPT} onChange={choose} disabled={busy} className="sr-only" tabIndex={-1} aria-label="Choose profile photo" aria-describedby="photo-help" />
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="secondary" onClick={() => input.current?.click()} disabled={busy} className="min-h-11"><Camera size={16} aria-hidden /> {avatar || selected ? "Choose another photo" : "Choose photo"}</Button>
            {selected && <Button type="button" onClick={() => void save()} disabled={busy} className="min-h-11">{busy && <Loader2 size={16} className="animate-spin" aria-hidden />} Save photo</Button>}
            {selected ? <Button type="button" variant="ghost" disabled={busy} onClick={() => { setSelected(null); setPreview(""); setMessage(null); }} className="min-h-11">Cancel</Button>
              : avatar && <Button type="button" variant="ghost" disabled={busy} onClick={() => void save(true)} className="min-h-11"><Trash2 size={16} aria-hidden /> Remove photo</Button>}
          </div>
          {selected && <p className="truncate text-sm text-slate-text">Selected: {selected.name}</p>}
        </div>
      </div>
      {progress && <p role="status" className="mt-4 flex items-center gap-2 text-sm text-slate-text"><Loader2 size={16} className="animate-spin" aria-hidden />{progress}</p>}
      {message && <Alert tone={message.tone} className="mt-4">{message.text}</Alert>}
    </div>
  );
}
