export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../../lib/admin-auth";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = parseInt(params.id ?? "");
  if (isNaN(id)) {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const preview = await env.DB.prepare(
    `SELECT COUNT(*) AS photo_count FROM photos WHERE city_id = ?`
  ).bind(id).first<{ photo_count: number }>();

  return new Response(JSON.stringify(preview), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
