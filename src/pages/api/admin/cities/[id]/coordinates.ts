export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../../lib/admin-auth";

export const PATCH: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const cityId = Number(params.id);
  if (!Number.isInteger(cityId) || cityId <= 0) {
    return new Response(JSON.stringify({ error: "Invalid city id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { latitude?: unknown; longitude?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const lat = body.latitude === null ? null : Number(body.latitude);
  const lon = body.longitude === null ? null : Number(body.longitude);

  if (lat !== null && (!Number.isFinite(lat) || lat < -90 || lat > 90)) {
    return new Response(JSON.stringify({ error: "Invalid latitude" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (lon !== null && (!Number.isFinite(lon) || lon < -180 || lon > 180)) {
    return new Response(JSON.stringify({ error: "Invalid longitude" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const result = await env.DB.prepare(
    `UPDATE cities SET latitude = ?1, longitude = ?2 WHERE id = ?3
     RETURNING id, slug, name, latitude, longitude`
  ).bind(lat, lon, cityId).first<{ id: number; slug: string; name: string; latitude: number | null; longitude: number | null }>();

  if (!result) {
    return new Response(JSON.stringify({ error: "City not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
