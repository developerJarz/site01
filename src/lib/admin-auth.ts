import { NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "./auth";
import { permissionsForRole } from "./staff-roles";
import type { Permission } from "./permissions";

type AdminCheck =
  | { ok: true; session: Session; role: string; permissions: Permission[]; can: (p: Permission) => boolean }
  | { ok: false; response: NextResponse };

/**
 * Every /api/admin/* handler must call this first. With no argument any team role passes;
 * pass the permission(s) the action needs and the caller must hold at least one of them.
 * Returns a 401/403 response to send back otherwise.
 */
export async function requireAdmin(...anyOf: Permission[]): Promise<AdminCheck> {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Sign in to continue." }, { status: 401 }),
    };
  }
  const role = (session.user as { role?: string }).role || "";
  let permissions: Permission[] = [];
  try {
    permissions = await permissionsForRole(role);
  } catch (error) {
    console.error("Couldn't load staff roles:", error);
    // Admins keep working through a database blip; other roles are refused until roles load.
    if (role !== "admin") {
      return { ok: false, response: NextResponse.json({ error: "Couldn't check your access. Try again." }, { status: 503 }) };
    }
    permissions = await permissionsForRole("admin");
  }
  if (permissions.length === 0) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Team access only." }, { status: 403 }),
    };
  }
  if (anyOf.length && !anyOf.some((p) => permissions.includes(p))) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Your role doesn't allow this. Ask an admin for access." }, { status: 403 }),
    };
  }
  return { ok: true, session, role, permissions, can: (p) => permissions.includes(p) };
}
