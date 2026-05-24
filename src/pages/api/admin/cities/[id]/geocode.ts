export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../../lib/admin-auth";
import { forwardGeocode } from "../../../../../lib/nominatim";

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const cityId = Number(params.id);
  if (!Number.isInteger(cityId) || cityId <= 0) {
    return new Response(JSON.stringify({ error: "Invalid city id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const city = await env.DB.prepare(
    `SELECT ci.name AS city_name, co.name AS country_name
     FROM cities ci JOIN countries co ON ci.country_id = co.id
     WHERE ci.id = ?1`
  ).bind(cityId).first<{ city_name: string; country_name: string }>();

  if (!city) {
    return new Response(JSON.stringify({ error: "City not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const geo = await forwardGeocode(city.city_name, city.country_name);

  return new Response(JSON.stringify(geo), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
