export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../../lib/admin-auth";

export const GET: APIRoute = async ({ request, params }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const slug = params.slug ?? "";
  const country = await env.DB.prepare(
    `SELECT id FROM countries WHERE slug = ?`
  ).bind(slug).first<{ id: number }>();

  if (!country) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const preview = await env.DB.prepare(`
    SELECT
      COUNT(DISTINCT ci.id) AS city_count,
      COUNT(DISTINCT p.id)  AS photo_count
    FROM countries c
    LEFT JOIN cities ci ON ci.country_id = c.id
    LEFT JOIN photos p  ON p.country_id  = c.id
    WHERE c.id = ?1
  `).bind(country.id).first<{ city_count: number; photo_count: number }>();

  return new Response(JSON.stringify(preview), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
