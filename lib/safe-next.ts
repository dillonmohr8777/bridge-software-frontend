/**
 * Only same-origin, single-slash paths survive. Everything else — absolute URLs,
 * protocol-relative "//evil.example", backslash tricks — collapses to null, so a crafted
 * ?next= cannot bounce a signed-in member off Bridge.
 */
export function safeNextPath(value: string | null | undefined): string | null {
  if (!value) return null;
  if (!value.startsWith("/")) return null;
  if (value.startsWith("//")) return null;
  if (value.startsWith("/\\")) return null;
  return value;
}

/**
 * Where a signed-in identity lands. Presentation only: the server still authorizes every
 * admin read and write regardless of which path the browser chose.
 */
export function landingPathFor(isAdmin: boolean): string {
  return isAdmin ? "/admin" : "/my-profile";
}
