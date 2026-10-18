import { isStaffRole } from "./permissions.ts";

export class AnalyticsRequestError extends Error {
  status: number;
  constructor(message: string, status = 400) { super(message); this.status = status; }
}

export type TrafficEvent = { kind: "page_view" | "impression" | "click"; path: string; listingId?: string };

export async function parseAnalyticsRequest(request: Request): Promise<{ visitor: string; session: string; events: TrafficEvent[] }> {
  const origin = request.headers.get("origin");
  if ((origin && origin !== new URL(request.url).origin) || request.headers.get("sec-fetch-site") === "cross-site") {
    throw new AnalyticsRequestError("Same-origin requests only.", 403);
  }
  const raw = await request.text();
  if (raw.length > 16_384) throw new AnalyticsRequestError("Request too large.");
  let body;
  try { body = JSON.parse(raw); } catch { throw new AnalyticsRequestError("Invalid JSON."); }
  const uuid = /^[a-f\d]{8}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{4}-[a-f\d]{12}$/i;
  if (!body || !uuid.test(String(body.visitor)) || !uuid.test(String(body.session)) || !Array.isArray(body.events) || !body.events.length || body.events.length > 20) {
    throw new AnalyticsRequestError("Invalid events.");
  }
  const events = body.events.map((event: TrafficEvent) => {
    if (!event || !["page_view", "impression", "click"].includes(event.kind) || typeof event.path !== "string" || !/^\/(?!\/)[^\s\\]*$/.test(event.path) || event.path.length > 300) {
      throw new AnalyticsRequestError("Invalid event.");
    }
    if ((event.kind !== "page_view" || event.listingId !== undefined) && (typeof event.listingId !== "string" || !/^[a-f\d]{24}$/i.test(event.listingId))) {
      throw new AnalyticsRequestError("Invalid listing.");
    }
    return { kind: event.kind, path: event.path.split(/[?#]/)[0], ...(event.listingId ? { listingId: event.listingId.toLowerCase() } : {}) };
  });
  return { visitor: body.visitor, session: body.session, events };
}

export function analyticsScope(user: { id: string; role?: string }, scope: string | null) {
  return isStaffRole(user.role) && scope === "site" ? {} : { sellerId: user.id };
}
