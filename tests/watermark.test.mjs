import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { buildWatermark, cloudinaryWatermark, growShape } from "../src/lib/watermark.ts";

const sharp = createRequire(import.meta.url)("sharp");
const spec = { title: "CarHat.bd", subtitle: "Rahim Ahmed", position: "bottom-right", opacity: 0.85, size: "medium" };

test("the badge sits inside the photo, in the chosen corner", async () => {
  const mark = await buildWatermark(sharp, 1600, 1067, spec);
  assert.ok(mark);
  const { width, height } = await sharp(mark.input).metadata();
  assert.ok(mark.left > 800 && mark.left + width < 1600);
  assert.ok(mark.top > 533 && mark.top + height < 1067);

  const topLeft = await buildWatermark(sharp, 1600, 1067, { ...spec, position: "top-left" });
  assert.ok(topLeft.left < 100 && topLeft.top < 100);
});

test("photos too small for the badge are left alone", async () => {
  assert.equal(await buildWatermark(sharp, 60, 40, spec), null);
});

test("text with markup characters is drawn, not interpreted", async () => {
  const mark = await buildWatermark(sharp, 1200, 800, { ...spec, subtitle: "<b>Rahim & Sons</b>" });
  assert.ok(mark);
});

test("the letters are outlines: see-through inside, with a semi-transparent light stroke", async () => {
  // The default look: transparency comes from the dashboard slider (65% solid by default).
  const mark = await buildWatermark(sharp, 1600, 1067, { ...spec, position: "center", opacity: 0.65 });
  const { data, info } = await sharp(mark.input).raw().toBuffer({ resolveWithObject: true });
  let stroke = 0, maxAlpha = 0;
  for (let i = 0; i < data.length; i += info.channels) {
    // Light pixels are the outline; the faint dark shadow under it doesn't count.
    if (data[i] > 200 && data[i + 3] > 40) stroke++;
    maxAlpha = Math.max(maxAlpha, data[i + 3]);
  }
  // Thin outlines cover only a small share of the block, and stay semi-transparent.
  assert.ok(stroke / (info.width * info.height) < 0.35, String(stroke / (info.width * info.height)));
  assert.ok(maxAlpha < 255);
});

test("very long names are shrunk to fit instead of being dropped", async () => {
  const mark = await buildWatermark(sharp, 1600, 1067, { ...spec, position: "center", subtitle: "Bangladesh Reconditioned Car Traders Association" });
  assert.ok(mark);
  assert.ok((await sharp(mark.input).metadata()).width <= 1600 * 0.9);
});

test("the Cloudinary fallback places the same text in the same corner", () => {
  const overlay = cloudinaryWatermark(spec);
  assert.equal(overlay.gravity, "south_east");
  assert.equal(overlay.overlay.text, "CARHAT.BD\nRAHIM AHMED");
  assert.equal(overlay.opacity, 64); // outline style: 0.85 × 75, a little lighter than solid
  assert.equal(cloudinaryWatermark({ ...spec, position: "center" }).x, 0);
});

test("the centred mark is larger than a corner one and sits in the middle", async () => {
  const center = await buildWatermark(sharp, 1600, 1067, { ...spec, position: "center" });
  const corner = await buildWatermark(sharp, 1600, 1067, spec);
  const c = await sharp(center.input).metadata();
  const k = await sharp(corner.input).metadata();
  assert.ok(c.width > k.width * 1.5);
  assert.ok(Math.abs(center.left + c.width / 2 - 800) <= 1);
  assert.ok(Math.abs(center.top + c.height / 2 - 533.5) <= 1);
});

test("solid letters in the chosen colour, outlines in theirs", async () => {
  const pixels = async (opts) => {
    const mark = await buildWatermark(sharp, 1600, 1067, { ...spec, position: "center", opacity: 1, shadow: 0, ...opts });
    const { data, info } = await sharp(mark.input).raw().toBuffer({ resolveWithObject: true });
    const seen = [];
    for (let i = 0; i < data.length; i += info.channels) if (data[i + 3] > 200) seen.push([data[i], data[i + 1], data[i + 2]]);
    return seen;
  };
  const solid = await pixels({ style: "solid", textColor: "#ff0000" });
  assert.ok(solid.length > 0 && solid.every(([r, g, b]) => r > 240 && g < 20 && b < 20));
  const outline = await pixels({ style: "outline", strokeColor: "#00ff00" });
  assert.ok(outline.length > 0 && outline.every(([r, g, b]) => g > 240 && r < 20 && b < 20));
});

test("a tilted mark is still placed fully inside the photo", async () => {
  const mark = await buildWatermark(sharp, 1600, 1067, { ...spec, position: "center", rotation: -30, scale: 150 });
  const { width, height } = await sharp(mark.input).metadata();
  assert.ok(mark.left >= 0 && mark.top >= 0 && mark.left + width <= 1600 && mark.top + height <= 1067);
});

test("each bundled font draws differently", async () => {
  const widths = new Set();
  for (const font of ["geist", "anton", "lobster", "courier-prime"]) {
    const mark = await buildWatermark(sharp, 1600, 1067, { ...spec, position: "center", font, shadow: 0 });
    widths.add((await sharp(mark.input).metadata()).width);
  }
  assert.equal(widths.size, 4);
});

test("the fast outline grower matches the simple pixel-by-pixel version", () => {
  const naive = (alpha, w, h, r) => {
    const out = Buffer.alloc(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      let max = 0;
      for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
        if (dx * dx + dy * dy > r * r + r) continue;
        const nx = x + dx, ny = y + dy;
        if (nx >= 0 && ny >= 0 && nx < w && ny < h) max = Math.max(max, alpha[ny * w + nx]);
      }
      out[y * w + x] = max;
    }
    return out;
  };
  let seed = 7;
  const random = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (const [w, h, r] of [[37, 23, 1], [64, 40, 3], [50, 50, 6], [9, 30, 10]]) {
    // Sparse soft dots, like the anti-aliased edges of letters.
    const alpha = Buffer.from(Array.from({ length: w * h }, () => (random() < 0.05 ? Math.floor(random() * 256) : 0)));
    assert.deepEqual(growShape(alpha, w, h, r), naive(alpha, w, h, r), `${w}x${h} r=${r}`);
  }
});

test("photos of the same size reuse the drawn mark", async () => {
  const opts = { ...spec, position: "center", font: "poppins", strokeWidth: 7 };
  const first = await buildWatermark(sharp, 1500, 1000, opts);
  const second = await buildWatermark(sharp, 1500, 1000, opts);
  assert.equal(first, second);
});
