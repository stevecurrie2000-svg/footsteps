export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../lib/admin-auth";

type CityRow = { slug: string; name: string };

export const GET: APIRoute = async ({ request }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const slug = new URL(request.url).searchParams.get("country");
  if (!slug) {
    return new Response(JSON.stringify({ error: "Missing country parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { results } = await env.DB.prepare(
      `SELECT c.slug, c.name FROM cities c
       JOIN countries co ON c.country_id = co.id
       WHERE co.slug = ?
       ORDER BY c.name ASC`
    )
      .bind(slug)
      .all<CityRow>();

    return new Response(JSON.stringify({ cities: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to query cities" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
