import "server-only";
import { connectToDatabase } from "./db";
import { StaffRole } from "./models/StaffRole";
import { BUILT_IN_STAFF_ROLES, PERMISSION_KEYS, cleanPermissions, isMarketplaceRole, type Permission, type StaffRoleDefinition } from "./permissions";

// Every admin request checks permissions, and roles change rarely.
const TTL_MS = 30_000;
let cache: { at: number; roles: Promise<StaffRoleDefinition[]> } | undefined;

async function fetchRoles(): Promise<StaffRoleDefinition[]> {
  await connectToDatabase();
  const stored = await StaffRole.find().sort({ createdAt: 1 }).lean();
  const byKey = new Map(stored.map((r) => [r.key, r]));
  const builtIn = BUILT_IN_STAFF_ROLES.map((role) => {
    const saved = role.key === "admin" ? undefined : byKey.get(role.key);
    return saved
      ? { ...role, name: saved.name || role.name, description: saved.description ?? role.description, permissions: cleanPermissions(saved.permissions) }
      : role;
  });
  const custom = stored
    .filter((r) => !BUILT_IN_STAFF_ROLES.some((b) => b.key === r.key))
    .map((r) => ({ key: r.key, name: r.name, description: r.description || "", permissions: cleanPermissions(r.permissions), builtIn: false }));
  return [...builtIn, ...custom];
}

export function listStaffRoles(): Promise<StaffRoleDefinition[]> {
  if (!cache || Date.now() - cache.at > TTL_MS) {
    const roles = fetchRoles();
    cache = { at: Date.now(), roles };
    // A failed load must not be cached.
    roles.catch(() => { if (cache?.roles === roles) cache = undefined; });
  }
  return cache.roles;
}

export function invalidateStaffRoles() {
  cache = undefined;
}

/** Permissions for a session role. Customer roles and unknown roles get none. */
export async function permissionsForRole(role?: string | null): Promise<Permission[]> {
  if (!role || isMarketplaceRole(role)) return [];
  if (role === "admin") return [...PERMISSION_KEYS];
  const roles = await listStaffRoles();
  return roles.find((r) => r.key === role)?.permissions || [];
}

export async function isKnownRole(role: string) {
  if (isMarketplaceRole(role)) return true;
  return (await listStaffRoles()).some((r) => r.key === role);
}
