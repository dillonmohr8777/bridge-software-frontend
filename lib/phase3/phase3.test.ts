import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreatePromotion,
  canPublishPost,
  canViewProtectedProfile,
  resolveEffectiveAudiences,
  validateUploadFile,
} from "./audiences.ts";
import { MockPhase3Client, mockHarborClaims } from "./mock-client.ts";
import { Phase3Error } from "./types.ts";

test("protected detail removes Adults 21+ from the effective audience set", () => {
  assert.deepEqual(
    resolveEffectiveAudiences(["adults", "retailers", "adults"], true),
    ["retailers"],
  );
});

test("publish is blocked when no eligible audience remains", () => {
  assert.equal(canPublishPost(["adults"], true, null), false);
  assert.equal(canPublishPost(["retailers"], true, null), true);
  assert.equal(canPublishPost(["retailers"], false, "File exceeds 25 MB."), false);
});

test("upload validation accepts only the contracted file types and size", () => {
  const png = new File(["ok"], "promo.png", { type: "image/png" });
  assert.equal(validateUploadFile(png), null);

  const gif = new File(["no"], "promo.gif", { type: "image/gif" });
  assert.match(validateUploadFile(gif) ?? "", /Unsupported type/);

  const huge = new File(["ok"], "promo.png", { type: "image/png" });
  Object.defineProperty(huge, "size", { value: 25 * 1024 * 1024 + 1 });
  assert.match(validateUploadFile(huge) ?? "", /25 MB/);
});

test("verified dispensary with create_promotion can publish; unverified cannot", () => {
  assert.equal(canCreatePromotion(mockHarborClaims), true);
  assert.equal(
    canCreatePromotion({ ...mockHarborClaims, organizationVerificationState: "pending" }),
    false,
  );
  assert.equal(
    canViewProtectedProfile({ ...mockHarborClaims, delegatedPermissions: ["create_promotion"] }),
    false,
  );
});

test("mock promotion slice records an upload and a protected post", async () => {
  const client = new MockPhase3Client();
  const file = new File(["asset"], "menu.png", { type: "image/png" });
  const upload = await client.createUploadIntent(file);
  const post = await client.createPost({
    contentType: "Promotion",
    message: "Autumn flower special for verified retailers",
    uploadId: upload.uploadId,
    audienceIds: ["retailers"],
    protectedDetail: true,
  });
  assert.equal(post.moderationState, "published");
  assert.deepEqual(post.audienceIds, ["retailers"]);
  assert.equal(post.protectedDetail, true);
});

test("mock promotion slice rejects protected detail aimed at Adults 21+", async () => {
  const client = new MockPhase3Client();
  await assert.rejects(
    () => client.createPost({
      contentType: "Promotion",
      message: "Public wholesale price list",
      uploadId: null,
      audienceIds: ["adults"],
      protectedDetail: true,
    }),
    (error: unknown) => error instanceof Phase3Error && error.code === "validation",
  );
});

test("protected profile projection hides contacts in public view and records confirmation", async () => {
  const now = new Date("2026-08-19T17:00:00.000Z");
  const client = new MockPhase3Client({ now: () => now });
  const publicView = await client.getProfileProjection("public");
  const protectedView = await client.getProfileProjection("protected");
  assert.equal(publicView.contacts.length, 0);
  assert.equal(protectedView.contacts.length, 2);
  assert.equal(protectedView.confirmation.status, "needed");

  const confirmation = await client.confirmContacts({ organizationId: "org-harbor" });
  assert.equal(confirmation.actorUserId, "user-harbor-owner");
  assert.equal(confirmation.nextDue, "2026-11-17T17:00:00.000Z");

  const after = await client.getProfileProjection("protected");
  assert.equal(after.confirmation.status, "confirmed");
  assert.equal(after.confirmation.confirmedAt, confirmation.confirmedAt);
});

test("mock client maps a forced failure to a retryable unavailable error", async () => {
  const client = new MockPhase3Client({ failNext: true });
  await assert.rejects(
    () => client.getSession(),
    (error: unknown) => error instanceof Phase3Error && error.code === "unavailable",
  );
  const session = await client.getSession();
  assert.equal(session.userId, "user-harbor-owner");
});
