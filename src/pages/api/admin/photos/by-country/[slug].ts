export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../../lib/admin-auth";

type PhotoRow = {
  id: string;
  r2_key_thumb: string;
  city_id: number;
  is_public: number;
  capture_date: string | null;
  original_filename: string | null;
};

const SELECT = `
  SELECT p.id, p.r2_key_thumb, p.city_id, p.is_public, p.capture_date, p.original_filename
  FROM photos p
  JOIN countries c ON c.id = p.country_id
  WHERE c.slug = ?1
`;

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const slug = params.slug ?? "";
  const url = new URL(request.url);
  const filterPublic = url.searchParams.get("filter") === "public";
  const cityIdParam = url.searchParams.get("city_id");
  const cityId = cityIdParam ? parseInt(cityIdParam) : null;

  const publicClause = filterPublic ? " AND p.is_public = 1" : "";
  const tail = " ORDER BY p.created_at DESC";

  try {
    let results: PhotoRow[];

    if (cityId !== null && !isNaN(cityId)) {
      ({ results } = await env.DB.prepare(
        `${SELECT}${publicClause} AND p.city_id = ?2${tail}`
      ).bind(slug, cityId).all<PhotoRow>());
    } else {
      ({ results } = await env.DB.prepare(
        `${SELECT}${publicClause}${tail}`
      ).bind(slug).all<PhotoRow>());
    }

    return new Response(JSON.stringify({ photos: results }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("photos/by-country error:", err);
    return new Response(JSON.stringify({ error: "Failed to load photos" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
