import test from "node:test";
import assert from "node:assert/strict";
import { buildListingQuery } from "../src/lib/listing-search.ts";

const query = (value) => buildListingQuery(new URLSearchParams(value));

test("a homepage search combines model and numeric year with the existing filters", () => {
  const result = query("make=Toyota&model=Corolla+Cross&year=2022&fuelType=hybrid&location=Dhaka&minPrice=2000000&maxPrice=4000000&verified=1");
  assert.equal(result.status, "active");
  assert.equal(result.year, 2022);
  assert.match("Toyota", result.make);
  assert.doesNotMatch("Toyota Extra", result.make);
  assert.match("Corolla Cross", result.model);
  assert.doesNotMatch("Corolla", result.model);
  assert.equal(result.fuelType, "hybrid");
  assert.equal(result.paperVerified, true);
  assert.match("Gulshan, Dhaka", result.location);
  assert.deepEqual(result.price, { $gte: 2000000, $lte: 4000000 });
});

test("category browsing does not replace the shopper's text search", () => {
  const result = query("q=Harrier&category=suv");
  assert.equal(result.$and.length, 2);
  assert.equal(result.$and[0].$or.length, 4);
  const alternatives = result.$and[1].$or;
  assert.equal(alternatives[0].bodyType, "suv");
  assert.match("Harrier Premium", alternatives[1].model);
  assert.doesNotMatch("Premio", alternatives[1].model);
});

test("hybrid and electric categories use the real fuel field", () => {
  assert.equal(query("category=hybrid").fuelType, "hybrid");
  assert.equal(query("category=electric").fuelType, "electric");
});

test("search treats regular expression characters as literal user input", () => {
  const result = query("make=Toyota%28%2B%29&model=A.%2A&location=%28Dhaka%29");
  assert.match("Toyota(+)", result.make);
  assert.doesNotMatch("Toyota", result.make);
  assert.match("A.*", result.model);
  assert.doesNotMatch("Axio", result.model);
  assert.match("(Dhaka)", result.location);
});

test("invalid budgets cannot silently remove a price constraint", () => {
  for (const value of ["maxPrice=NaN", "minPrice=-1", "maxPrice=Infinity", "minPrice=4000000&maxPrice=2000000"]) {
    assert.throws(() => query(value), RangeError);
  }
});

test("invalid years cannot silently broaden a search", () => {
  for (const value of ["year=nope", "year=2022.5", "year=1000", "year=9999"]) {
    assert.throws(() => query(value), RangeError);
  }
});

test("an empty search still returns only active listings", () => {
  assert.deepEqual(query(""), { status: "active" });
});

test("existing condition and transmission filters keep working", () => {
  const result = query("condition=reconditioned&transmission=automatic&maxPrice=0");
  assert.equal(result.condition, "reconditioned");
  assert.equal(result.transmission, "automatic");
  assert.deepEqual(result.price, { $lte: 0 });
});

test("a dealer's stock can be listed by seller id, and malformed ids are ignored", () => {
  assert.equal(query("seller=64b7f0c2a1b2c3d4e5f60718").sellerId, "64b7f0c2a1b2c3d4e5f60718");
  assert.equal("sellerId" in query("seller=%7B%22%24ne%22%3Anull%7D"), false);
  assert.equal("sellerId" in query("seller=abc"), false);
});
