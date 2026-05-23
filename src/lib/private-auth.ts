// src/lib/private-auth.ts
//
// Private route gating. Same shape as admin-auth.ts but validates
// against the Footsteps Private AUD and a 4-email allowlist.
//
// Returns 404 (not 403) on failure to hide the existence of the
// private section from unauthenticated visitors.

import { env } from "cloudflare:workers";
import { validateAccessJwt } from "./access-jwt";
import { PRIVATE_AUD } from "./access-config";

const PRIVATE_EMAILS = new Set([
  "stevecurrie2000@gmail.com",
  "misslorraineingram@gmail.com",
  "mia.currie01@gmail.com",
  "alexcurrie429@gmail.com",
]);

export async function getPrivateViewerEmail(
  request: Request
): Promise<string | null> {
  const email = await validateAccessJwt({
    request,
    audience: PRIVATE_AUD,
    env,
  });
  if (!email) return null;
  if (!PRIVATE_EMAILS.has(email)) return null;
  return email;
}

export async function requirePrivateViewer(
  request: Request
): Promise<{ email: string } | Response> {
  const email = await getPrivateViewerEmail(request);
  if (!email) {
    return Response.redirect(new URL("/__not-found__", request.url).toString(), 302);
  }
  return { email };
}
