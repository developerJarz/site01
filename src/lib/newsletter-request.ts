export class NewsletterRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Same-origin JSON `{ email }` only; returns the normalised address. */
export async function parseNewsletterSignup(request: Request): Promise<string> {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new NewsletterRequestError("This request must come from CarHat.", 403);
  }
  let body: unknown;
  try { body = await request.json(); }
  catch { throw new NewsletterRequestError("Please send a valid request.", 400); }
  const raw = body && typeof body === "object" && "email" in body ? body.email : undefined;
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (!email || email.length > 254 || !EMAIL.test(email)) {
    throw new NewsletterRequestError("Enter a valid email address.", 400);
  }
  return email;
}
