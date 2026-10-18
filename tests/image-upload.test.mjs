import test from "node:test";
import assert from "node:assert/strict";
import sharp from "sharp";
import { validateImageFile, validateUploadOrigin, MAX_IMAGE_BYTES } from "../src/lib/image-upload.ts";
import { optimiseImage } from "../src/lib/image-processing.ts";

test("image uploads reject empty, oversized and executable files", () => {
  assert.throws(() => validateImageFile({ type: "image/jpeg", size: 0 }), /empty/i);
  assert.throws(() => validateImageFile({ type: "image/jpeg", size: MAX_IMAGE_BYTES + 1 }), /25 MB/);
  assert.throws(() => validateImageFile({ type: "image/svg+xml", size: 200 }), /JPG/);
  assert.doesNotThrow(() => validateImageFile({ type: "image/avif", size: 200 }));
});

test("other websites cannot upload or remove a signed-in user's photos", () => {
  assert.throws(() => validateUploadOrigin(new Request("https://carhat.example/api/user/avatar", { headers: { origin: "https://other.example" } })), /CarHat/);
  assert.throws(() => validateUploadOrigin(new Request("https://carhat.example/api/upload", { headers: { "sec-fetch-site": "cross-site" } })), /CarHat/);
  assert.doesNotThrow(() => validateUploadOrigin(new Request("https://carhat.example/api/user/avatar", { headers: { origin: "https://carhat.example" } })));
});

test("large listing photos become small AVIF files within display dimensions", async () => {
  const source = await sharp({ create: { width: 3000, height: 1800, channels: 3, background: "#5577aa" } }).png().toBuffer();
  const output = await optimiseImage(source, "listing");
  const meta = await sharp(output).metadata();
  assert.equal(meta.format, "heif");
  assert.equal(meta.compression, "av1");
  assert.equal(meta.width, 1600);
  assert.equal(meta.height, 960);
  assert.ok(output.length < source.length);
  assert.equal(meta.exif, undefined);
});

test("paper scans stay as high-quality WebP so small print is readable", async () => {
  const source = await sharp({ create: { width: 3000, height: 2000, channels: 3, background: "#ffffff" } }).png().toBuffer();
  const meta = await sharp(await optimiseImage(source, "document")).metadata();
  assert.equal(meta.format, "webp");
  assert.equal(meta.width, 2400);
});

test("avatars are cropped square without enlarging small photos", async () => {
  const source = await sharp({ create: { width: 800, height: 400, channels: 4, background: "#5577aa88" } }).png().toBuffer();
  const meta = await sharp(await optimiseImage(source, "avatar")).metadata();
  assert.equal(meta.width, 400);
  assert.equal(meta.height, 400);
  assert.equal(meta.hasAlpha, true);
});

test("photo orientation is applied before metadata is removed", async () => {
  const source = await sharp({ create: { width: 80, height: 40, channels: 3, background: "red" } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
  const meta = await sharp(await optimiseImage(source, "listing")).metadata();
  assert.equal(meta.width, 40);
  assert.equal(meta.height, 80);
  assert.equal(meta.orientation, undefined);
});

test("image content is checked even when the browser claims it is a photo", async () => {
  await assert.rejects(() => optimiseImage(Buffer.from("%PDF-1.7"), "listing"), /valid|supported/i);
  await assert.rejects(() => optimiseImage(Buffer.from('<svg width="10" height="10"></svg>'), "avatar"), /valid|supported/i);
});
