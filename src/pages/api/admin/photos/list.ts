export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../lib/admin-auth";

type PhotoRow = {
  id: string;
  r2_key_thumb: string;
  r2_key_medium: string;
  original_filename: string | null;
  country_slug: string;
  country_name: string;
  city_id: number;
  city_slug: string;
  city_name: string;
  is_public: number;
  capture_date: string | null;
  latitude: number | null;
  longitude: number | null;
  uploaded_at: string;
  caption: string | null;
};

export const GET: APIRoute = async ({ request }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const url = new URL(request.url);
  const countryFilter = url.searchParams.get("country") ?? "";
  const cityFilter    = url.searchParams.get("city") ?? "";
  const audience      = url.searchParams.get("audience") ?? "";
  const sort          = url.searchParams.get("sort") ?? "upload_date_desc";
  const offset        = Math.max(0, parseInt(url.searchParams.get("offset") ?? "0") || 0);
  const limit         = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") ?? "50") || 50));

  const conditions: string[] = [];
  const binds: (string | number)[] = [];
  let idx = 1;

  if (countryFilter) {
    conditions.push(`c.slug = ?${idx++}`);
    binds.push(countryFilter);
  }
  if (cityFilter) {
    conditions.push(`ci.slug = ?${idx++}`);
    binds.push(cityFilter);
  }
  if (audience === "public") {
    conditions.push("p.is_public = 1");
  } else if (audience === "private") {
    conditions.push("p.is_public = 0");
  }

  const where = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";

  const orderClause =
    sort === "capture_date_desc" ? "p.capture_date DESC, p.created_at DESC" :
    sort === "country_asc"       ? "c.name ASC, p.created_at DESC" :
    "p.created_at DESC";

  const baseFrom = `
    FROM photos p
    JOIN countries c ON c.id = p.country_id
    JOIN cities ci ON ci.id = p.city_id
    ${where}
  `;

  const photosStmt = env.DB.prepare(`
    SELECT
      p.id, p.r2_key_thumb, p.r2_key_medium, p.original_filename,
      c.slug AS country_slug, c.name AS country_name,
      ci.id AS city_id, ci.slug AS city_slug, ci.name AS city_name,
      p.is_public, p.capture_date, p.latitude, p.longitude,
      p.created_at AS uploaded_at, p.caption
    ${baseFrom}
    ORDER BY ${orderClause}
    LIMIT ?${idx} OFFSET ?${idx + 1}
  `).bind(...binds, limit, offset);

  const countStmt = env.DB.prepare(`
    SELECT COUNT(*) AS total
    ${baseFrom}
  `).bind(...binds);

  try {
    const [photosResult, countResult] = await env.DB.batch([photosStmt, countStmt]);
    const photos = photosResult.results as PhotoRow[];
    const total = (countResult.results[0] as { total: number }).total;

    return new Response(JSON.stringify({ photos, total }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("photos/list error:", err);
    return new Response(JSON.stringify({ error: "Failed to load photos" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
