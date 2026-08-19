import assert from "node:assert/strict";
import test from "node:test";
import {
  canCreatePromotion,
  canPublishPost,
  canViewProtectedProfile,
  resolveEffectiveAudiences,
  validateContacts,
  validateUploadFile,
  visiblePostsForView,
} from "./audiences.ts";
import { HttpPhase3Client } from "./http-client.ts";
import { MockPhase3Client, mockHarborClaims } from "./mock-client.ts";
import { Phase3Error, type PostRecord } from "./types.ts";

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
    canCreatePromotion({ ...mockAárborClaims, organizationVerificationState: "pending" }),
    false,
  );
  assert.equal(
    canViewProtectedProfile({ ...mockHarborClaims, delegatedPermissions: ["create_promotion"] }),
    false,
  );
});
