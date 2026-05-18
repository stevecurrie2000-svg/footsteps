/**
 * Slice 1 of Phase 4. Currently relies on the Cf-Access-Authenticated-User-Email
 * header being trustworthy because Cloudflare Access is the only path to this
 * Worker. Phase 6 hardening item: validate the Cf-Access-Jwt-Assertion JWT
 * signature against Cloudflare's JWKS endpoint
 * (https://<team>.cloudflareaccess.com/cdn-cgi/access/certs) to prevent
 * spoofed headers if the Worker ever becomes reachable without Access in front.
 */

export const ADMIN_EMAILS: Set<string> = new Set([
  "stevecurrie2000@gmail.com",
]);

export function getAdminEmail(request: Request): string | null {
  const raw = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (!raw) return null;
  const email = raw.toLowerCase().trim();
  return ADMIN_EMAILS.has(email) ? email : null;
}

export function requireAdmin(request: Request): { email: string } | Response {
  const email = getAdminEmail(request);
  if (email === null) {
    return new Response("Forbidden", { status: 403 });
  }
  return { email };
}
