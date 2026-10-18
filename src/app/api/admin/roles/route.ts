import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { StaffRole } from "@/lib/models/StaffRole";
import { requireAdmin } from "@/lib/admin-auth";
import { invalidateStaffRoles, isKnownRole, listStaffRoles } from "@/lib/staff-roles";
import { BUILT_IN_STAFF_ROLES, MARKETPLACE_ROLES, PERMISSIONS, ROLE_KEY_PATTERN, cleanPermissions } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");
const isBuiltIn = (key: string) => BUILT_IN_STAFF_ROLES.some((r) => r.key === key);

/** GET — every team role with how many people hold it, plus the permission catalogue. */
export async function GET() {
  const auth = await requireAdmin("roles.manage", "users.view");
  if (!auth.ok) return auth.response;
  try {
    await connectToDatabase();
    const [roles, counts] = await Promise.all([
      listStaffRoles(),
      User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    ]);
    const members = Object.fromEntries(counts.map((c: { _id: string; count: number }) => [c._id, c.count]));
    return NextResponse.json({
      roles: roles.map((r) => ({ ...r, members: members[r.key] || 0 })),
      marketplace: MARKETPLACE_ROLES.map((key) => ({ key, members: members[key] || 0 })),
      permissions: PERMISSIONS,
      myRole: auth.role,
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/** POST { name, description, permissions } — create a custom team role. */
export async function POST(req: Request) {
  const auth = await requireAdmin("roles.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const name = text(body.name, 40);
    if (name.length < 2) return NextResponse.json({ error: "Give the role a name." }, { status: 400 });
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 30);
    if (!ROLE_KEY_PATTERN.test(key)) return NextResponse.json({ error: "Start the name with a letter, e.g. “Listing checker”." }, { status: 400 });
    if (isBuiltIn(key) || (MARKETPLACE_ROLES as readonly string[]).includes(key)) {
      return NextResponse.json({ error: "That name is taken by a built-in role. Choose another." }, { status: 400 });
    }
    const permissions = cleanPermissions(body.permissions);
    if (permissions.length === 0) return NextResponse.json({ error: "Pick at least one thing this role can do." }, { status: 400 });
    if (permissions.includes("roles.manage") && auth.role !== "admin") {
      return NextResponse.json({ error: "Only admins can create roles that manage roles." }, { status: 403 });
    }
    await connectToDatabase();
    if (await StaffRole.exists({ key })) return NextResponse.json({ error: "A role with that name already exists." }, { status: 409 });
    await StaffRole.create({ key, name, description: text(body.description, 200), permissions, builtIn: false });
    invalidateStaffRoles();
    return NextResponse.json({ success: true, key });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/** PATCH { key, name?, description?, permissions? } — edit a role. Admin itself can't be changed. */
export async function PATCH(req: Request) {
  const auth = await requireAdmin("roles.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const key = text(body.key, 32);
    if (key === "admin") return NextResponse.json({ error: "The Admin role always has full access." }, { status: 400 });
    if (key === auth.role) return NextResponse.json({ error: "You can't change the role you hold. Ask an admin." }, { status: 403 });
    const roles = await listStaffRoles();
    const role = roles.find((r) => r.key === key);
    if (!role) return NextResponse.json({ error: "Role not found." }, { status: 404 });

    const permissions = body.permissions === undefined ? role.permissions : cleanPermissions(body.permissions);
    if (permissions.length === 0) return NextResponse.json({ error: "A role needs at least one permission." }, { status: 400 });
    if (permissions.includes("roles.manage") && !role.permissions.includes("roles.manage") && auth.role !== "admin") {
      return NextResponse.json({ error: "Only admins can let a role manage roles." }, { status: 403 });
    }
    const name = text(body.name, 40) || role.name;
    const description = body.description === undefined ? role.description : text(body.description, 200);

    await connectToDatabase();
    await StaffRole.updateOne({ key }, { $set: { key, name, description, permissions, builtIn: isBuiltIn(key) } }, { upsert: true });
    invalidateStaffRoles();
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

/**
 * DELETE { key, reassignTo } — delete a custom role, moving its members to another role first.
 * For a built-in role this resets it to the original permissions instead.
 */
export async function DELETE(req: Request) {
  const auth = await requireAdmin("roles.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const key = text(body.key, 32);
    if (key === "admin") return NextResponse.json({ error: "The Admin role can't be removed." }, { status: 400 });
    if (key === auth.role) return NextResponse.json({ error: "You can't remove the role you hold." }, { status: 403 });
    await connectToDatabase();

    if (isBuiltIn(key)) {
      await StaffRole.deleteOne({ key });
      invalidateStaffRoles();
      return NextResponse.json({ success: true, reset: true });
    }
    if (!(await StaffRole.exists({ key }))) return NextResponse.json({ error: "Role not found." }, { status: 404 });

    const members = await User.countDocuments({ role: key });
    if (members > 0) {
      const reassignTo = text(body.reassignTo, 32);
      if (!reassignTo || reassignTo === key || !(await isKnownRole(reassignTo))) {
        return NextResponse.json({ error: `Choose a role for the ${members} ${members === 1 ? "person" : "people"} who have it now.` }, { status: 400 });
      }
      if (reassignTo === "admin" && auth.role !== "admin") return NextResponse.json({ error: "Only admins can make people admins." }, { status: 403 });
      await User.updateMany({ role: key }, { $set: { role: reassignTo } });
    }
    await StaffRole.deleteOne({ key });
    invalidateStaffRoles();
    return NextResponse.json({ success: true, moved: members });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
