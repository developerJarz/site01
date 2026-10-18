import test from "node:test";
import assert from "node:assert/strict";
import { describeIntent, intentToParams, parseCarIntent } from "../src/lib/car-intent.ts";

test("the homepage example becomes an SUV search capped at 40 lakh", () => {
  const intent = parseCarIntent("I need SUV under 40 lakh");
  assert.deepEqual(intent, { category: "suv", maxPrice: 4_000_000 });
  assert.equal(intentToParams(intent).toString(), "category=suv&maxPrice=4000000");
  assert.equal(describeIntent(intent), "SUVs under 40 lakh");
});

test("make, city, fuel and gearbox are picked out of a sentence", () => {
  assert.deepEqual(parseCarIntent("automatic toyota hybrid in Chittagong below 25 lac"), {
    category: "hybrid", make: "Toyota", location: "Chattogram", transmission: "automatic", maxPrice: 2_500_000,
  });
  assert.equal(parseCarIntent("a diesel pickup").fuelType, "diesel");
  assert.equal(parseCarIntent("used mercedes").make, "Mercedes-Benz");
});

test("ranges, crore and bare numbers are read as buyers say them", () => {
  assert.deepEqual(parseCarIntent("sedan between 15 and 20 lakh"), { category: "sedan", minPrice: 1_500_000, maxPrice: 2_000_000 });
  assert.deepEqual(parseCarIntent("luxury 1 to 1.5 crore"), { category: "luxury", minPrice: 10_000_000, maxPrice: 15_000_000 });
  assert.equal(parseCarIntent("hatchback under 12").maxPrice, 1_200_000);
  assert.equal(parseCarIntent("budget 2500000").maxPrice, 2_500_000);
});

test("'around' gives a band either side, and nothing is invented from empty text", () => {
  assert.deepEqual(parseCarIntent("something around 30 lakh"), { minPrice: 2_550_000, maxPrice: 3_450_000 });
  assert.deepEqual(parseCarIntent("hello"), {});
  assert.equal(describeIntent({}), "cars");
});
