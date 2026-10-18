import test from "node:test";
import assert from "node:assert/strict";
import { parseFavoriteMutation } from "../src/lib/favorite-request.ts";

const carId = "507f1f77bcf86cd799439011";
const request = (body, headers = {}) => new Request("https://carhat.bd/api/favorites", {
  method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
});

test("a same-origin save accepts only the listing id", async () => {
  assert.equal(await parseFavoriteMutation(request({ listingId: carId, userId: "someone-else" }, { Origin: "https://carhat.bd" })), carId);
});

test("cross-origin pages cannot change a signed-in user's saved cars", async () => {
  await assert.rejects(parseFavoriteMutation(request({ listingId: carId }, { Origin: "https://example.com" })), { status: 403 });
  await assert.rejects(parseFavoriteMutation(request({ listingId: carId }, { "Sec-Fetch-Site": "cross-site" })), { status: 403 });
});

test("invalid ids and MongoDB selector objects are rejected before database access", async () => {
  for (const body of [{ listingId: "not-a-car" }, { listingId: { $ne: null } }, {}, null, []]) {
    await assert.rejects(parseFavoriteMutation(request(body)), { status: 400 });
  }
});

test("malformed JSON receives a client error", async () => {
  await assert.rejects(parseFavoriteMutation(new Request("https://carhat.bd/api/favorites", { method: "POST", body: "{" })), { status: 400 });
});
