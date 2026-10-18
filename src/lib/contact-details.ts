export type ContactDetails = { phone: string; whatsappNumber: string; whatsappSameAsPhone: boolean };
export type ContactInput = { phone?: unknown; whatsappNumber?: unknown; whatsappSameAsPhone?: unknown };

/** Accept local/international Bangladesh mobile numbers, storing one +880 format. */
export function normalisePhoneNumber(value: unknown): string | null {
  if (value === undefined || value === null) return "";
  if (typeof value !== "string" || value.length > 40) return null;
  let digits = value.trim().replace(/[০-৯]/g, (digit) => String(digit.charCodeAt(0) - 0x09e6)).replace(/[\s()-]/g, "");
  if (!digits || digits === "+880" || digits === "880") return "";
  digits = digits.replace(/^00880/, "+880").replace(/^\+?880/, "");
  if (/^1\d{9}$/.test(digits)) digits = `0${digits}`;
  return /^01[3-9]\d{8}$/.test(digits) ? `+880${digits.slice(1)}` : null;
}

/** Older accounts have no linking preference; preserve distinct numbers and link equal ones. */
export function usesPhoneForWhatsApp(input: ContactInput) {
  if (typeof input.whatsappSameAsPhone === "boolean") return input.whatsappSameAsPhone;
  const whatsapp = normalisePhoneNumber(input.whatsappNumber);
  return !whatsapp || whatsapp === normalisePhoneNumber(input.phone);
}

export function localPhoneNumber(value: unknown) {
  return (normalisePhoneNumber(value) || "").replace(/^\+880/, "");
}

/** "+880 1712-345678" for display. Numbers that don't parse are shown as they were stored. */
export function formatPhoneNumber(value: unknown) {
  const phone = normalisePhoneNumber(value);
  if (phone) return `+880 ${phone.slice(4, 8)}-${phone.slice(8)}`;
  return typeof value === "string" ? value.trim() : "";
}

/** Digits only, country code first, as wa.me and tel: links expect. */
export function dialableNumber(value: unknown) {
  const phone = normalisePhoneNumber(value);
  return phone ? phone.slice(1) : typeof value === "string" ? value.replace(/\D/g, "") : "";
}

export function parseContactDetails(input: ContactInput, required = true): { ok: true; value: ContactDetails } | { ok: false; error: string } {
  const phone = normalisePhoneNumber(input.phone);
  if (phone === null || (required && !phone)) return { ok: false, error: "Enter a valid Bangladesh mobile number, e.g. 01712 345678." };
  if (input.whatsappSameAsPhone !== undefined && typeof input.whatsappSameAsPhone !== "boolean") {
    return { ok: false, error: "Choose whether WhatsApp uses your phone number." };
  }
  const whatsappSameAsPhone = usesPhoneForWhatsApp(input);
  const whatsappNumber = whatsappSameAsPhone ? phone : normalisePhoneNumber(input.whatsappNumber);
  if (whatsappNumber === null || (required && !whatsappNumber)) return { ok: false, error: "Enter a valid WhatsApp mobile number." };
  return { ok: true, value: { phone, whatsappNumber, whatsappSameAsPhone } };
}
