export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../lib/admin-auth";

type CountryRow = { slug: string; name: string };

export const GET: APIRoute = async ({ request }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, name FROM countries ORDER BY name ASC"
    ).all<CountryRow>();

    return new Response(JSON.stringify({ countries: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Failed to query countries" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
