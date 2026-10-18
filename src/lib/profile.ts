import { normalisePhoneNumber, parseContactDetails, usesPhoneForWhatsApp, type ContactInput } from "./contact-details.ts";

type Result = { ok: true; value: Record<string, string | boolean> } | { ok: false; error: string };
const TEXT_FIELDS: Record<string, { label: string; max: number; min?: number }> = {
  name: { label: "Full name", min: 2, max: 80 }, bio: { label: "About you", max: 500 },
  address: { label: "Address", max: 200 }, city: { label: "City", max: 80 },
  dealershipName: { label: "Dealership name", max: 120 }, dealershipLicense: { label: "Trade licence number", max: 80 },
};

export function parseProfileUpdates(body: unknown, current: ContactInput): Result {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { ok: false, error: "Send valid profile details." };
  const input = body as Record<string, unknown>;
  const updates: Record<string, string | boolean> = {};
  for (const [key, rules] of Object.entries(TEXT_FIELDS)) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== "string") return { ok: false, error: `${rules.label} must be text.` };
    const value = (input[key] as string).trim();
    if (value.length < (rules.min || 0) || value.length > rules.max) return { ok: false, error: `${rules.label} must be ${rules.min ? `${rules.min}–` : "no more than "}${rules.max} characters.` };
    updates[key] = value;
  }
  for (const key of ["allowPhoneDisplay", "allowWhatsApp"]) {
    if (input[key] === undefined) continue;
    if (typeof input[key] !== "boolean") return { ok: false, error: "Choose a valid contact visibility setting." };
    updates[key] = input[key];
  }
  if (["phone", "whatsappNumber", "whatsappSameAsPhone"].some((key) => input[key] !== undefined)) {
    const contact = parseContactDetails({
      phone: input.phone === undefined ? current.phone : input.phone,
      whatsappNumber: input.whatsappNumber === undefined ? current.whatsappNumber : input.whatsappNumber,
      whatsappSameAsPhone: input.whatsappSameAsPhone === undefined ? usesPhoneForWhatsApp(current) : input.whatsappSameAsPhone,
    }, false);
    if (!contact.ok) return contact;
    Object.assign(updates, contact.value);
  }
  if (!Object.keys(updates).length) return { ok: false, error: "No valid profile fields to update." };
  return { ok: true, value: updates };
}

type CompletionProfile = Partial<Record<"name" | "email" | "phone" | "whatsappNumber" | "avatar" | "city" | "bio" | "address", string | null>>;
const COMPLETION_FIELDS = { name: "Full name", email: "Email", phone: "Phone number", whatsappNumber: "WhatsApp number", avatar: "Profile photo", city: "City", bio: "About you", address: "Address" } as const;

export function profileCompletion(profile: CompletionProfile) {
  const missing = Object.entries(COMPLETION_FIELDS).filter(([key]) => {
    const value = profile[key as keyof CompletionProfile];
    return key === "phone" || key === "whatsappNumber" ? !normalisePhoneNumber(value) : !value?.trim();
  }).map(([, label]) => label);
  const total = Object.keys(COMPLETION_FIELDS).length;
  return { total, completed: total - missing.length, percentage: Math.round((total - missing.length) / total * 100), missing };
}
