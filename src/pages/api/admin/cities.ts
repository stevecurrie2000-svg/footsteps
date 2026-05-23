export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../lib/admin-auth";
import { slugify } from "../../../lib/nominatim";

type CityRow = { slug: string; name: string };

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
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

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  let body: { country_slug?: string; name?: string };
  try {
    body = await request.json() as { country_slug?: string; name?: string };
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const name = (body.name ?? "").trim().slice(0, 100);
  const countrySlug = (body.country_slug ?? "").trim();
  if (!name || !countrySlug) {
    return new Response(JSON.stringify({ error: "Missing name or country_slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const slug = slugify(name);
  if (!slug) {
    return new Response(JSON.stringify({ error: "Name produces empty slug" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const country = await env.DB.prepare(
    `SELECT id FROM countries WHERE slug = ?`
  ).bind(countrySlug).first<{ id: number }>();
  if (!country) {
    return new Response(JSON.stringify({ error: "Country not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const inserted = await env.DB.prepare(
      `INSERT INTO cities (country_id, slug, name) VALUES (?1, ?2, ?3) RETURNING id, slug, name`
    ).bind(country.id, slug, name).first<{ id: number; slug: string; name: string }>();

    return new Response(JSON.stringify(inserted), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: unknown) {
    if (String(err).includes("UNIQUE")) {
      return new Response(JSON.stringify({ error: "City with this name already exists in this country" }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    console.error("City insert error:", err);
    return new Response(JSON.stringify({ error: "Failed to create city" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
