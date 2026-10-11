import { expect, test } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const org1 = "22222222-2222-4222-8222-222222222222";
const org2 = "33333333-3333-4333-8333-333333333333";
const business = "44444444-4444-4444-8444-444444444444";
const profile = {
  id: "55555555-5555-4555-8555-555555555555", organizationId: org1, businessId: business,
  slug: "example-brand", displayName: "Example Brand", summary: "Wholesale partners", story: "Our story",
  businessType: "brand", categories: ["Wholesale"], city: "Portland", state: "Oregon", region: "Willamette Valley",
  publicContact: { email: "hello@example.test", phone: "555-010-1000" }, license: { type: "METRC", number: "TEST-100" },
  links: [
    { type: "website", label: "Website", url: "https://example.test", sortOrder: 0 },
    { type: "website", label: "Wholesale", url: "https://wholesale.example.test", sortOrder: 1 },
    { type: "menu", label: "Menu", url: "https://example.test/menu", sortOrder: 2 },
  ],
  logoUrl: null, status: "approved", hasPublishedVersion: true, legalName: "Example Brand LLC", dbaName: "Example Brand", verified: true,
};
function identity(role = "owner") {
  return { user: { id: "11111111-1111-4111-8111-111111111111", email: "owner@example.test", accountType: "standard", platformRoles: [], profile: { displayName: "Example Owner", phone: null } },
    memberships: [org1, org2].map((organizationId, index) => ({ organizationId, organizationName: index ? "Second organization" : "First organization", organizationType: "brand", role, status: "active" })) };
}
async function setup(page, handler, role = "owner", suppliedIdentity = null) {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => { if (entry.type() === "error") errors.push(`${entry.text()} ${entry.location().url}`); });
  await page.addInitScript(() => {
    localStorage.setItem("bridge-age-confirmed-v1", "confirmed");
    // Keep pagination deliberate so the test can exercise filter changes during an in-flight next page.
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  });
  await page.route("https://bridge-api.example.test/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/auth/me") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return route.fulfill({ json: suppliedIdentity ?? identity(role) });
    }
    if (url.pathname === "/api/v1/notifications") return route.fulfill({ json: { notifications: [], pageInfo: { limit: 50, offset: 0, hasMore: false } } });
    const result = await handler(route, url);
    if (result !== false) return;
    console.error(`Unexpected fixture route: ${url.href}`);
    return route.fulfill({ status: 404, json: { error: "NOT_FOUND", message: "Unexpected fixture route" } });
  });
  return errors;
}
async function openPage(page, path) {
  await page.goto(path);
  // Auth can resolve beneath the age gate before its requestAnimationFrame unlocks
  // the page. Wait for actual user interactivity before editing controlled inputs.
  await expect(page.locator(".age-gated-content")).not.toHaveAttribute("inert", "", { timeout: 15000 });
  await expect(page.locator(".age-gated-content")).toHaveAttribute("aria-hidden", "false");
}
async function evidence(page, testInfo, name, errors) {
  await expect(page.locator("body")).not.toBeEmpty();
  await expect(page.locator("nextjs-portal")).toHaveCount(0);
  expect(errors).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  await mkdir("/tmp/bridge-m4-evidence", { recursive: true });
  const path = `/tmp/bridge-m4-evidence/${testInfo.project.name}-${name}.png`;
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: "image/png" });
}


const rep1 = { membershipId: "77777777-7777-4777-8777-777777777777", userId: "88888888-8888-4888-8888-888888888888", displayName: "Assigned Rep" };
const rep2 = { membershipId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", userId: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb", displayName: "New Rep" };
const admin = { userId: "99999999-9999-4999-8999-999999999999", displayName: "Assigned Admin" };
const inbox = { requests: [{ id: "66666666-6666-4666-8666-666666666666", status: "new", firstName: "Synthetic sender", message: "Assigned inquiry", createdAt: "2026-10-11T00:00:00Z" }], pageInfo: { limit: 20, offset: 0, hasMore: false } };

test("specific admin recipient without organization membership sees assigned inbox only", async ({ page }, info) => {
  const actions = [];
  const who = identity(); who.memberships = []; who.user.platformRoles = ["admin"];
  const errors = await setup(page, async (route, url) => {
    if (url.pathname.endsWith("/inbox-organizations")) return route.fulfill({ json: { organizations: [{ id: org1, name: "Assigned business" }] } });
    if (url.pathname.includes("/organizations/" + org1 + "/contact-requests")) {
      if (route.request().method() === "POST") { actions.push(route.request().postDataJSON()); return route.fulfill({ json: { request: { status: "responded" } } }); }
      return route.fulfill({ json: inbox });
    }
    return false;
  }, "owner", who);
  await openPage(page, "/requests");
  await expect(page.getByRole("heading", { name: "Contact request inbox" })).toBeVisible();
  await expect(page.getByLabel("Organization", { exact: true }).locator("option")).toHaveCount(1);
  await expect(page.getByText("Assigned inquiry", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Manage contact routing" })).toHaveCount(0);
  await page.getByRole("button", { name: "Mark responded", exact: true }).click();
  await expect.poll(() => actions.length).toBe(1);
  expect(actions[0]).toEqual({ status: "responded" });
  await evidence(page, info, "specific-recipient", errors);
});

test("global admin status alone grants no inbox and failed discovery can retry", async ({ page }, info) => {
  let attempt = 0;
  const who = identity(); who.memberships = []; who.user.platformRoles = ["admin"];
  const errors = await setup(page, async (route, url) => {
    if (!url.pathname.endsWith("/inbox-organizations")) return false;
    attempt++;
    if (attempt === 1) return route.fulfill({ status: 503, json: { error: "UNAVAILABLE", message: "Inbox service unavailable" } });
    return route.fulfill({ json: { organizations: [] } });
  }, "owner", who);
  await openPage(page, "/requests");
  await expect(page.locator("main .form-error[role=alert]")).toHaveText("Inbox service unavailable");
  await expect(page.getByRole("button", { name: "Mark responded" })).toHaveCount(0);
  await page.getByRole("button", { name: "Retry inbox access" }).click();
  await expect(page.getByRole("heading", { name: "No available inboxes" })).toBeVisible();
  await expect(page.getByLabel("Organization", { exact: true })).toHaveCount(0);
  await evidence(page, info, "no-inbox", errors.filter(e => !e.includes("503")));
});

test("owner selects bounded representative, preserves admin, then clears to owner fallback", async ({ page }, info) => {
  let routing = { salesRepresentative: rep1, bridgeAdmin: admin };
  let failRead = true, failSave = true;
  const saves = [];
  const errors = await setup(page, async (route, url) => {
    if (url.pathname.endsWith("/inbox-organizations")) return route.fulfill({ json: { organizations: [{ id: org1, name: "First organization" }] } });
    if (url.pathname.endsWith("/contact-routing/candidates")) return route.fulfill({ json: { candidates: { salesRepresentatives: [rep1, rep2], bridgeAdmin: admin } } });
    if (url.pathname.endsWith("/contact-routing")) {
      if (route.request().method() === "PUT") {
        saves.push(route.request().postDataJSON());
        if (failSave) { failSave = false; return route.fulfill({ status: 409, json: { error: "STALE_ASSIGNMENT", message: "Assignment changed. Try again." } }); }
        const body = saves.at(-1);
        routing = { salesRepresentative: body.salesRepresentativeMembershipId === rep2.membershipId ? rep2 : null, bridgeAdmin: body.bridgeAdminUserId ? admin : null };
        return route.fulfill({ json: { routing } });
      }
      if (failRead) { failRead = false; return route.fulfill({ status: 503, json: { error: "UNAVAILABLE", message: "Routing unavailable" } }); }
      return route.fulfill({ json: { routing } });
    }
    if (url.pathname.endsWith("/contact-requests")) return route.fulfill({ json: inbox });
    return false;
  });
  await openPage(page, "/requests");
  await page.getByRole("button", { name: "Manage contact routing" }).click();
  await expect(page.locator("main .form-error[role=alert]")).toHaveText("Routing unavailable");
  await expect(page.getByRole("button", { name: "Save routing changes" })).toHaveCount(0);
  expect(saves).toHaveLength(0);
  await page.getByRole("button", { name: "Retry routing" }).click();
  const selector = page.getByLabel("Assigned sales representative", { exact: true });
  await expect(selector).toHaveValue(rep1.membershipId);
  await expect(selector.locator("option")).toHaveCount(3);
  await expect(page.getByRole("button", { name: "Save routing changes" })).toBeDisabled();
  await selector.selectOption(rep2.membershipId);
  await page.getByRole("button", { name: "Save routing changes" }).click();
  await expect(page.locator("main .form-error[role=alert]")).toHaveText("Assignment changed. Try again.");
  await expect(selector).toHaveValue(rep2.membershipId);
  await page.getByRole("button", { name: "Save routing changes" }).click();
  await expect(page.getByText("Contact routing saved.", { exact: true })).toBeVisible();
  expect(saves.at(-1)).toEqual({ salesRepresentativeMembershipId: rep2.membershipId, bridgeAdminUserId: admin.userId });
  await selector.selectOption("");
  await page.getByLabel("Remove assigned Bridge administrator").check();
  await page.getByRole("button", { name: "Save routing changes" }).click();
  await expect(page.getByText("Contact routing saved.", { exact: true })).toBeVisible();
  expect(saves.at(-1)).toEqual({ salesRepresentativeMembershipId: null, bridgeAdminUserId: null });
  await expect(page.getByLabel("Remove assigned Bridge administrator")).toHaveCount(0);
  await evidence(page, info, "routing-owner-fallback", errors.filter(e => !e.includes("503") && !e.includes("409")));
});

test("switching inbox hides old routing and scopes subsequent edits", async ({ page }, info) => {
  const saves = [];
  const errors = await setup(page, async (route, url) => {
    if (url.pathname.endsWith("/inbox-organizations")) return route.fulfill({ json: { organizations: [{ id: org1, name: "First organization" }, { id: org2, name: "Second organization" }] } });
    if (url.pathname.endsWith("/contact-routing/candidates")) return route.fulfill({ json: { candidates: { salesRepresentatives: [rep2], bridgeAdmin: null } } });
    if (url.pathname.endsWith("/contact-routing")) {
      if (route.request().method() === "PUT") { saves.push(url.pathname); return route.fulfill({ json: { routing: { salesRepresentative: rep2, bridgeAdmin: null } } }); }
      return route.fulfill({ json: { routing: { salesRepresentative: null, bridgeAdmin: null } } });
    }
    if (url.pathname.endsWith("/contact-requests")) return route.fulfill({ json: inbox });
    return false;
  });
  await openPage(page, "/requests");
  await page.getByRole("button", { name: "Manage contact routing" }).click();
  await expect(page.getByLabel("Assigned sales representative", { exact: true })).toBeVisible();
  await page.getByLabel("Organization", { exact: true }).selectOption(org2);
  await expect(page.getByLabel("Assigned sales representative", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Manage contact routing" }).click();
  await page.getByLabel("Assigned sales representative", { exact: true }).selectOption(rep2.membershipId);
  await page.getByRole("button", { name: "Save routing changes" }).click();
  await expect(page.getByText("Contact routing saved.", { exact: true })).toBeVisible();
  expect(saves).toEqual(["/api/v1/organizations/" + org2 + "/directory-profile/contact-routing"]);
  await evidence(page, info, "routing-scope", errors);
});

test("older API 404 keeps owner inbox while contact selector stays read only", async ({ page }, info) => {
  const writes = [];
  const errors = await setup(page, async (route, url) => {
    if (route.request().method() !== "GET") writes.push(url.pathname);
    if (url.pathname.endsWith("/inbox-organizations") || url.pathname.endsWith("/contact-routing/candidates")) return route.fulfill({ status: 404, json: { error: "NOT_FOUND", message: "Not found" } });
    if (url.pathname.endsWith("/contact-routing")) return route.fulfill({ json: { routing: { salesRepresentative: rep1, bridgeAdmin: admin } } });
    if (url.pathname.endsWith("/contact-requests")) return route.fulfill({ json: inbox });
    return false;
  });
  await openPage(page, "/requests");
  await expect(page.getByLabel("Organization", { exact: true })).toHaveValue(org1);
  await expect(page.getByText("Assigned inquiry", { exact: true })).toBeVisible();
  await expect(page.getByText(/Showing your owner\/admin business inboxes/)).toBeVisible();
  await page.getByRole("button", { name: "Manage contact routing" }).click();
  await expect(page.getByText(/Contact selection is not available on this API yet/)).toBeVisible();
  await expect(page.getByLabel("Assigned sales representative", { exact: true })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Save routing changes" })).toHaveCount(0);
  expect(writes).toEqual([]);
  await evidence(page, info, "legacy-api", errors.filter(e => !e.includes("404")));
});

test("discovery 403 never falls back to owner memberships", async ({ page }, info) => {
  let inboxReads = 0;
  const errors = await setup(page, async (route, url) => {
    if (url.pathname.endsWith("/inbox-organizations")) return route.fulfill({ status: 403, json: { error: "FORBIDDEN", message: "Inbox access denied" } });
    if (url.pathname.endsWith("/contact-requests")) { inboxReads++; return route.fulfill({ json: inbox }); }
    return false;
  });
  await openPage(page, "/requests");
  await expect(page.locator("main .form-error[role=alert]")).toHaveText("Inbox access denied");
  await expect(page.getByLabel("Organization", { exact: true })).toHaveCount(0);
  expect(inboxReads).toBe(0);
  await evidence(page, info, "forbidden-inbox", errors.filter(e => !e.includes("403")));
});
