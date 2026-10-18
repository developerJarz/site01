import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { connectToDatabase } from "@/lib/db";
import { User } from "@/lib/models/User";
import { requireAdmin } from "@/lib/admin-auth";
import { retireUsersContent } from "@/lib/cleanup";
import { escapeRegex } from "@/lib/utils";
import { normalisePhoneNumber } from "@/lib/contact-details";
import { MARKETPLACE_ROLES, isStaffRole } from "@/lib/permissions";
import { isKnownRole, listStaffRoles } from "@/lib/staff-roles";

export const dynamic = "force-dynamic";

const SORTS: Record<string, Record<string, 1 | -1>> = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  name: { name: 1 },
  active: { lastLoginAt: -1, createdAt: -1 },
  listings: { listingCount: -1, createdAt: -1 },
};

const text = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "");

// GET ?page=1&limit=25&q=rahim&role=dealer|team&verified=1|0&status=active|suspended&sort=newest
export async function GET(req: NextRequest) {
  const auth = await requireAdmin("users.view");
  if (!auth.ok) return auth.response;

  try {
    await connectToDatabase();
    const sp = req.nextUrl.searchParams;
    const page = Math.max(1, Number(sp.get("page")) || 1);
    const limit = Math.min(200, Math.max(5, Number(sp.get("limit")) || 25));
    const q = sp.get("q")?.trim();
    const role = sp.get("role");
    const verified = sp.get("verified");
    const status = sp.get("status");
    const sortKey = SORTS[sp.get("sort") || ""] ? (sp.get("sort") as string) : "newest";
    // Paging before the listings lookup keeps big user lists fast; only the listings sort needs it first.
    const pageStages = [{ $sort: SORTS[sortKey] }, { $skip: (page - 1) * limit }, { $limit: limit }];
    const staffRoles = await listStaffRoles();
    const allRoles = [...MARKETPLACE_ROLES, ...staffRoles.map((r) => r.key)];

    const base: Record<string, any> = {};
    if (q) {
      const rx = new RegExp(escapeRegex(q), "i");
      base.$or = [{ name: rx }, { email: rx }, { phone: rx }, { whatsappNumber: rx }, { dealershipName: rx }, { city: rx }];
      // Numbers are stored as +8801712345678, so "01712 345678" is matched on its digits after the 0/880.
      const digits = q.replace(/\D/g, "").replace(/^(?:00)?880|^0/, "");
      if (digits.length >= 4) base.$or.push({ phone: new RegExp(digits) }, { whatsappNumber: new RegExp(digits) });
    }
    if (verified === "1") base.isVerified = true;
    if (verified === "0") base.isVerified = { $ne: true };
    if (status === "suspended") base.status = "suspended";
    if (status === "active") base.status = { $ne: "suspended" };

    const match = { ...base };
    if (role === "team") match.role = { $nin: [...MARKETPLACE_ROLES] };
    else if (role && allRoles.includes(role)) match.role = role;

    const [users, total, roleCounts, suspended] = await Promise.all([
      User.aggregate([
        { $match: match },
        ...(sortKey === "listings" ? [] : pageStages),
        {
          $lookup: {
            from: "listings",
            let: { uid: "$_id" },
            pipeline: [
              { $match: { $expr: { $eq: ["$sellerId", "$$uid"] } } },
              { $project: { status: 1 } },
            ],
            as: "listings",
          },
        },
        {
          $project: {
            name: 1, email: 1, phone: 1, whatsappNumber: 1, role: 1, isVerified: 1, city: 1, avatar: 1,
            dealershipName: 1, createdAt: 1, lastLoginAt: 1, status: 1, suspendedReason: 1,
            listingCount: { $size: "$listings" },
            activeCount: {
              $size: { $filter: { input: "$listings", cond: { $eq: ["$$this.status", "active"] } } },
            },
          },
        },
        ...(sortKey === "listings" ? pageStages : []),
      ]),
      User.countDocuments(match),
      User.aggregate([{ $match: base }, { $group: { _id: "$role", count: { $sum: 1 } } }]),
      User.countDocuments({ status: "suspended" }),
    ]);

    const counts: Record<string, number> = { all: 0, team: 0 };
    for (const r of allRoles) counts[r] = 0;
    for (const c of roleCounts) {
      counts[c._id] = (counts[c._id] || 0) + c.count;
      counts.all += c.count;
      if (isStaffRole(c._id)) counts.team += c.count;
    }

    return NextResponse.json({
      users: JSON.parse(JSON.stringify(users)),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
      counts,
      suspended,
      roles: staffRoles.map((r) => ({ key: r.key, name: r.name })),
      currentUserId: (auth.session.user as { id?: string }).id,
      can: {
        manage: auth.can("users.manage"),
        delete: auth.can("users.delete"),
        roles: auth.can("roles.manage"),
        admin: auth.role === "admin",
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

function targetIds(body: { id?: unknown; ids?: unknown }): string[] {
  const list = Array.isArray(body.ids) ? body.ids : [body.id];
  return list.filter((i): i is string => typeof i === "string" && mongoose.isValidObjectId(i));
}

/** Team accounts can only be changed by someone who manages roles; admins only by admins. */
async function guardTeamTargets(ids: string[], actorRole: string, canRoles: boolean) {
  const targets = await User.find({ _id: { $in: ids } }).select("role name").lean();
  const admin = targets.find((t) => t.role === "admin");
  if (admin && actorRole !== "admin") return `Only admins can change admin accounts like ${admin.name}.`;
  const staff = targets.find((t) => isStaffRole(t.role));
  if (staff && !canRoles) return `${staff.name} is on the team; changing team accounts needs the “manage roles” permission.`;
  return null;
}

// POST { name, email, role, phone?, password? } — create an account. Returns a one-time password if none was given.
export async function POST(req: NextRequest) {
  const auth = await requireAdmin("users.manage");
  if (!auth.ok) return auth.response;
  try {
    const body = await req.json();
    const name = text(body.name, 80);
    const email = text(body.email, 120).toLowerCase();
    const role = text(body.role, 32) || "buyer";
    if (name.length < 2) return NextResponse.json({ error: "Enter the person's name." }, { status: 400 });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
    if (!(await isKnownRole(role))) return NextResponse.json({ error: "Unknown role." }, { status: 400 });
    if (isStaffRole(role) && !auth.can("roles.manage")) return NextResponse.json({ error: "Giving team access needs the “manage roles” permission." }, { status: 403 });
    if (role === "admin" && auth.role !== "admin") return NextResponse.json({ error: "Only admins can create admins." }, { status: 403 });
    const phone = body.phone ? normalisePhoneNumber(body.phone) : "";
    if (body.phone && !phone) return NextResponse.json({ error: "Enter a valid Bangladeshi mobile number." }, { status: 400 });

    const given = typeof body.password === "string" ? body.password : "";
    if (given && given.length < 8) return NextResponse.json({ error: "Passwords need at least 8 characters." }, { status: 400 });
    const password = given || randomBytes(9).toString("base64url");

    await connectToDatabase();
    if (await User.exists({ email })) return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    const user = await User.create({
      name, email, role, phone: phone || "",
      password: await bcrypt.hash(password, 12),
      isVerified: body.isVerified === true,
      city: text(body.city, 60),
      dealershipName: text(body.dealershipName, 120),
    });
    return NextResponse.json({ success: true, id: user._id.toString(), ...(given ? {} : { temporaryPassword: password }) });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE { id } or { ids: [] }
export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin("users.delete");
  if (!auth.ok) return auth.response;

  try {
    const ids = targetIds(await req.json());
    const selfId = (auth.session.user as { id?: string }).id;
    if (ids.length === 0) return NextResponse.json({ error: "No users selected" }, { status: 400 });
    if (selfId && ids.includes(selfId)) {
      return NextResponse.json({ error: "You can't delete your own account from here." }, { status: 400 });
    }
    await connectToDatabase();
    const blocked = await guardTeamTargets(ids, auth.role, auth.can("roles.manage"));
    if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });
    await retireUsersContent(ids);
    const result = await User.deleteMany({ _id: { $in: ids } });
    return NextResponse.json({ success: true, deleted: result.deletedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PATCH { id | ids, role?, isVerified?, status?, suspendedReason?, adminNotes?, name?, phone?, whatsappNumber?, city?, dealershipName? }
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin("users.manage", "roles.manage");
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const ids = targetIds(body);
    const selfId = (auth.session.user as { id?: string }).id;
    if (ids.length === 0) return NextResponse.json({ error: "No users selected" }, { status: 400 });
    const touchesSelf = !!selfId && ids.includes(selfId);
    await connectToDatabase();

    const update: Record<string, unknown> = {};
    const unset: Record<string, ""> = {};

    if (body.role !== undefined) {
      const role = text(body.role, 32);
      if (!(await isKnownRole(role))) return NextResponse.json({ error: "Unknown role" }, { status: 400 });
      if (touchesSelf) return NextResponse.json({ error: "You can't change your own role." }, { status: 400 });
      if (isStaffRole(role) && !auth.can("roles.manage")) return NextResponse.json({ error: "Giving team access needs the “manage roles” permission." }, { status: 403 });
      if (role === "admin" && auth.role !== "admin") return NextResponse.json({ error: "Only admins can make people admins." }, { status: 403 });
      update.role = role;
    }

    // Everything else is account management.
    const managed = ["isVerified", "status", "suspendedReason", "adminNotes", "name", "phone", "whatsappNumber", "city", "dealershipName"].some((k) => body[k] !== undefined);
    if (managed && !auth.can("users.manage")) return NextResponse.json({ error: "Your role can't edit accounts." }, { status: 403 });

    if (body.isVerified !== undefined) update.isVerified = !!body.isVerified;
    if (body.status !== undefined) {
      if (body.status !== "active" && body.status !== "suspended") return NextResponse.json({ error: "Unknown status" }, { status: 400 });
      if (touchesSelf) return NextResponse.json({ error: "You can't suspend your own account." }, { status: 400 });
      update.status = body.status;
      if (body.status === "suspended") {
        update.suspendedAt = new Date();
        update.suspendedReason = text(body.suspendedReason, 300);
      } else {
        update.suspendedReason = "";
        unset.suspendedAt = "";
      }
    }
    if (body.adminNotes !== undefined) update.adminNotes = typeof body.adminNotes === "string" ? body.adminNotes.trim().slice(0, 2000) : "";

    // Profile fields only make sense for one account at a time.
    const profileKeys = ["name", "phone", "whatsappNumber", "city", "dealershipName"].filter((k) => body[k] !== undefined);
    if (profileKeys.length && ids.length !== 1) return NextResponse.json({ error: "Edit profile details one account at a time." }, { status: 400 });
    if (body.name !== undefined) {
      const name = text(body.name, 80);
      if (name.length < 2) return NextResponse.json({ error: "Names need at least 2 characters." }, { status: 400 });
      update.name = name;
    }
    for (const key of ["phone", "whatsappNumber"] as const) {
      if (body[key] === undefined) continue;
      if (!body[key]) { update[key] = ""; continue; }
      const phone = normalisePhoneNumber(body[key]);
      if (!phone) return NextResponse.json({ error: "Enter a valid Bangladeshi mobile number." }, { status: 400 });
      update[key] = phone;
    }
    if (body.city !== undefined) update.city = text(body.city, 60);
    if (body.dealershipName !== undefined) update.dealershipName = text(body.dealershipName, 120);

    if (Object.keys(update).length === 0 && Object.keys(unset).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    // Notes and verification on yourself are fine; anything else on team accounts is guarded.
    const sensitive = Object.keys(update).some((k) => !["adminNotes", "isVerified"].includes(k));
    if (sensitive) {
      const blocked = await guardTeamTargets(ids.filter((i) => i !== selfId), auth.role, auth.can("roles.manage"));
      if (blocked) return NextResponse.json({ error: blocked }, { status: 403 });
    }

    const result = await User.updateMany({ _id: { $in: ids } }, { $set: update, ...(Object.keys(unset).length ? { $unset: unset } : {}) });
    return NextResponse.json({ success: true, modified: result.modifiedCount });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
