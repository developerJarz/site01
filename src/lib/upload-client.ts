"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { compressImageFile } from "./image-client";

/** Listing photos are stored at 1600 px, so nothing larger is worth sending. */
const PHOTO_MAX_SIDE = 1600;
const PHOTO_QUALITY = 0.86;
/** A single photo should never take this long; past it the request is retried. */
const REQUEST_TIMEOUT_MS = 90_000;
const RETRIES = 2;
/** Photos uploading at the same time: fast on good connections, gentle on mobile data. */
const PARALLEL = 3;

export class UploadError extends Error {
  retryable: boolean;
  constructor(message: string, retryable: boolean) {
    super(message);
    this.retryable = retryable;
  }
}

/** One POST to /api/upload with progress, a timeout and cancel support. Resolves to the stored URLs. */
function postOnce(form: FormData, { onProgress, signal }: { onProgress?: (fraction: number) => void; signal?: AbortSignal }) {
  return new Promise<string[]>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", "/api/upload");
    xhr.timeout = REQUEST_TIMEOUT_MS;
    xhr.responseType = "json";
    xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress?.(e.loaded / e.total); };
    xhr.onload = () => {
      const body = (xhr.response || {}) as { urls?: string[]; error?: string };
      if (xhr.status >= 200 && xhr.status < 300 && body.urls?.length) return resolve(body.urls);
      // Server errors and gateway timeouts are worth another try; a rejected file is not.
      const retryable = xhr.status === 0 || xhr.status === 408 || xhr.status === 429 || xhr.status >= 500;
      reject(new UploadError(body.error || (retryable ? "The upload didn't finish." : "This file couldn't be uploaded."), retryable));
    };
    xhr.onerror = () => reject(new UploadError("Connection lost while uploading.", true));
    xhr.ontimeout = () => reject(new UploadError("The upload took too long.", true));
    xhr.onabort = () => reject(new DOMException("Upload cancelled", "AbortError"));
    if (signal) {
      if (signal.aborted) return xhr.abort();
      signal.addEventListener("abort", () => xhr.abort(), { once: true });
    }
    xhr.send(form);
  });
}

const wait = (ms: number, signal?: AbortSignal) => new Promise<void>((resolve, reject) => {
  const t = setTimeout(resolve, ms);
  signal?.addEventListener("abort", () => { clearTimeout(t); reject(new DOMException("Upload cancelled", "AbortError")); }, { once: true });
});

/**
 * Uploads one file: photos are shrunk in the browser first (much less to send on mobile data),
 * then sent with automatic retries on network or server hiccups.
 */
export async function uploadFile(file: File, purpose: "listing" | "documents", opts: { onProgress?: (fraction: number) => void; signal?: AbortSignal } = {}) {
  const ready = file.type.startsWith("image/")
    ? await compressImageFile(file, purpose === "listing" ? PHOTO_MAX_SIDE : 2400, purpose === "listing" ? PHOTO_QUALITY : 0.92)
    : file;
  let lastError: unknown;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await wait(800 * 2 ** (attempt - 1), opts.signal);
    const form = new FormData();
    form.append("purpose", purpose);
    form.append("files", ready);
    try {
      return await postOnce(form, opts);
    } catch (error) {
      lastError = error;
      if (!(error instanceof UploadError) || !error.retryable) throw error;
    }
  }
  throw lastError;
}

/* ─── Background photo uploads for the sell form ─────────────────────────── */

export type PhotoStatus = "queued" | "uploading" | "done" | "error";
export interface PhotoUpload {
  id: string;
  file: File;
  preview: string;
  status: PhotoStatus;
  /** 0 – 1 while uploading. */
  progress: number;
  url?: string;
  error?: string;
}

/**
 * Photos start uploading the moment they're added, a few at a time, so by the time the seller
 * presses "Post my car" most or all of them are already stored. Removing a photo cancels its upload.
 */
export function usePhotoUploads(maxPhotos: number) {
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const controllers = useRef(new Map<string, AbortController>());
  // Uploads already started, so a re-run of the effect never sends the same photo twice.
  const started = useRef(new Set<string>());
  const photosRef = useRef(photos);
  useEffect(() => { photosRef.current = photos; }, [photos]);
  const waiters = useRef<(() => void)[]>([]);

  const patch = useCallback((id: string, change: Partial<PhotoUpload>) => {
    setPhotos((all) => all.map((p) => (p.id === id ? { ...p, ...change } : p)));
  }, []);

  // Start queued photos while fewer than PARALLEL are in flight.
  useEffect(() => {
    const active = photos.filter((p) => p.status === "uploading").length;
    const next = photos.filter((p) => p.status === "queued" && !started.current.has(p.id)).slice(0, Math.max(0, PARALLEL - active));
    for (const photo of next) {
      started.current.add(photo.id);
      const controller = new AbortController();
      controllers.current.set(photo.id, controller);
      patch(photo.id, { status: "uploading", progress: 0, error: undefined });
      uploadFile(photo.file, "listing", { signal: controller.signal, onProgress: (f) => patch(photo.id, { progress: f }) })
        .then((urls) => patch(photo.id, { status: "done", progress: 1, url: urls[0] }))
        .catch((error) => {
          if ((error as Error).name === "AbortError") return;
          started.current.delete(photo.id);
          patch(photo.id, { status: "error", error: (error as Error).message || "Upload failed." });
        })
        .finally(() => controllers.current.delete(photo.id));
    }
    // Wake anyone waiting for every photo to finish.
    if (photos.every((p) => p.status === "done" || p.status === "error")) {
      waiters.current.splice(0).forEach((resolve) => resolve());
    }
  }, [photos, patch]);

  // Cancel everything and free previews when the form goes away.
  useEffect(() => () => {
    controllers.current.forEach((c) => c.abort());
    photosRef.current.forEach((p) => URL.revokeObjectURL(p.preview));
  }, []);

  const add = useCallback((files: File[]) => {
    setPhotos((all) => [
      ...all,
      ...files.slice(0, Math.max(0, maxPhotos - all.length)).map((file) => ({
        id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
        file, preview: URL.createObjectURL(file), status: "queued" as const, progress: 0,
      })),
    ]);
  }, [maxPhotos]);

  const remove = useCallback((id: string) => {
    controllers.current.get(id)?.abort();
    setPhotos((all) => {
      const gone = all.find((p) => p.id === id);
      if (gone) URL.revokeObjectURL(gone.preview);
      return all.filter((p) => p.id !== id);
    });
  }, []);

  const makeCover = useCallback((id: string) => {
    setPhotos((all) => {
      const cover = all.find((p) => p.id === id);
      return cover ? [cover, ...all.filter((p) => p.id !== id)] : all;
    });
  }, []);

  const retryFailed = useCallback(() => {
    setPhotos((all) => all.map((p) => (p.status === "error" ? { ...p, status: "queued", progress: 0, error: undefined } : p)));
  }, []);

  /** Resolves once no photo is queued or uploading. */
  const settled = useCallback(() => {
    if (photosRef.current.every((p) => p.status === "done" || p.status === "error")) return Promise.resolve();
    return new Promise<void>((resolve) => waiters.current.push(resolve));
  }, []);

  const done = photos.filter((p) => p.status === "done").length;
  const failed = photos.filter((p) => p.status === "error").length;
  // Overall progress across all photos, for the button label.
  const overall = photos.length ? photos.reduce((n, p) => n + (p.status === "done" ? 1 : p.status === "uploading" ? p.progress * 0.95 : 0), 0) / photos.length : 0;

  return { photos, add, remove, makeCover, retryFailed, settled, done, failed, overall };
}
