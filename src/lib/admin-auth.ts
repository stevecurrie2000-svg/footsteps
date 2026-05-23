// src/lib/admin-auth.ts
//
// Admin route gating. Validates a Cloudflare Access JWT against the
// Footsteps Admin AUD, then cross-checks the email claim against
// the admin allowlist.
//
// Returns null on any failure; callers convert null into 403.
//
// JWT signature validation lives in src/lib/access-jwt.ts; the
// allowlist below is the final defence-in-depth check.

import { env } from "cloudflare:workers";
import { validateAccessJwt } from "./access-jwt";
import { ADMIN_AUD } from "./access-config";

export const ADMIN_EMAILS: Set<string> = new Set(["stevecurrie2000@gmail.com"]);

export async function getAdminEmail(request: Request): Promise<string | null> {
  const email = await validateAccessJwt({
    request,
    audience: ADMIN_AUD,
    env,
  });
  if (!email) return null;
  if (!ADMIN_EMAILS.has(email)) return null;
  return email;
}

export async function requireAdmin(
  request: Request
): Promise<{ email: string } | Response> {
  const email = await getAdminEmail(request);
  if (!email) {
    return new Response("Forbidden", { status: 403 });
  }
  return { email };
}
