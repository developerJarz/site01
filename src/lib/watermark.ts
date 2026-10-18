import path from "node:path";
import { existsSync } from "node:fs";
import type { Sharp } from "sharp";
import { DEFAULT_WATERMARK, WATERMARK_FONTS, type WatermarkSettings } from "./site-config.ts";

export type WatermarkPosition = WatermarkSettings["position"];

/** The look of the mark: everything from Admin → Settings → Photo protection except on/off and the text. */
export type WatermarkStyleOptions = Pick<WatermarkSettings,
  "font" | "style" | "textColor" | "strokeColor" | "strokeWidth" | "shadow" | "letterSpacing" | "uppercase" | "scale" | "siteLineSize" | "rotation">;

/**
 * What to stamp on a listing photo. Two lines, centred under each other: `title` (the site name)
 * is the smaller top line, `subtitle` (the uploader) the larger bottom line. Without an uploader
 * the site name is drawn alone at the larger size. Style options left out use the defaults.
 */
export interface WatermarkSpec extends Partial<WatermarkStyleOptions> {
  title: string;
  subtitle?: string;
  position: WatermarkPosition;
  /** How solid the mark is, 0.05 – 1. */
  opacity: number;
  size: WatermarkSettings["size"];
}

/** Turns the saved settings into what gets drawn. Shared by uploads and the dashboard's live preview. */
export function watermarkSpecFromSettings(w: WatermarkSettings, siteName: string, uploader: string): WatermarkSpec {
  const name = w.showUploader ? uploader.trim().slice(0, 40) : "";
  return {
    title: w.text || siteName,
    // The bottom, larger line: the uploader's (or dealership's) name, after the optional prefix.
    subtitle: name ? (w.uploaderPrefix ? `${w.uploaderPrefix} ${name}` : name) : undefined,
    position: w.position, opacity: w.opacity, size: w.size,
    font: w.font, style: w.style, textColor: w.textColor, strokeColor: w.strokeColor, strokeWidth: w.strokeWidth, shadow: w.shadow,
    letterSpacing: w.letterSpacing, uppercase: w.uppercase, scale: w.scale, siteLineSize: w.siteLineSize, rotation: w.rotation,
  };
}

type SharpFactory = (input?: Buffer | object, options?: object) => Sharp;
type Rgb = [number, number, number];

// Shipped with the app (see outputFileTracingIncludes in next.config.ts) so text renders the same
// on every host, including serverless ones without system fonts.
const FONT_DIR = path.join(process.cwd(), "src", "assets", "fonts");
const SIZE_FACTOR = { small: 0.018, medium: 0.025, large: 0.034 } as const;
/** A centred mark sits across the car, so it is drawn larger than a corner one. */
const CENTER_SCALE = 1.9;
/** The mark never takes more than this share of the photo's width. */
const MAX_WIDTH_SHARE = 0.86;
const SHADOW_RGB: Rgb = [11, 29, 54];

const escapeMarkup = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
const toRgb = (hex: string): Rgb => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) || 0) as Rgb;

function resolveStyle(spec: WatermarkSpec): WatermarkStyleOptions {
  const d = DEFAULT_WATERMARK;
  return {
    font: spec.font ?? d.font, style: spec.style ?? d.style, textColor: spec.textColor ?? d.textColor, strokeColor: spec.strokeColor ?? d.strokeColor,
    strokeWidth: spec.strokeWidth ?? d.strokeWidth, shadow: spec.shadow ?? d.shadow, letterSpacing: spec.letterSpacing ?? d.letterSpacing,
    uppercase: spec.uppercase ?? d.uppercase, scale: spec.scale ?? d.scale, siteLineSize: spec.siteLineSize ?? d.siteLineSize, rotation: spec.rotation ?? d.rotation,
  };
}

/** The letter shapes (alpha only) of one line of text, in the chosen font, case and spacing. */
async function textMask(sharp: SharpFactory, text: string, size: number, style: WatermarkStyleOptions) {
  const font = WATERMARK_FONTS.find((f) => f.key === style.font) || WATERMARK_FONTS[0];
  const file = path.join(FONT_DIR, font.file);
  const hasFont = existsSync(file);
  const spacing = Math.round(size * (style.letterSpacing / 100) * 1024); // Pango units: 1024 per point; 1 pt = 1 px at 72 dpi
  const label = style.uppercase ? text.toUpperCase() : text;
  const markup = `<span foreground="#FFFFFF" letter_spacing="${spacing}">${escapeMarkup(label)}</span>`;
  const description = hasFont ? `${font.family}${font.weight === "bold" ? " Bold" : ""} ${size}` : `sans-serif ${size}`;
  const { data, info } = await sharp({
    text: { text: markup, font: description, ...(hasFont ? { fontfile: file } : {}), rgba: true, dpi: 72 },
  }).png().toBuffer({ resolveWithObject: true });
  return { data, width: info.width, height: info.height };
}

/**
 * Grows a soft-edged shape by `radius` pixels (a round brush, keeping the anti-aliased edges).
 * sharp's own dilate needs a hard black-and-white mask, which breaks thin, smooth letters.
 */
export function growShape(alpha: Buffer, width: number, height: number, radius: number) {
  // The round brush is a stack of horizontal spans: row dy reaches `half[dy]` pixels each side.
  const half = Array.from({ length: radius * 2 + 1 }, (_, i) => {
    const dy = i - radius;
    return Math.floor(Math.sqrt(Math.max(0, radius * radius + radius - dy * dy)));
  });
  // Running maximum along each row for every span width the brush uses, computed once per width
  // in linear time (van Herk / Gil-Werman), so thick outlines cost about the same as thin ones.
  const rowMax = new Map<number, Uint8Array>();
  for (const h of new Set(half)) rowMax.set(h, slidingRowMax(alpha, width, height, h));

  const out = Buffer.alloc(width * height);
  for (let y = 0; y < height; y++) {
    for (let i = 0; i < half.length; i++) {
      const ny = y + i - radius;
      if (ny < 0 || ny >= height) continue;
      const src = rowMax.get(half[i])!;
      const from = ny * width, to = y * width;
      for (let x = 0; x < width; x++) if (src[from + x] > out[to + x]) out[to + x] = src[from + x];
    }
  }
  return out;
}

/** For each pixel, the largest value within `h` pixels to its left or right on the same row. */
function slidingRowMax(src: Buffer, width: number, height: number, h: number) {
  const out = new Uint8Array(width * height);
  if (h === 0) { out.set(src); return out; }
  // Each row is padded with h zeros on both sides so every window is exactly `size` wide, which
  // keeps the block trick exact at the row ends.
  const size = h * 2 + 1;
  const n = width + h * 2;
  const padded = new Uint8Array(n), left = new Uint8Array(n), right = new Uint8Array(n);
  for (let y = 0; y < height; y++) {
    const row = y * width;
    padded.set(src.subarray(row, row + width), h);
    for (let i = 0; i < n; i++) left[i] = i % size === 0 ? padded[i] : Math.max(left[i - 1], padded[i]);
    for (let i = n - 1; i >= 0; i--) right[i] = i === n - 1 || (i + 1) % size === 0 ? padded[i] : Math.max(right[i + 1], padded[i]);
    // Pixel x covers padded[x .. x + 2h].
    for (let x = 0; x < width; x++) out[row + x] = Math.max(right[x], left[x + size - 1]);
  }
  return out;
}

/**
 * One line of the mark as RGBA. The edge is made from the letter shapes: grow them by the edge
 * width and cut the original letters out, leaving a ring around each letter. Solid styles fill the
 * letters; the outline style leaves them see-through. `shape` is what the shadow follows.
 */
async function renderLine(sharp: SharpFactory, text: string, size: number, style: WatermarkStyleOptions, opacity: number) {
  const mask = await textMask(sharp, text, size, style);
  const outlined = style.style !== "solid";
  const stroke = outlined ? Math.max(1, Math.round(size * style.strokeWidth * 0.009)) : 0;
  const pad = stroke + 1;
  const width = mask.width + pad * 2;
  const height = mask.height + pad * 2;
  const fill = await sharp(mask.data)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .extractChannel(3)
    .raw()
    .toBuffer();
  const grown = outlined ? growShape(fill, width, height, stroke) : fill;
  const filled = style.style !== "outline";
  const [fr, fg, fb] = toRgb(style.textColor);
  const [sr, sg, sb] = toRgb(style.strokeColor);

  const out = Buffer.alloc(width * height * 4);
  const shape = Buffer.alloc(width * height);
  for (let i = 0; i < width * height; i++) {
    const letter = filled ? fill[i] : 0;
    const edge = outlined ? Math.max(0, grown[i] - fill[i]) : 0;
    // Letter colour inside, edge colour around it, blended where anti-aliased pixels meet.
    const total = letter + edge;
    if (total === 0) continue;
    out[i * 4] = Math.round((fr * letter + sr * edge) / total);
    out[i * 4 + 1] = Math.round((fg * letter + sg * edge) / total);
    out[i * 4 + 2] = Math.round((fb * letter + sb * edge) / total);
    out[i * 4 + 3] = Math.round(Math.min(255, total) * opacity);
    shape[i] = Math.min(255, total);
  }
  return { data: await sharp(out, { raw: { width, height, channels: 4 } }).png().toBuffer(), width, height, shape };
}

/** A soft dark copy of the line, drawn underneath so light marks still show on white cars. */
async function lineShadow(sharp: SharpFactory, line: { shape: Buffer; width: number; height: number }, alpha: number, blur: number) {
  const out = Buffer.alloc(line.width * line.height * 4);
  for (let i = 0; i < line.width * line.height; i++) {
    out[i * 4] = SHADOW_RGB[0]; out[i * 4 + 1] = SHADOW_RGB[1]; out[i * 4 + 2] = SHADOW_RGB[2];
    out[i * 4 + 3] = Math.round(line.shape[i] * alpha);
  }
  return sharp(out, { raw: { width: line.width, height: line.height, channels: 4 } }).blur(blur).png().toBuffer();
}

async function renderLines(sharp: SharpFactory, spec: WatermarkSpec, style: WatermarkStyleOptions, mainSize: number, opacity: number) {
  if (!spec.subtitle) return { top: null, bottom: await renderLine(sharp, spec.title, mainSize, style, opacity) };
  const [top, bottom] = await Promise.all([
    renderLine(sharp, spec.title, Math.max(10, Math.round(mainSize * style.siteLineSize / 100)), style, opacity),
    renderLine(sharp, spec.subtitle, mainSize, style, opacity),
  ]);
  return { top, bottom };
}

type PlacedMark = { input: Buffer; left: number; top: number } | null;

// Most listings are a handful of photos with the same few sizes, so the drawn mark is reused:
// only the first photo of each size pays for drawing it.
const CACHE_LIMIT = 24;
const markCache = new Map<string, Promise<PlacedMark>>();

/**
 * Builds the watermark for a photo of the given size and returns it with where it goes.
 * Returns null when the photo is too small to carry it.
 */
export function buildWatermark(sharp: SharpFactory, width: number, height: number, spec: WatermarkSpec): Promise<PlacedMark> {
  const key = JSON.stringify([width, height, spec]);
  const hit = markCache.get(key);
  if (hit) {
    // Refresh its place so the least recently used mark is the one dropped.
    markCache.delete(key);
    markCache.set(key, hit);
    return hit;
  }
  const made = drawWatermark(sharp, width, height, spec);
  markCache.set(key, made);
  made.catch(() => markCache.delete(key));
  if (markCache.size > CACHE_LIMIT) markCache.delete(markCache.keys().next().value!);
  return made;
}

async function drawWatermark(sharp: SharpFactory, width: number, height: number, spec: WatermarkSpec): Promise<PlacedMark> {
  const style = resolveStyle(spec);
  const opacity = Math.min(1, Math.max(0.05, spec.opacity));
  const scale = (spec.position === "center" ? CENTER_SCALE : 1) * (style.scale / 100);
  let mainSize = Math.round(Math.min(220, Math.max(12, width * SIZE_FACTOR[spec.size] * scale)));

  let lines = await renderLines(sharp, spec, style, mainSize, opacity);
  // Long names (or a big size) are shrunk to fit rather than dropped.
  const widest = () => Math.max(lines.top?.width || 0, lines.bottom.width);
  if (widest() > width * MAX_WIDTH_SHARE) {
    mainSize = Math.max(10, Math.floor(mainSize * (width * MAX_WIDTH_SHARE) / widest()));
    lines = await renderLines(sharp, spec, style, mainSize, opacity);
  }
  const { top, bottom } = lines;

  const blur = Math.max(1, mainSize * 0.04);
  const pad = Math.ceil(blur * 3);
  const gap = top ? Math.round(mainSize * 0.08) : 0;
  const innerW = widest();
  const boxW = innerW + pad * 2;
  const boxH = (top ? top.height + gap : 0) + bottom.height + pad * 2;

  const centerX = (w: number) => pad + Math.round((innerW - w) / 2);
  const bottomTop = pad + (top ? top.height + gap : 0);
  const rows = [[top, pad], [bottom, bottomTop]] as const;
  const layers: { input: Buffer; left: number; top: number }[] = [];
  if (style.shadow > 0) {
    const shadowAlpha = (style.shadow / 100) * (0.5 + 0.5 * opacity);
    for (const [line, y] of rows) {
      if (line) layers.push({ input: await lineShadow(sharp, line, shadowAlpha, blur), left: centerX(line.width), top: y + Math.max(1, Math.round(mainSize * 0.02)) });
    }
  }
  for (const [line, y] of rows) if (line) layers.push({ input: line.data, left: centerX(line.width), top: y });

  let badge = await sharp({ create: { width: boxW, height: boxH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } })
    .composite(layers)
    .png()
    .toBuffer();
  let badgeW = boxW, badgeH = boxH;
  if (style.rotation) {
    const rotated = await sharp(badge).rotate(style.rotation, { background: { r: 0, g: 0, b: 0, alpha: 0 } }).png().toBuffer({ resolveWithObject: true });
    badge = rotated.data;
    badgeW = rotated.info.width;
    badgeH = rotated.info.height;
  }

  const margin = Math.round(Math.min(width, height) * 0.03);
  if (badgeW + margin * 2 > width || badgeH + margin * 2 > height) return null;
  const right = width - badgeW - margin;
  const below = height - badgeH - margin;
  const at = {
    "bottom-right": { left: right, top: below },
    "bottom-left": { left: margin, top: below },
    "top-right": { left: right, top: margin },
    "top-left": { left: margin, top: margin },
    center: { left: Math.round((width - badgeW) / 2), top: Math.round((height - badgeH) / 2) },
  }[spec.position];
  return { input: badge, ...at };
}

const GRAVITY: Record<WatermarkPosition, string> = {
  "bottom-right": "south_east", "bottom-left": "south_west", "top-right": "north_east", "top-left": "north_west", center: "center",
};

/**
 * A simpler version of the mark as a Cloudinary text overlay, used only when this host can't run
 * sharp and Cloudinary resizes the original instead (longest side 1600px). Cloudinary can't draw
 * see-through letters or the bundled fonts, so it uses Arial in the edge or fill colour.
 */
export function cloudinaryWatermark(spec: WatermarkSpec) {
  const style = resolveStyle(spec);
  const scale = (spec.position === "center" ? CENTER_SCALE : 1) * (style.scale / 100);
  const fontSize = Math.round(1600 * SIZE_FACTOR[spec.size] * scale * (spec.subtitle ? 0.8 : 1));
  const raw = spec.subtitle ? `${spec.title}\n${spec.subtitle}` : spec.title;
  const label = style.uppercase ? raw.toUpperCase() : raw;
  return {
    overlay: { font_family: "Arial", font_size: fontSize, text_align: "center", letter_spacing: Math.round(fontSize * style.letterSpacing / 100), text: label },
    color: style.style === "outline" ? style.strokeColor : style.textColor,
    // Outline-only letters look lighter than solid ones; the solid stand-in is a little more see-through.
    opacity: Math.round(Math.min(1, Math.max(0.05, spec.opacity)) * (style.style === "outline" ? 75 : 100)),
    gravity: GRAVITY[spec.position],
    ...(style.rotation ? { angle: style.rotation } : {}),
    x: spec.position === "center" ? 0 : 24,
    y: spec.position === "center" ? 0 : 24,
  };
}
