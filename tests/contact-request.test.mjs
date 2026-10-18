import test from "node:test";
import assert from "node:assert/strict";
import { parseContactRequest } from "../src/lib/contact-request.ts";

const request = (body, headers = {}) => new Request("https://carhat.bd/api/contact", {
  method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body),
});
const valid = { name: "Fatima Khan", email: " Fatima@Example.com ", topic: "report", message: "The photos on this listing are of a different car.", listing: "2018-toyota-axio-x1" };

test("a valid message is normalised", async () => {
  const value = await parseContactRequest(request(valid, { Origin: "https://carhat.bd" }));
  assert.equal(value.email, "fatima@example.com");
  assert.equal(value.topic, "report");
  assert.equal(value.listing, "2018-toyota-axio-x1");
});

test("other sites can't post to the inbox", async () => {
  await assert.rejects(parseContactRequest(request(valid, { Origin: "https://evil.example" })), { status: 403 });
});

test("bots that fill the hidden field are dropped silently", async () => {
  assert.equal(await parseContactRequest(request({ ...valid, website: "http://spam.example" })), null);
});

test("missing details and unknown topics are handled", async () => {
  await assert.rejects(parseContactRequest(request({ ...valid, email: "nope" })), { status: 400 });
  await assert.rejects(parseContactRequest(request({ ...valid, message: "hi" })), { status: 400 });
  assert.equal((await parseContactRequest(request({ ...valid, topic: { $ne: 1 } }))).topic, "general");
});
