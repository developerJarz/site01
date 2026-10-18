import test from "node:test";
import assert from "node:assert/strict";
import { parseListingInput } from "../src/lib/listing-input.ts";

const valid = {
  make: " Toyota ", model: "Axio", year: "2018", price: "2450000", mileage: "62000",
  condition: "reconditioned", fuelType: "hybrid", transmission: "automatic", engineSize: "1500",
  color: "Pearl White", location: "Gulshan, Dhaka", description: "Single owner, full service history at Navana.",
  images: ["/uploads/a.webp", "/uploads/b.webp"], documents: ["/uploads/rc.webp"],
};

test("a complete form becomes a clean listing", () => {
  const result = parseListingInput(valid);
  assert.equal(result.ok, true);
  assert.equal(result.value.make, "Toyota");
  assert.equal(result.value.year, 2018);
  assert.equal(result.value.price, 2450000);
  assert.deepEqual(result.value.images, ["/uploads/a.webp", "/uploads/b.webp"]);
});

test("sellers cannot feature, verify or approve their own listing", () => {
  const result = parseListingInput({ ...valid, featured: true, paperVerified: true, status: "active", views: 99999, sellerId: "x" });
  assert.equal(result.ok, true);
  for (const key of ["featured", "paperVerified", "status", "views", "sellerId"]) assert.equal(key in result.value, false);
});

test("photos are capped at the admin's limit and must be uploads", () => {
  const images = Array.from({ length: 12 }, (_, i) => `/uploads/${i}.webp`);
  const result = parseListingInput({ ...valid, images: [...images, "javascript:alert(1)"] }, { maxImages: 5 });
  assert.equal(result.value.images.length, 5);
  assert.equal(parseListingInput({ ...valid, images: ["javascript:alert(1)"] }).ok, false);
});

test("bad numbers and unknown options are rejected or defaulted", () => {
  assert.equal(parseListingInput({ ...valid, year: "1900" }).ok, false);
  assert.equal(parseListingInput({ ...valid, price: "-5" }).ok, false);
  assert.equal(parseListingInput({ ...valid, mileage: "lots" }).ok, false);
  assert.equal(parseListingInput({ ...valid, description: "ok" }).ok, false);
  assert.equal(parseListingInput({ ...valid, fuelType: { $ne: null } }).value.fuelType, "petrol");
});
