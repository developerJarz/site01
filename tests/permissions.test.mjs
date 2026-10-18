import test from "node:test";
import assert from "node:assert/strict";
import { BUILT_IN_STAFF_ROLES, PERMISSION_KEYS, canAny, cleanPermissions, isStaffRole, permissionsForPath } from "../src/lib/permissions.ts";

test("customer roles never count as team roles", () => {
  for (const role of ["guest", "buyer", "seller", "dealer", "", undefined, null]) assert.equal(isStaffRole(role), false, String(role));
  for (const role of ["admin", "moderator", "editor", "listing-checker"]) assert.equal(isStaffRole(role), true, role);
});

test("admin holds every permission", () => {
  assert.deepEqual(BUILT_IN_STAFF_ROLES.find((r) => r.key === "admin").permissions, PERMISSION_KEYS);
});

test("unknown permissions are dropped and the order is canonical", () => {
  assert.deepEqual(cleanPermissions(["users.view", "make.me.admin", "dashboard.view", "users.view"]), ["dashboard.view", "users.view"]);
  assert.deepEqual(cleanPermissions("everything"), []);
});

test("admin pages map to the permission they need", () => {
  assert.deepEqual(permissionsForPath("/admin"), ["dashboard.view"]);
  assert.deepEqual(permissionsForPath("/admin/users?role=dealer"), ["users.view"]);
  assert.deepEqual(permissionsForPath("/admin/listings?papers=awaiting"), ["listings.manage", "papers.verify"]);
  assert.deepEqual(permissionsForPath("/admin/appearance"), ["appearance.manage"]);
  // A prefix only matches whole path segments.
  assert.deepEqual(permissionsForPath("/admin/usersettings"), ["dashboard.view"]);
});

test("a paper checker can open listings but not users", () => {
  const granted = ["dashboard.view", "papers.verify"];
  assert.equal(canAny(granted, permissionsForPath("/admin/listings")), true);
  assert.equal(canAny(granted, permissionsForPath("/admin/users")), false);
});
