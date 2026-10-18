import test from "node:test";
import assert from "node:assert/strict";
import { parseOtpCode, parseSignup } from "../src/lib/signup.ts";

const form = { name: "  Rahim   Ahmed ", email: " Rahim@Example.COM ", password: "correct horse", role: "seller", phone: "01712 345678", whatsappSameAsPhone: true };

test("a valid signup is normalised", () => {
  const result = parseSignup(form);
  assert.equal(result.ok, true);
  assert.deepEqual(result.value, { name: "Rahim Ahmed", email: "rahim@example.com", password: "correct horse", role: "seller", phone: "+8801712345678", whatsappNumber: "+8801712345678", whatsappSameAsPhone: true });
});

test("signup requires a phone and preserves a separate WhatsApp number", () => {
  assert.equal(parseSignup({ ...form, phone: undefined }).ok, false);
  assert.equal(parseSignup({ ...form, phone: "+880" }).ok, false);
  assert.equal(parseSignup({ ...form, phone: { $ne: "" } }).ok, false);
  assert.equal(parseSignup({ ...form, whatsappSameAsPhone: false, whatsappNumber: "" }).ok, false);
  const result = parseSignup({ ...form, whatsappSameAsPhone: false, whatsappNumber: "+880 1812-345678" });
  assert.equal(result.ok, true);
  assert.equal(result.value.whatsappNumber, "+8801812345678");
  assert.equal(result.value.whatsappSameAsPhone, false);
});

test("nobody can sign themselves up as an admin", () => {
  for (const role of ["admin", "Admin", { $ne: "buyer" }, undefined, "guest"]) {
    assert.equal(parseSignup({ ...form, role }).value.role, "buyer");
  }
});

test("weak or malformed details are rejected", () => {
  assert.equal(parseSignup({ ...form, password: "short" }).ok, false);
  assert.equal(parseSignup({ ...form, email: "not-an-email" }).ok, false);
  assert.equal(parseSignup({ ...form, email: { $gt: "" } }).ok, false);
  assert.equal(parseSignup({ ...form, name: "" }).ok, false);
  assert.equal(parseSignup(null).ok, false);
});

test("only six-digit codes are accepted", () => {
  assert.equal(parseOtpCode(" 123456 "), "123456");
  for (const code of ["12345", "1234567", "abcdef", { $ne: "" }, 123456]) assert.equal(parseOtpCode(code), null);
});
