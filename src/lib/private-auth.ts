const PRIVATE_VIEWER_EMAILS = [
  "stevecurrie2000@gmail.com",
  "misslorraineingram@gmail.com",
  "mia.currie01@gmail.com",
  "alexcurrie429@gmail.com",
];

export function getPrivateViewerEmail(request: Request): string | null {
  const email = request.headers.get("Cf-Access-Authenticated-User-Email");
  if (!email) return null;
  if (!PRIVATE_VIEWER_EMAILS.includes(email.toLowerCase())) return null;
  return email.toLowerCase();
}

export function requirePrivateViewer(request: Request): Response | string {
  const email = getPrivateViewerEmail(request);
  if (!email) {
    return Response.redirect(new URL("/__not-found__", request.url).toString(), 302);
  }
  return email;
}
