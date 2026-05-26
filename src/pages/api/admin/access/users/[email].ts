export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { removeEmail } from "../../../../../lib/cf-access";

const ADMIN_SELF = "stevecurrie2000@gmail.com";

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const token = env.CF_ACCESS_API_TOKEN;
  if (!token) {
    return new Response(
      JSON.stringify({ error: "CF_ACCESS_API_TOKEN not configured" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  const email = decodeURIComponent(params.email ?? "").toLowerCase();

  if (email === ADMIN_SELF) {
    return new Response(
      JSON.stringify({ error: "Admin's own access cannot be removed via this UI." }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    await removeEmail(token, email);
    await env.DB.prepare("DELETE FROM access_user_notes WHERE email = ?").bind(email).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const email = decodeURIComponent(params.email ?? "").toLowerCase();

  let body: { note?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const note = (body.note ?? "").trim();

  try {
    await env.DB.prepare(
      `INSERT INTO access_user_notes (email, note) VALUES (?, ?)
       ON CONFLICT(email) DO UPDATE SET note = excluded.note, updated_at = datetime('now')`
    ).bind(email, note).run();
    return new Response(JSON.stringify({ ok: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
