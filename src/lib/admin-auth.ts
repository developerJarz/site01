import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "./auth";

type AdminCheck =
  | { ok: true; session: Session }
  | { ok: false; response: NextResponse };

/**
 * Every /api/admin/* handler must call this first.
 * Returns a 401/403 response to send back when the caller is not an admin.
 */
export async function requireAdmin(): Promise<AdminCheck> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }),
    };
  }
  if ((session.user as { role?: string }).role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json({ error: "Admin access only." }, { status: 403 }),
    };
  }
  return { ok: true, session };
}

