import test from "node:test";
import assert from "node:assert/strict";
import { parseAnalyticsRequest, analyticsScope } from "../src/lib/analytics-request.ts";

const visitor = "4f5a1c4a-76b1-4a56-8ce7-a617acf367c4";
const session = "2ddbabf8-a9d7-44c2-a0be-d7116406d3ee";
const listingId = "507f1f77bcf86cd799439011";
const request = (events, headers = {}) => new Request("https://carhat.bd/api/analytics/events", {
  method: "POST", headers, body: JSON.stringify({ visitor, session, events }),
});

test("analytics accepts bounded events and strips query strings from page paths", async () => {
  const result = await parseAnalyticsRequest(request([{ kind: "page_view", path: "/cars?email=private" }, { kind: "impression", listingId, path: "/" }]));
  assert.equal(result.events[0].path, "/cars");
  assert.equal(result.events[1].listingId, listingId);
});

test("analytics rejects cross-origin posts, malformed IDs and unbounded batches", async () => {
  await assert.rejects(parseAnalyticsRequest(request([], { Origin: "https://other.example" })), { status: 403 });
  for (const events of [[{ kind: "impression", listingId: { $ne: null }, path: "/" }], [{ kind: "unknown", path: "/" }], Array(21).fill({ kind: "page_view", path: "/" }), [{ kind: "page_view", path: "https://evil.example/" }]]) {
    await assert.rejects(parseAnalyticsRequest(request(events)), { status: 400 });
  }
});

test("seller analytics scope is always the signed-in seller even if all-site is requested", () => {
  for (const role of ["buyer", "seller", "dealer", "guest", undefined]) {
    assert.deepEqual(analyticsScope({ id: listingId, role }, "site"), { sellerId: listingId }, String(role));
  }
  // Team roles may ask for the whole site; the API then checks the role has the dashboard or reports.
  assert.deepEqual(analyticsScope({ id: listingId, role: "admin" }, "site"), {});
  assert.deepEqual(analyticsScope({ id: listingId, role: "moderator" }, "site"), {});
  assert.deepEqual(analyticsScope({ id: listingId, role: "admin" }, "own"), { sellerId: listingId });
});
