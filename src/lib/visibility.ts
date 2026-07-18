// Visibility policy for My-Blog.
//
// Source of truth: REQUIREMENTS.md section 3.2 (visibility matrix):
//
//   role \ visibility | PUBLIC | PRIVATE | PASSWORD
//   ----------------+--------+---------+----------
//   GUEST           |  yes   |  no     |  no      
//   USER            |  yes   |  yes    |  password required
//   ADMIN           |  yes   |  yes    |  yes     
//
// This module is pure logic; the database / Prisma layer never reaches
// into it. Day 2 keeps the API surface small. Phase 3 (articles) wires it
// into the public list and detail routes.

export type VisibilityKind = "PUBLIC" | "PRIVATE" | "PASSWORD";

export type ViewerRole = "GUEST" | "USER" | "ADMIN";

export interface Viewer {
  /** Whether a session cookie is present. */
  authenticated: boolean;
  /** ADMIN vs USER; only meaningful when authenticated. */
  role: "ADMIN" | "USER";
}

export interface VisibilityContext {
  visibility: VisibilityKind;
  /** Result of the visitor-supplied password attempt. */
  passwordProvided?: string | null;
  /** Plaintext password stored against the content (only used when the
     visitor supplies one). Never returned by the helpers below. */
  contentPassword?: string | null;
}

export type DenialReason =
  | "GUEST_PRIVATE"
  | "GUEST_PASSWORD"
  | "USER_PASSWORD_REQUIRED"
  | "USER_PASSWORD_MISMATCH";

export type VisibilityDecision =
  | { allowed: true }
  | { allowed: false; reason: DenialReason };

function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  // Same length check first so timingSafeEqual does not throw on differing
  // lengths; characters still run in constant time within each branch.
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function viewerRoleOf(viewer: Viewer | null | undefined): ViewerRole {
  if (!viewer || !viewer.authenticated) return "GUEST";
  return viewer.role;
}

/**
 * Returns whether the viewer may access content with the given visibility.
 *
 * ADMINs always pass. GUESTs only see PUBLIC. USERs see PUBLIC + PRIVATE
 * and may unlock PASSWORD when the supplied plaintext matches the stored
 * contentPassword.
 */
export function canViewContent(
  viewer: Viewer | null | undefined,
  ctx: VisibilityContext,
): VisibilityDecision {
  if (viewer && viewer.role === "ADMIN") {
    return { allowed: true };
  }
  const role = viewerRoleOf(viewer);

  switch (ctx.visibility) {
    case "PUBLIC":
      return { allowed: true };
    case "PRIVATE":
      return role === "GUEST"
        ? { allowed: false, reason: "GUEST_PRIVATE" }
        : { allowed: true };
    case "PASSWORD":
      if (role === "GUEST") {
        return { allowed: false, reason: "GUEST_PASSWORD" };
      }
      if (!ctx.passwordProvided) {
        return { allowed: false, reason: "USER_PASSWORD_REQUIRED" };
      }
      return safeEqual(ctx.passwordProvided, ctx.contentPassword)
        ? { allowed: true }
        : { allowed: false, reason: "USER_PASSWORD_MISMATCH" };
  }
}

// Lightweight predicates over the matrix, mostly useful for unit tests and
// for places that only need a boolean (e.g. conditionally rendering links).
export function canListInPublicIndex(
  viewer: Viewer | null | undefined,
  visibility: VisibilityKind,
): boolean {
  // GUESTs see only PUBLIC entries in indexes; USER/ADMIN see PRIVATE too.
  if (visibility === "PUBLIC") return true;
  if (visibility === "PRIVATE") {
    return Boolean(viewer?.authenticated);
  }
  return false;
}

// Re-export for tests.
export const __internal = { safeEqual };
