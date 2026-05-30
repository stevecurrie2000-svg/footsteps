// src/lib/access-jwt.ts
//
// Shared Cloudflare Access JWT validator. Used by:
//   - src/lib/admin-auth.ts        (gates /admin, /api/admin)
//   - src/lib/private-auth.ts      (gates /private, /api/private)
//   - src/pages/i/[key].ts         (gates private photo proxy)
//
// Returns the authenticated email on success, or null on any failure
// (missing header, bad signature, claim mismatch, JWKS unreachable).
// Callers translate null into the right HTTP response for their route.

import { jwtVerify, type JWTPayload } from "jose";
import {
  ACCESS_ISSUER,
  ACCESS_JWKS,
  isDevBypassAllowed,
} from "./access-config";

const JWT_HEADER = "Cf-Access-Jwt-Assertion";
// Cloudflare Access also sets this cookie on the browser for ALL routes on the
// domain (not just Access-protected ones). Reading it lets us detect the admin
// session on public pages (e.g. country pages) where Access never injects the
// header. The cookie value is identical in format to the header JWT.
const JWT_COOKIE = "CF_Authorization";
const EMAIL_HEADER = "Cf-Access-Authenticated-User-Email";

interface ValidationContext {
  request: Request;
  audience: string;
  env: unknown;
}

/**
 * Validate the Cloudflare Access JWT on `request` against the given
 * audience. Returns the verified email on success, null on any
 * validation failure.
 *
 * Logs a structured `console.warn` JSON line on every failure with
 * route, reason, and the email claim (if any could be decoded).
 */
export async function validateAccessJwt(
  ctx: ValidationContext
): Promise<string | null> {
  const { request, audience, env } = ctx;

  // Dev bypass: when ACCESS_DEV_BYPASS=true in .dev.vars AND the
  // request isn't from Cloudflare's edge, fall through to header
  // trust like today. Two gates guarantee this cannot fire in
  // production.
  if (isDevBypassAllowed(env, request)) {
    const email = request.headers.get(EMAIL_HEADER);
    return email && email.length > 0 ? email.toLowerCase() : null;
  }

  const token = request.headers.get(JWT_HEADER) ?? getCookieByName(request, JWT_COOKIE);
  if (!token) {
    logFailure(request, "missing_jwt", null);
    return null;
  }

  let payload: JWTPayload;
  try {
    const verified = await jwtVerify(token, ACCESS_JWKS, {
      issuer: ACCESS_ISSUER,
      audience,
      // exp + nbf checked automatically
    });
    payload = verified.payload;
  } catch (error) {
    const reason =
      (error as { code?: string }).code ??
      (error as Error).name ??
      "unknown";
    logFailure(request, reason, null);
    return null;
  }

  const email = typeof payload.email === "string" ? payload.email : null;
  if (!email) {
    logFailure(request, "missing_email_claim", null);
    return null;
  }

  return email.toLowerCase();
}

function getCookieByName(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return null;
}

function logFailure(
  request: Request,
  reason: string,
  email: string | null
): void {
  // Single-line JSON for easy filtering in Cloudflare Logs.
  console.warn(
    JSON.stringify({
      event: "access_jwt_validation_failed",
      route: new URL(request.url).pathname,
      reason,
      email,
      timestamp: new Date().toISOString(),
    })
  );
}
