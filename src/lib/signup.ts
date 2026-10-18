import { parseContactDetails, type ContactDetails } from "./contact-details.ts";

/** Roles a person can choose for themselves. Admin is only ever granted by another admin. */
export const SELF_SERVE_ROLES = ["buyer", "seller", "dealer"] as const;
export type SelfServeRole = (typeof SELF_SERVE_ROLES)[number];

export const MIN_PASSWORD = 8;
/** Wrong codes allowed before the code is thrown away and a new one must be requested. */
export const MAX_OTP_ATTEMPTS = 5;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type Signup = { name: string; email: string; password: string; role: SelfServeRole } & ContactDetails;

/** Validates a signup form. Unknown or privileged roles fall back to buyer rather than failing. */
export function parseSignup(body: unknown): { ok: true; value: Signup } | { ok: false; error: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim().replace(/\s+/g, " ") : "";
  const email = typeof b.email === "string" ? b.email.trim().toLowerCase() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (name.length < 2 || name.length > 80) return { ok: false, error: "Enter your full name." };
  if (!EMAIL.test(email) || email.length > 254) return { ok: false, error: "Enter a valid email address." };
  if (password.length < MIN_PASSWORD) return { ok: false, error: `Use at least ${MIN_PASSWORD} characters for your password.` };
  if (password.length > 128) return { ok: false, error: "That password is too long." };

  const role = (SELF_SERVE_ROLES as readonly string[]).includes(b.role as string) ? (b.role as SelfServeRole) : "buyer";
  const contact = parseContactDetails(b);
  if (!contact.ok) return contact;
  return { ok: true, value: { name, email, password, role, ...contact.value } };
}

/** A six-digit code as a string, or null if the input isn't one. */
export function parseOtpCode(value: unknown) {
  return typeof value === "string" && /^\d{6}$/.test(value.trim()) ? value.trim() : null;
}
