import { audienceIds, type AudienceId, type SessionClaims } from "./types.ts";

export const audienceCatalog: ReadonlyArray<{
  id: AudienceId;
  label: string;
  publicSafe: boolean;
}> = [
  { id: "adults", label: "Adults 21+", publicSafe: true },
  { id: "retailers", label: "Verified retailers", publicSafe: false },
  { id: "industry", label: "Industry professionals", publicSafe: false },
];

export const allowedUploadTypes = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "application/pdf",
] as const;

export const maxUploadBytes = 25 * 1024 * 1024;

export function isAudienceId(value: string): value is AudienceId {
  return (audienceIds as readonly string[]).includes(value);
}

export function resolveEffectiveAudiences(
  selected: readonly string[],
  protectedDetail: boolean,
): AudienceId[] {
  const unique = selected.filter(isAudienceId).filter((id, index, list) => list.indexOf(id) === index);
  if (!protectedDetail) return unique;
  return unique.filter((id) => id !== "adults");
}

export function canPublishPost(
  selected: readonly string[],
  protectedDetail: boolean,
  fileError: string | null,
): boolean {
  return resolveEffectiveAudiences(selected, protectedDetail).length > 0 && fileError === null;
}

export function validateUploadFile(file: File): string | null {
  if (!allowedUploadTypes.includes(file.type as (typeof allowedUploadTypes)[number])) {
    return "Unsupported type. Use PNG, JPEG, WebP, or PDF.";
  }
  if (file.size > maxUploadBytes) {
    return "File exceeds 25 MB.";
  }
  return null;
}

export function canCreatePromotion(claims: SessionClaims): boolean {
  if (!claims.ageEligible) return false;
  if (claims.membershipStatus !== "active") return false;
  if (claims.adminScope) return true;
  if (claims.organizationVerificationState !== "verified") return false;
  return claims.delegatedPermissions.includes("create_promotion");
}

export function canViewProtectedProfile(claims: SessionClaims): boolean {
  if (claims.adminScope) return true;
  if (claims.membershipStatus !== "active") return false;
  return claims.delegatedPermissions.includes("view_protected_profile");
}

export function canConfirmContacts(claims: SessionClaims): boolean {
  if (claims.adminScope) return true;
  if (claims.membershipStatus !== "active") return false;
  if (claims.organizationVerificationState !== "verified") return false;
  return claims.delegatedPermissions.includes("confirm_contacts");
}

export function audienceLabel(id: AudienceId): string {
  return audienceCatalog.find((item) => item.id === id)?.label ?? id;
}
