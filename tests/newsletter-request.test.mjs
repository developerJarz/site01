import test from "node:test";
import assert from "node:assert/strict";
import { parseNewsletterSignup } from "../src/lib/newsletter-request.ts";

const request = (body, headers = {}) => new Request("https://carhat.bd/api/newsletter", {
  method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
});

test("a same-origin signup returns the trimmed, lower-cased address", async () => {
  assert.equal(await parseNewsletterSignup(request({ email: "  Rahim@Example.COM " }, { Origin: "https://carhat.bd" })), "rahim@example.com");
});

test("other sites cannot sign visitors up", async () => {
  await assert.rejects(parseNewsletterSignup(request({ email: "a@b.co" }, { Origin: "https://example.com" })), { status: 403 });
  await assert.rejects(parseNewsletterSignup(request({ email: "a@b.co" }, { "Sec-Fetch-Site": "cross-site" })), { status: 403 });
});

test("invalid addresses and selector objects are rejected before database access", async () => {
  for (const body of [{ email: "not-an-email" }, { email: { $ne: null } }, { email: "a@b" }, {}, null, { email: `${"a".repeat(250)}@b.co` }]) {
    await assert.rejects(parseNewsletterSignup(request(body)), { status: 400 });
  }
});
