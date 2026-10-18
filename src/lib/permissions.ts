/**
 * Staff roles and what each one may do in the admin area. Shared by the API (lib/admin-auth),
 * the admin shell (to hide pages) and the Roles page, so it must stay free of server-only imports.
 */

export const PERMISSIONS = [
  { key: "dashboard.view", label: "See the dashboard", group: "Overview" },
  { key: "reports.view", label: "See reports and analytics", group: "Overview" },
  { key: "listings.manage", label: "Approve, edit and remove listings", group: "Marketplace" },
  { key: "papers.verify", label: "Check car papers and give the Paper Verified badge", group: "Marketplace" },
  { key: "users.view", label: "See accounts and their details", group: "People" },
  { key: "users.manage", label: "Edit, verify and suspend accounts", group: "People" },
  { key: "users.delete", label: "Delete accounts", group: "People" },
  { key: "roles.manage", label: "Create roles and give people staff access", group: "People" },
  { key: "inbox.manage", label: "Read and answer customer messages", group: "Customers" },
  { key: "newsletter.manage", label: "Manage newsletter subscribers", group: "Customers" },
  { key: "blogs.manage", label: "Write and publish blog posts", group: "Content" },
  { key: "seo.manage", label: "Edit SEO and homepage reviews", group: "Content" },
  { key: "appearance.manage", label: "Edit the website: header, footer, homepage, brand", group: "Website" },
  { key: "settings.manage", label: "Change site settings and maintenance mode", group: "System" },
  { key: "system.view", label: "See system health", group: "System" },
] as const;

export type Permission = (typeof PERMISSIONS)[number]["key"];
export const PERMISSION_KEYS = PERMISSIONS.map((p) => p.key) as Permission[];

/** Roles customers pick or are given; none of them can open the admin area. */
export const MARKETPLACE_ROLES = ["guest", "buyer", "seller", "dealer"] as const;
export const MARKETPLACE_ROLE_LABEL: Record<string, string> = { guest: "Guest", buyer: "Buyer", seller: "Seller", dealer: "Dealer" };

export interface StaffRoleDefinition {
  key: string;
  name: string;
  description: string;
  permissions: Permission[];
  builtIn?: boolean;
}

/** Admin always has every permission and can't be edited. The others are starting points admins can change. */
export const BUILT_IN_STAFF_ROLES: StaffRoleDefinition[] = [
  { key: "admin", name: "Admin", description: "Full access to everything, including roles and settings.", permissions: [...PERMISSION_KEYS], builtIn: true },
  {
    key: "moderator", name: "Moderator", description: "Reviews listings and car papers, looks after accounts.", builtIn: true,
    permissions: ["dashboard.view", "listings.manage", "papers.verify", "users.view", "users.manage", "inbox.manage"],
  },
  {
    key: "editor", name: "Content editor", description: "Writes blog posts, edits SEO and the website content.", builtIn: true,
    permissions: ["dashboard.view", "blogs.manage", "seo.manage", "appearance.manage", "reports.view"],
  },
  {
    key: "support", name: "Support agent", description: "Answers customer messages and helps with accounts.", builtIn: true,
    permissions: ["dashboard.view", "inbox.manage", "newsletter.manage", "users.view"],
  },
];

export const isMarketplaceRole = (role?: string | null) => !role || (MARKETPLACE_ROLES as readonly string[]).includes(role);
/** Any account whose role isn't a customer role works for the team and may open /admin. */
export const isStaffRole = (role?: string | null) => !isMarketplaceRole(role);

export const ROLE_KEY_PATTERN = /^[a-z][a-z0-9-]{1,30}$/;

/** Keeps only known permission keys, in the canonical order. */
export function cleanPermissions(list: unknown): Permission[] {
  const wanted = new Set(Array.isArray(list) ? list : []);
  return PERMISSION_KEYS.filter((p) => wanted.has(p));
}

/** Which admin page needs which permission (any one of them); the shell hides links and blocks pages the role can't use. */
export const ADMIN_PAGE_PERMISSION: { prefix: string; anyOf: Permission[] }[] = [
  { prefix: "/admin/listings", anyOf: ["listings.manage", "papers.verify"] },
  { prefix: "/admin/users", anyOf: ["users.view"] },
  { prefix: "/admin/roles", anyOf: ["roles.manage"] },
  { prefix: "/admin/inbox", anyOf: ["inbox.manage"] },
  { prefix: "/admin/newsletter", anyOf: ["newsletter.manage"] },
  { prefix: "/admin/blogs", anyOf: ["blogs.manage"] },
  { prefix: "/admin/seo", anyOf: ["seo.manage"] },
  { prefix: "/admin/reports", anyOf: ["reports.view"] },
  { prefix: "/admin/appearance", anyOf: ["appearance.manage"] },
  { prefix: "/admin/settings", anyOf: ["settings.manage"] },
  { prefix: "/admin/system", anyOf: ["system.view"] },
];

export function permissionsForPath(pathname: string): Permission[] {
  const path = pathname.split("?")[0];
  return ADMIN_PAGE_PERMISSION.find((p) => path === p.prefix || path.startsWith(`${p.prefix}/`))?.anyOf || ["dashboard.view"];
}

export const canAny = (granted: readonly string[], needed: readonly Permission[]) => needed.some((p) => granted.includes(p));
