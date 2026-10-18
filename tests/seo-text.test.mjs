import test from "node:test";
import assert from "node:assert/strict";
import {
  autoListingDescription, autoListingTitle, cityOf, listingImageAlt, listingSeoDescription, listingSeoTitle, shareImageUrl, truncate,
} from "../src/lib/seo-text.ts";

const axio = {
  title: "Toyota Axio Hybrid G 2018 fresh", make: "Toyota", model: "Axio", year: 2018, price: 1_850_000, mileage: 45000,
  condition: "used", fuelType: "hybrid", transmission: "automatic", color: "white", location: "Mirpur, Dhaka", paperVerified: true,
};

test("listing titles are generated from the car details with city and price in lakh", () => {
  const title = autoListingTitle(axio);
  assert.match(title, /^Used 2018 Toyota Axio for Sale in Dhaka – ৳ 18\.5 Lakh$/i);
  assert.equal(listingSeoTitle({ ...axio, seoTitle: "  Custom title  " }), "Custom title");
});

test("descriptions mention specs, verified papers and stay within Google's snippet length", () => {
  const d = autoListingDescription(axio);
  assert.match(d, /hybrid, automatic, 45,000 km/);
  assert.match(d, /Papers verified/);
  assert.ok(d.length <= 158, `too long: ${d.length}`);
  assert.equal(listingSeoDescription({ ...axio, seoDescription: "Short custom." }), "Short custom.");
  assert.ok(listingSeoDescription({ ...axio, seoDescription: "x ".repeat(200) }).length <= 160);
});

test("photo alt text is descriptive, numbered after the first and overridable per photo", () => {
  assert.equal(listingImageAlt(axio, 0), "White 2018 Toyota Axio for sale in Dhaka");
  assert.equal(listingImageAlt(axio, 2), "White 2018 Toyota Axio for sale in Dhaka, photo 3");
  assert.equal(listingImageAlt({ ...axio, imageAlts: ["", "Dashboard of the Axio"] }, 1), "Dashboard of the Axio");
  assert.equal(listingImageAlt({ ...axio, imageAlts: ["", "   "] }, 1), "White 2018 Toyota Axio for sale in Dhaka, photo 2");
});

test("missing details degrade gracefully", () => {
  assert.equal(cityOf(""), "Bangladesh");
  assert.equal(cityOf("Chattogram, Bangladesh"), "Chattogram");
  assert.match(autoListingTitle({ title: "Old banger" }), /^Old banger for Sale in Bangladesh$/);
  assert.equal(listingImageAlt({ title: "Old banger" }), "Old banger for sale in Bangladesh");
});

test("truncation cuts at a word boundary", () => {
  const t = truncate("one two three four five six seven", 16);
  assert.ok(t.length <= 16);
  assert.ok(t.endsWith("…"));
  assert.ok(!/\s…$/.test(t));
});

test("share images become JPEG crops on Cloudinary and are untouched elsewhere", () => {
  const url = "https://res.cloudinary.com/ohj4cfed/image/upload/v1/carhat/listings/u/abc.avif";
  assert.equal(shareImageUrl(url), "https://res.cloudinary.com/ohj4cfed/image/upload/f_jpg,q_auto:good,w_1200,h_630,c_fill,g_auto/v1/carhat/listings/u/abc.avif");
  assert.equal(shareImageUrl("/og-default.jpg"), "/og-default.jpg");
  assert.equal(shareImageUrl(undefined), undefined);
});
