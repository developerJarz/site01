import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_APPEARANCE, DEFAULT_WATERMARK, HOME_SECTIONS, WATERMARK_FONTS, brandPalette, contrastOnWhite, resolveAppearance, safeHref, safeImageUrl, sanitizeAppearance, sanitizeWatermark,
} from "../src/lib/site-config.ts";

test("links accept site paths, anchors, web, email and phone links but never script", () => {
  for (const ok of ["/cars?maxPrice=1000000", "#compare", "https://facebook.com/carhat", "mailto:hi@carhat.bd", "tel:+8801700000000"]) {
    assert.equal(safeHref(ok), ok);
  }
  for (const bad of ["javascript:alert(1)", "//evil.example", "data:text/html,hi", "/cars with space", "JaVaScRiPt:alert(1)", " "]) {
    assert.equal(safeHref(bad), "", bad);
  }
});

test("images must be https uploads or files under /public", () => {
  assert.equal(safeImageUrl("https://res.cloudinary.com/x/image/upload/a.webp"), "https://res.cloudinary.com/x/image/upload/a.webp");
  assert.equal(safeImageUrl("/images/home/sell-banner.jpg"), "/images/home/sell-banner.jpg");
  assert.equal(safeImageUrl("http://insecure.example/a.png"), "");
  assert.equal(safeImageUrl("javascript:alert(1)"), "");
});

test("an empty saved document resolves to the defaults", () => {
  assert.deepEqual(resolveAppearance(undefined), DEFAULT_APPEARANCE);
  assert.deepEqual(resolveAppearance({}), DEFAULT_APPEARANCE);
});

test("homepage sections keep the saved order, drop unknown keys and add new sections at the end", () => {
  const result = sanitizeAppearance({
    homeSections: [{ key: "reviews", enabled: false }, { key: "hacked", enabled: true }, { key: "recent", enabled: true }, { key: "reviews", enabled: true }],
  });
  assert.deepEqual(result.homeSections.slice(0, 2), [{ key: "reviews", enabled: false }, { key: "recent", enabled: true }]);
  assert.equal(result.homeSections.length, HOME_SECTIONS.length);
  assert.ok(result.homeSections.every((s) => HOME_SECTIONS.some((h) => h.key === s.key)));
});

test("bad links are removed, long text is cut and the brand colour is validated", () => {
  const result = sanitizeAppearance({
    brandColor: "red",
    header: { navLinks: [{ label: "Cars", href: "/cars" }, { label: "Bad", href: "javascript:alert(1)" }, { label: "", href: "/x" }] },
    announcement: { enabled: true, text: "x".repeat(500), tone: "neon" },
    homeFaqs: [{ q: "Is it free?", a: "Yes." }, { q: "", a: "No question" }],
  });
  assert.equal(result.brandColor, "");
  assert.deepEqual(result.header.navLinks, [{ label: "Cars", href: "/cars" }]);
  assert.equal(result.announcement.text.length, 160);
  assert.equal(result.announcement.tone, "brand");
  assert.deepEqual(result.homeFaqs, [{ q: "Is it free?", a: "Yes." }]);
  assert.equal(sanitizeAppearance({ brandColor: "#0F766E" }).brandColor, "#0f766e");
});

test("fields that weren't sent keep their current values", () => {
  const current = sanitizeAppearance({ faviconUrl: "/icon.png", hero: { badge: "Old badge" } });
  const next = sanitizeAppearance({ hero: { subtitle: "New subtitle" } }, current);
  assert.equal(next.faviconUrl, "/icon.png");
  assert.equal(next.hero.badge, "Old badge");
  assert.equal(next.hero.subtitle, "New subtitle");
});

test("watermark settings are clamped to safe values", () => {
  const w = sanitizeWatermark({ opacity: 5, position: "middle", size: "huge", text: "  CarHat  " });
  assert.equal(w.text, "CarHat");
  assert.equal(w.position, "center");
  assert.equal(w.opacity, 1);
  assert.equal(w.size, "medium");
  assert.equal(sanitizeWatermark({ opacity: 0 }).opacity, 0.05);
  assert.equal(sanitizeWatermark({ enabled: false }).enabled, false);
});

test("watermark style controls only accept known fonts, real colours and ranges", () => {
  const w = sanitizeWatermark({
    font: "comic-sans", style: "neon", textColor: "red", strokeColor: "#FACC15", strokeWidth: 40, shadow: -5,
    letterSpacing: 99, scale: 10, siteLineSize: 200, rotation: 90, uppercase: "yes", uploaderPrefix: "  Uploaded   by  ",
  });
  assert.equal(w.font, DEFAULT_WATERMARK.font);
  assert.equal(w.style, DEFAULT_WATERMARK.style);
  assert.equal(w.textColor, DEFAULT_WATERMARK.textColor);
  assert.equal(w.strokeColor, "#facc15");
  assert.deepEqual([w.strokeWidth, w.shadow, w.letterSpacing, w.scale, w.siteLineSize, w.rotation], [10, 0, 30, 50, 100, 45]);
  assert.equal(w.uppercase, DEFAULT_WATERMARK.uppercase);
  assert.equal(w.uploaderPrefix, "Uploaded by");
  assert.equal(sanitizeWatermark({ font: "lobster", style: "solid-outline", rotation: -20 }).font, "lobster");
});

test("every watermark font file ships with the app", async () => {
  const { existsSync } = await import("node:fs");
  for (const f of WATERMARK_FONTS) assert.ok(existsSync(`src/assets/fonts/${f.file}`), f.file);
});

test("a light brand colour is darkened until text on white is readable", () => {
  const palette = brandPalette("#7dd3fc");
  assert.ok(palette);
  assert.ok(contrastOnWhite(palette["--color-electric"]) >= 4.5);
  assert.equal(brandPalette("#0e6aa8")["--color-electric"], "#0e6aa8");
  assert.equal(brandPalette("not-a-colour"), null);
});
