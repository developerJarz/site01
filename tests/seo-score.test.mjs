import test from "node:test";
import assert from "node:assert/strict";
import { scoreGrade, scorePage } from "../src/lib/seo-score.ts";

const good = {
  title: "Used car price in Bangladesh 2026 – Buy & sell cars",
  description: "Compare the used car price in Bangladesh for every make and model, see live prices in lakh and contact verified sellers directly.",
  keywords: ["used car price in Bangladesh", "buy car Bangladesh"],
  ownImage: true,
  defaultImage: true,
  noindex: false,
};

test("a well-written page scores 100", () => {
  const { score, checks } = scorePage(good);
  assert.equal(score, 100);
  assert.ok(checks.every((c) => c.status === "pass"));
  assert.equal(scoreGrade(score).label, "Good");
});

test("long titles, short descriptions and missing keywords lower the score", () => {
  const { score, checks } = scorePage({ ...good, title: "x".repeat(90), description: "Too short.", keywords: [] });
  assert.ok(score < 60, String(score));
  assert.equal(checks.find((c) => c.id === "title-length").status, "fail");
  assert.equal(checks.find((c) => c.id === "description-length").status, "fail");
  assert.equal(checks.find((c) => c.id === "keywords").status, "warn");
});

test("keyword words in a different order still count as a mention", () => {
  const { checks } = scorePage({ ...good, keywords: ["Bangladesh used car price"] });
  assert.equal(checks.find((c) => c.id === "keyword-title").status, "pass");
});

test("pages hidden from Google on purpose aren't penalised; accidental noindex is", () => {
  assert.equal(scorePage({ ...good, noindex: true, hiddenByDesign: true }).score, 100);
  assert.equal(scorePage({ ...good, noindex: true }).checks.find((c) => c.id === "indexing").status, "fail");
});

test("using only the site's default share image is a warning, not a failure", () => {
  assert.equal(scorePage({ ...good, ownImage: false }).checks.find((c) => c.id === "share-image").status, "warn");
  assert.equal(scorePage({ ...good, ownImage: false, defaultImage: false }).checks.find((c) => c.id === "share-image").status, "fail");
});
