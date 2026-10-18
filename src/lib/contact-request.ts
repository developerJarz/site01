export const CONTACT_TOPICS = ["general", "buying", "selling", "report", "dealer", "technical", "advertising"] as const;
export type ContactTopic = (typeof CONTACT_TOPICS)[number];

export const TOPIC_LABEL: Record<ContactTopic, string> = {
  general: "General question",
  buying: "Help buying a car",
  selling: "Help selling a car",
  report: "Report a listing",
  dealer: "Dealer partnership",
  technical: "Website problem",
  advertising: "Advertising",
};

export class ContactRequestError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export type ContactInput = { name: string; email: string; phone: string; topic: ContactTopic; message: string; listing: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Same-origin JSON only. A filled `website` field is the bot honeypot: accepted quietly and dropped. */
export async function parseContactRequest(request: Request): Promise<ContactInput | null> {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new ContactRequestError("This request must come from CarHat.", 403);
  }
  let body: Record<string, unknown>;
  try {
    const raw = await request.json();
    body = raw && typeof raw === "object" ? raw : {};
  } catch {
    throw new ContactRequestError("Please send a valid request.", 400);
  }
  if (text(body.website, 200)) return null;

  const name = text(body.name, 80);
  const email = text(body.email, 254).toLowerCase();
  const message = text(body.message, 4000);
  if (name.length < 2) throw new ContactRequestError("Tell us your name.", 400);
  if (!EMAIL.test(email)) throw new ContactRequestError("Enter a valid email address so we can reply.", 400);
  if (message.length < 10) throw new ContactRequestError("Write a little more so we can help.", 400);

  const topic = (CONTACT_TOPICS as readonly string[]).includes(body.topic as string) ? (body.topic as ContactTopic) : "general";
  return { name, email, phone: text(body.phone, 30), topic, message, listing: text(body.listing, 200) };
}
