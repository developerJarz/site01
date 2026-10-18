import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin } from "@/lib/admin-auth";
import { listStaffRoles } from "@/lib/staff-roles";

export const dynamic = "force-dynamic";

const widgetList = (v: unknown) =>
  Array.isArray(v) ? [...new Set(v.filter((k): k is string => typeof k === "string" && /^[a-z][a-z-]{1,30}$/.test(k)))].slice(0, 30) : [];

/** GET — the signed-in team member's role, permissions and admin preferences. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const id = (auth.session.user as { id?: string }).id;
    await connectToDatabase();
    const [roles, user] = await Promise.all([
      listStaffRoles(),
      id && mongoose.isValidObjectId(id) ? User.findById(id).select("+adminPrefs").lean() : null,
    ]);
    return NextResponse.json({
      role: auth.role,
      roleName: roles.find((r) => r.key === auth.role)?.name || auth.role,
      permissions: auth.permissions,
      prefs: user?.adminPrefs || {},
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/** PATCH { dashboard: { order: [], hidden: [] } } — save this person's dashboard layout. */
export async function PATCH(req: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const id = (auth.session.user as { id?: string }).id;
    if (!id || !mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Sign in again." }, { status: 401 });
    const dashboard = { order: widgetList(body?.dashboard?.order), hidden: widgetList(body?.dashboard?.hidden) };
    await connectToDatabase();
    await User.updateOne({ _id: id }, { $set: { "adminPrefs.dashboard": dashboard } });
    return NextResponse.json({ success: true, prefs: { dashboard } });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
