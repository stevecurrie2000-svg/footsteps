import { defineMiddleware } from "astro:middleware";
import { getAdminEmail } from "./lib/admin-auth";

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.viewerIsAdmin = false;
  try {
    const email = await getAdminEmail(context.request);
    if (email) context.locals.viewerIsAdmin = true;
  } catch {
    // decoration only — never gate on failure
  }
  return next();
});
