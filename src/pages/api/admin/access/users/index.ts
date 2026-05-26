export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../../lib/admin-auth";
import {
  listAllowlistEmails,
  addEmail,
  getLastSignInByEmail,
} from "../../../../../lib/cf-access";

const ADMIN_SELF = "stevecurrie2000@gmail.com";

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const token = env.CF_ACCESS_API_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "CF_ACCESS_API_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const [emails, notesResult, lastSignIns] = await Promise.all([
      listAllowlistEmails(token),
      env.DB.prepare("SELECT email, note FROM access_user_notes").all<{ email: string; note: string }>(),
      getLastSignInByEmail(token),
    ]);

    const notesMap = new Map<string, string>(
      (notesResult.results ?? []).map((r) => [r.email.toLowerCase(), r.note])
    );

    const users = emails.map((email) => ({
      email,
      note: notesMap.get(email) ?? "",
      last_sign_in: lastSignIns.get(email) ?? null,
      is_self: email === ADMIN_SELF,
    }));

    return new Response(JSON.stringify({ users }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const token = env.CF_ACCESS_API_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "CF_ACCESS_API_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: { email?: string; note?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const note = (body.note ?? "").trim();

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRe.test(email)) {
    return new Response(
      JSON.stringify({ error: "Invalid email format." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }
  if (!email.endsWith("@gmail.com")) {
    return new Response(
      JSON.stringify({ error: "Only @gmail.com addresses are accepted (Google SSO requirement)." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await addEmail(token, email);
    if (note) {
      await env.DB.prepare(
        `INSERT INTO access_user_notes (email, note) VALUES (?, ?)
         ON CONFLICT(email) DO UPDATE SET note = excluded.note, updated_at = datetime('now')`
      ).bind(email, note).run();
    }
    return new Response(JSON.stringify({ ok: true, email }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
