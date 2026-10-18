import test from "node:test";
import assert from "node:assert/strict";
import { dialableNumber, formatPhoneNumber, normalisePhoneNumber, parseContactDetails } from "../src/lib/contact-details.ts";
import { parseProfileUpdates, profileCompletion } from "../src/lib/profile.ts";

test("local, international and Bengali mobile numbers use one stored format", () => {
  for (const phone of ["01712 345678", "1712345678", "+880 (1712) 345-678", "8801712345678", "008801712345678", "০১৭১২৩৪৫৬৭৮"]) {
    assert.equal(normalisePhoneNumber(phone), "+8801712345678");
  }
  for (const phone of ["123", "0171234567899", "+441712345678", "01712abc678", {}, 1712345678]) assert.equal(normalisePhoneNumber(phone), null);
  assert.equal(normalisePhoneNumber("+880"), "");
});

test("stored numbers display readably and dial without formatting", () => {
  assert.equal(formatPhoneNumber("01712345678"), "+880 1712-345678");
  assert.equal(formatPhoneNumber("+8801712345678"), "+880 1712-345678");
  assert.equal(formatPhoneNumber(" 12345 "), "12345");
  assert.equal(formatPhoneNumber(undefined), "");
  assert.equal(dialableNumber("01712 345678"), "8801712345678");
  assert.equal(dialableNumber(""), "");
});

test("contact details link WhatsApp to the phone or validate a separate number", () => {
  const result = parseContactDetails({ phone: "01712345678", whatsappSameAsPhone: true, whatsappNumber: "old" });
  assert.equal(result.ok, true);
  assert.equal(result.value.whatsappNumber, result.value.phone);
  assert.equal(parseContactDetails({ phone: "01712345678", whatsappSameAsPhone: false, whatsappNumber: "bad" }).ok, false);
  assert.equal(parseContactDetails({ phone: "01712345678", whatsappSameAsPhone: "false" }).ok, false);
});

test("profile phone edits also update linked WhatsApp without resetting privacy", () => {
  const current = { phone: "+8801712345678", whatsappNumber: "+8801712345678", whatsappSameAsPhone: true, allowWhatsApp: false };
  const result = parseProfileUpdates({ phone: "01812 345678" }, current);
  assert.equal(result.ok, true);
  assert.equal(result.value.phone, "+8801812345678");
  assert.equal(result.value.whatsappNumber, "+8801812345678");
  assert.equal("allowWhatsApp" in result.value, false);
});

test("separate WhatsApp numbers survive phone edits and legacy equal numbers can link", () => {
  const current = { phone: "+8801712345678", whatsappNumber: "+8801912345678", whatsappSameAsPhone: false };
  assert.equal(parseProfileUpdates({ phone: "01812345678" }, current).value.whatsappNumber, current.whatsappNumber);
  const legacy = { phone: "+8801712345678", whatsappNumber: "+8801712345678" };
  assert.equal(parseProfileUpdates({ phone: "01812345678" }, legacy).value.whatsappNumber, "+8801812345678");
});

test("profile updates reject invalid fields and cannot change account privileges", () => {
  assert.equal(parseProfileUpdates({ phone: "123" }, {}).ok, false);
  assert.equal(parseProfileUpdates({ name: { $ne: "" } }, {}).ok, false);
  assert.equal(parseProfileUpdates({ allowWhatsApp: "false" }, {}).ok, false);
  assert.equal(parseProfileUpdates({ city: "x".repeat(81) }, {}).ok, false);
  assert.equal(parseProfileUpdates({ role: "admin", isVerified: true }, {}).ok, false);
  const result = parseProfileUpdates({ name: " Rahim ", role: "admin", avatar: "bad" }, {});
  assert.deepEqual(result.value, { name: "Rahim" });
});

test("profile completeness does not count the old empty country-code placeholders", () => {
  const result = profileCompletion({ name: "Rahim", email: "r@example.com", phone: "+880", whatsappNumber: "+880" });
  assert.equal(result.completed, 2);
  assert.ok(result.missing.includes("Phone number"));
  assert.ok(result.missing.includes("WhatsApp number"));
});
