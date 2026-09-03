import assert from "node:assert/strict";
import test from "node:test";
import { defaultJoinRole, isKnownJoinRole, joinRoles, resolveJoinRole } from "./join-roles.ts";
import { landingPathFor, safeNextPath } from "./safe-next.ts";

// Guards the /join sequence: Step 1 (role selection) must keep all twelve roles, and the
// role it captures must survive the hop to Step 2 (/join/account) without letting an
// arbitrary query value into the page or the register payload.

test("Step 1 still offers every one of the twelve member roles", () => {
  assert.equal(joinRoles.length, 12);
  assert.deepEqual(joinRoles.map((role) => role.name), [
    "Brand",
    "Dispensary",
    "Retailer",
    "Sales rep",
    "Cultivator",
    "Manufacturer",
    "Lab",
    "Transport",
    "Bank",
    "Service",
    "Media",
    "Hydroponics",
  ]);
});

test("every role card keeps its next-step title and requirements copy", () => {
  for (const role of joinRoles) {
    assert.ok(role.description.length > 0, `${role.name} lost its description`);
    assert.ok(role.nextTitle.length > 0, `${role.name} lost its next-step title`);
    assert.ok(role.requirements.length > 0, `${role.name} lost its requirements copy`);
  }
});

test("a role handed to Step 2 round-trips; anything else falls back to the default", () => {
  assert.equal(resolveJoinRole("Sales rep").name, "Sales rep");
  assert.equal(resolveJoinRole("Hydroponics").name, "Hydroponics");
  assert.equal(resolveJoinRole(null).name, defaultJoinRole);
  assert.equal(resolveJoinRole("").name, defaultJoinRole);
  assert.equal(resolveJoinRole("<script>alert(1)</script>").name, defaultJoinRole);
  assert.equal(resolveJoinRole("Administrator").name, defaultJoinRole);
  assert.equal(isKnownJoinRole("Brand"), true);
  assert.equal(isKnownJoinRole("Administrator"), false);
});

test("post-sign-in routing sends members to their profile and admins to /admin", () => {
  assert.equal(landingPathFor(false), "/my-profile");
  assert.equal(landingPathFor(true), "/admin");
});

test("only same-origin next paths survive the redirect guard", () => {
  assert.equal(safeNextPath("/admin/verification"), "/admin/verification");
  assert.equal(safeNextPath("/my-profile?tab=contacts"), "/my-profile?tab=contacts");
  assert.equal(safeNextPath("//evil.example.com"), null);
  assert.equal(safeNextPath("/\\evil.example.com"), null);
  assert.equal(safeNextPath("https://evil.example.com"), null);
  assert.equal(safeNextPath("javascript:alert(1)"), null);
  assert.equal(safeNextPath(null), null);
  assert.equal(safeNextPath(""), null);
});
