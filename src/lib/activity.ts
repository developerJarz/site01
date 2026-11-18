import type { Session } from "next-auth";
import { connectToDatabase } from "./db";
import { ActivityLog } from "./models/ActivityLog";

export type ActivityEntry = {
  /** Dotted key such as "listing.update"; the part before the dot is the area shown as a filter. */
  action: string;
  summary: string;
  targetId?: string;
  targetLabel?: string;
  details?: Record<string, unknown>;
};

/** Areas the log can be filtered by, with the label shown in Admin → Activity log. */
export const ACTIVITY_AREAS: Record<string, string> = {
  listing: "Listings",
  user: "Users",
  role: "Roles",
  blog: "Blog",
  seo: "SEO",
  settings: "Settings & website",
  inbox: "Inbox",
  newsletter: "Newsletter",
};

function clientIp(req?: Request) {
  const h = req?.headers;
  if (!h) return "";
  return (h.get("x-nf-client-connection-ip") || h.get("x-forwarded-for")?.split(",")[0] || h.get("x-real-ip") || "").trim().slice(0, 60);
}

/**
 * Records what a team member did. Never throws: a logging failure must not undo or block the
 * action itself, so problems are only written to the server log.
 */
export async function logActivity(session: Session | null | undefined, entry: ActivityEntry, req?: Request) {
  try {
    const user = (session?.user || {}) as { id?: string; name?: string | null; email?: string | null; role?: string };
    await connectToDatabase();
    await ActivityLog.create({
      actorId: user.id && /^[a-f0-9]{24}$/i.test(user.id) ? user.id : undefined,
      actorName: user.name || "",
      actorEmail: user.email || "",
      actorRole: user.role || "",
      action: entry.action,
      area: entry.action.split(".")[0],
      summary: entry.summary.slice(0, 500),
      targetId: entry.targetId || "",
      targetLabel: (entry.targetLabel || "").slice(0, 200),
      details: entry.details,
      ip: clientIp(req),
    });
  } catch (error) {
    console.error("Couldn't write the activity log:", error);
  }
}

/** "3 listings" / "1 listing". */
export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Names of the fields that were sent, for the log's details (values are left out to keep it small). */
export const changedFields = (body: Record<string, unknown>, ignore: string[] = ["id", "_id", "ids"]) =>
  Object.keys(body).filter((k) => !ignore.includes(k));
