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
async function setup(page, handler, role = "owner") {
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (entry) => { if (entry.type() === "error") errors.push(entry.text()); });
  await page.addInitScript(() => {
    localStorage.setItem("bridge-age-confirmed-v1", "confirmed");
    // Keep pagination deliberate so the test can exercise filter changes during an in-flight next page.
    window.IntersectionObserver = class { observe() {} unobserve() {} disconnect() {} };
  });
  await page.route("https://bridge-api.example.test/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/v1/auth/me") {
      await new Promise((resolve) => setTimeout(resolve, 250));
      return route.fulfill({ json: identity(role) });
    }
    const result = await handler(route, url);
    if (result !== false) return;
    return route.fulfill({ status: 404, json: { error: "NOT_FOUND", message: "Unexpected fixture route" } });
  });
  return errors;
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

test("async inbox membership enables status actions and switches organization scope", async ({ page }, testInfo) => {
  const actions = [];
  const errors = await setup(page, async (route, url) => {
    if (!url.pathname.includes("/contact-requests")) return false;
    const selected = url.pathname.includes(org2) ? org2 : org1;
    if (route.request().method() === "POST") {
      actions.push({ url: url.pathname, body: route.request().postDataJSON() });
      return route.fulfill({ json: { request: { status: "responded" } } });
    }
    return route.fulfill({ json: { requests: [{ id: "66666666-6666-4666-8666-666666666666", status: "new", firstName: selected === org1 ? "First sender" : "Second sender", workEmail: "sender@example.test", phoneNumber: "555-010-1001", yearsOfService: 2, message: selected === org1 ? "First inquiry" : "Second inquiry", createdAt: "2026-10-11T00:00:00Z" }], pageInfo: { limit: 20, offset: 0, hasMore: false } } });
  });
  await page.goto("/requests");
  await expect(page.getByLabel("Organization", { exact: true })).toHaveValue(org1);
  await page.getByRole("button", { name: "Mark responded", exact: true }).click();
  await expect.poll(() => actions.length).toBe(1);
  expect(actions[0].url).toContain(`/organizations/${org1}/contact-requests/`);
  expect(actions[0].body).toEqual({ status: "responded" });
  await page.getByLabel("Organization", { exact: true }).selectOption(org2);
  await expect(page.getByText("Second inquiry", { exact: true })).toBeVisible();
  await expect(page.getByText("First inquiry", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "Mark responded", exact: true }).click();
  await expect.poll(() => actions.length).toBe(2);
  expect(actions[1].url).toContain(`/organizations/${org2}/contact-requests/`);
  await evidence(page, testInfo, "inbox", errors);
});

for (const role of ["owner", "page_manager"]) {
  test(`${role} can save approved profile revisions without losing links`, async ({ page }, testInfo) => {
    const saves = [];
    const errors = await setup(page, async (route, url) => {
      if (url.pathname.endsWith("/businesses")) return route.fulfill({ json: { businesses: [{ id: business, organizationId: org1, legalName: "Example Brand LLC", dbaName: "Example Brand", status: "active" }] } });
      if (url.pathname.endsWith("/directory-profile")) {
        if (route.request().method() === "PUT") {
          const body = route.request().postDataJSON(); saves.push(body);
          return route.fulfill({ json: { profile: { ...profile, ...body, status: "draft" } } });
        }
        return route.fulfill({ json: { profile } });
      }
      return false;
    }, role);
    await page.goto("/my-profile");
    await expect(page.getByLabel("Display name", { exact: true })).toBeEnabled();
    await expect(page.getByLabel("Business", { exact: true })).toBeDisabled();
    await page.getByLabel("Display name", { exact: true }).fill("Revised Brand");
    await page.getByRole("button", { name: "Save draft", exact: true }).click();
    await expect(page.getByText("Draft saved. Submit it for review when ready.", { exact: true })).toBeVisible();
    expect(saves).toHaveLength(1);
    expect(saves[0].links).toEqual(profile.links);
    expect(saves[0].displayName).toBe("Revised Brand");
    if (role === "owner") await expect(page.getByRole("button", { name: "Submit for review", exact: true })).toBeEnabled();
    else await expect(page.getByRole("button", { name: "Submit for review", exact: true })).toHaveCount(0);
    await evidence(page, testInfo, `profile-${role}`, errors);
  });
}

test("directory filters reset cursor and discard an old in-flight page", async ({ page }, testInfo) => {
  const queries = [];
  let nextPageStarted = false;
  const errors = await setup(page, async (route, url) => {
    if (url.pathname !== "/api/v1/directory/profiles") return false;
    queries.push(Object.fromEntries(url.searchParams));
    const cursor = url.searchParams.get("cursor");
    if (cursor) {
      nextPageStarted = true;
      await new Promise((resolve) => setTimeout(resolve, 800));
      return route.fulfill({ json: { profiles: [{ ...profile, slug: "stale", displayName: "Stale next-page result" }], pageInfo: { nextCursor: null, hasMore: false } } });
    }
    const filtered = url.searchParams.get("state") === "Oregon";
    return route.fulfill({ json: { profiles: [{ ...profile, displayName: filtered ? "Filtered business" : "Initial business" }], pageInfo: { nextCursor: filtered ? null : "opaque-initial", hasMore: !filtered } } });
  });
  await page.goto("/explore");
  await expect(page.getByRole("heading", { name: "Initial business", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Load more", exact: true }).click();
  await expect.poll(() => nextPageStarted).toBe(true);
  await page.getByLabel("State", { exact: true }).fill("Oregon");
  await page.getByLabel("Category", { exact: true }).fill("Wholesale");
  await page.getByLabel("City", { exact: true }).fill("Portland");
  await page.getByLabel("Region", { exact: true }).fill("Willamette Valley");
  await page.getByLabel("Verification", { exact: true }).selectOption("true");
  await expect(page.getByRole("heading", { name: "Filtered business", exact: true })).toBeVisible();
  await expect.poll(() => queries.at(-1)?.verified).toBe("true");
  expect(queries.at(-1)).toMatchObject({ state: "Oregon", category: "Wholesale", city: "Portland", region: "Willamette Valley", verified: "true" });
  expect(queries.at(-1).cursor).toBeUndefined();
  await page.waitForTimeout(900);
  await expect(page.getByRole("heading", { name: "Stale next-page result", exact: true })).toHaveCount(0);
  await expect(page.getByText("Legal name: Example Brand LLC", { exact: true })).toBeVisible();
  await evidence(page, testInfo, "directory", errors);
});
