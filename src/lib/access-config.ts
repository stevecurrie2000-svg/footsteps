// src/lib/access-config.ts
//
// Centralised configuration for Cloudflare Access JWT validation.
// AUD values are public identifiers (they appear in every JWT we receive)
// and not secrets — they live in source control alongside the helpers
// that use them.

import { createRemoteJWKSet } from "jose";

export const ACCESS_TEAM_DOMAIN = "silent-bonus-1d5b.cloudflareaccess.com";
export const ACCESS_ISSUER = `https://${ACCESS_TEAM_DOMAIN}`;
export const ACCESS_JWKS_URL = `${ACCESS_ISSUER}/cdn-cgi/access/certs`;

// AUD tags from the Cloudflare Zero Trust dashboard.
// Public values — not secrets.
export const ADMIN_AUD =
  "bafdabb557e52a26bdc2a4dba3f5f14c4d134c7516c0fe88c8fdf1d81f9a8152";
export const PRIVATE_AUD =
  "df9c357e79378370ed071fbab914a7d3cbdc3d10bc0b8768abf0402dc9f53277";

// Shared JWKS instance — cached per Worker isolate, auto-refetches on
// kid miss (Cloudflare rotates keys periodically). Built-in cooldown
// prevents refetch storms on hostile/malformed tokens.
export const ACCESS_JWKS = createRemoteJWKSet(new URL(ACCESS_JWKS_URL));

/**
 * Dev-only escape hatch for `wrangler dev`.
 *
 * Cloudflare Access only injects identity headers on traffic that
 * arrives through its edge. `wrangler dev` runs on localhost where
 * Access never sees the request, so we can't validate a real JWT
 * locally. This bypass lets local dev fall through to the existing
 * header-trust behaviour.
 *
 * Two independent gates protect against this firing in production:
 *
 *   1. The `ACCESS_DEV_BYPASS=true` env var must be set explicitly.
 *      `.dev.vars` is gitignored; the var is not in `wrangler.jsonc`;
 *      it cannot be set in production unless someone deliberately
 *      configures it.
 *
 *   2. A runtime sanity check confirms we are not in a deployed
 *      Worker (Cloudflare's edge sets `CF-Ray` and other request
 *      headers on real traffic; localhost doesn't).
 */
export function isDevBypassAllowed(env: unknown, request: Request): boolean {
  const explicitlyEnabled =
    (env as { ACCESS_DEV_BYPASS?: string })?.ACCESS_DEV_BYPASS === "true";
  if (!explicitlyEnabled) return false;

  // Cloudflare's edge stamps `CF-Ray` on every request that reaches
  // a deployed Worker. Wrangler dev does not. Absence of CF-Ray is a
  // strong "we are running locally" signal.
  const hasCfRay = request.headers.get("CF-Ray") !== null;
  if (hasCfRay) return false;

  return true;
}
