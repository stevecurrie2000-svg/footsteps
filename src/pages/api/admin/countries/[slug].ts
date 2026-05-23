export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../lib/admin-auth";
import { slugify } from "../../../../lib/nominatim";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export const POST: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const slug = params.slug ?? "";
  if (!slug) return json({ error: "Missing slug" }, 400);

  let body: { name?: string };
  try {
    body = await request.json() as { name?: string };
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const name = (body.name ?? "").trim().slice(0, 100);
  if (!name) return json({ error: "Missing name" }, 400);

  if (slugify(name) !== slug) return json({ error: "Slug mismatch" }, 400);

  try {
    const inserted = await env.DB.prepare(
      `INSERT INTO countries (slug, name) VALUES (?1, ?2) RETURNING id, slug, name`
    ).bind(slug, name).first<{ id: number; slug: string; name: string }>();

    return json(inserted, 201);
  } catch (err: unknown) {
    if (String(err).includes("UNIQUE")) {
      return json({ error: "Country with this name already exists" }, 409);
    }
    console.error("Country create error:", err);
    return json({ error: "Failed to create country" }, 500);
  }
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const slug = params.slug ?? "";
  const country = await env.DB.prepare(
    `SELECT id, slug, name FROM countries WHERE slug = ?`
  ).bind(slug).first<{ id: number; slug: string; name: string }>();
  if (!country) return json({ error: "Not found" }, 404);

  let body: Record<string, unknown>;
  try {
    body = await request.json() as Record<string, unknown>;
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  try {
    if (typeof body.name === "string") {
      const name = body.name.trim().slice(0, 100);
      if (!name) return json({ error: "Name cannot be empty" }, 400);
      const newSlug = slugify(name);
      if (!newSlug) return json({ error: "Name produces empty slug" }, 400);
      await env.DB.prepare(
        `UPDATE countries SET name = ?1, slug = ?2 WHERE id = ?3`
      ).bind(name, newSlug, country.id).run();
    }

    if ("public_thumbnail_photo_id" in body) {
      const val = body.public_thumbnail_photo_id;
      const thumbId = (val === null || val === "") ? null : String(val);
      await env.DB.prepare(
        `UPDATE countries SET public_thumbnail_photo_id = ?1 WHERE id = ?2`
      ).bind(thumbId, country.id).run();
    }

    if ("private_thumbnail_photo_id" in body) {
      const val = body.private_thumbnail_photo_id;
      const thumbId = (val === null || val === "") ? null : String(val);
      await env.DB.prepare(
        `UPDATE countries SET private_thumbnail_photo_id = ?1 WHERE id = ?2`
      ).bind(thumbId, country.id).run();
    }

    const updated = await env.DB.prepare(
      `SELECT id, slug, name FROM countries WHERE id = ?`
    ).bind(country.id).first();

    return json(updated);
  } catch (err: unknown) {
    if (String(err).includes("UNIQUE")) {
      return json({ error: "A country with this name already exists" }, 409);
    }
    console.error("Country update error:", err);
    return json({ error: "Failed to update country" }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const slug = params.slug ?? "";
  const country = await env.DB.prepare(
    `SELECT id FROM countries WHERE slug = ?`
  ).bind(slug).first<{ id: number }>();
  if (!country) return json({ error: "Not found" }, 404);

  type PhotoKeys = {
    r2_key_thumb: string;
    r2_key_medium: string;
    r2_key_full: string;
    r2_key_original: string;
  };
  const { results: photos } = await env.DB.prepare(
    `SELECT r2_key_thumb, r2_key_medium, r2_key_full, r2_key_original
     FROM photos WHERE country_id = ?`
  ).bind(country.id).all<PhotoKeys>();

  const r2Keys = photos.flatMap(p => [
    p.r2_key_thumb,
    p.r2_key_medium,
    p.r2_key_full,
    p.r2_key_original,
  ]);
  if (r2Keys.length > 0) {
    try {
      await env.PHOTOS.delete(r2Keys);
    } catch (err) {
      console.error("R2 delete error (country):", err);
    }
  }

  try {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM photos WHERE country_id = ?`).bind(country.id),
      env.DB.prepare(`DELETE FROM cities WHERE country_id = ?`).bind(country.id),
      env.DB.prepare(`DELETE FROM countries WHERE id = ?`).bind(country.id),
    ]);
  } catch (err) {
    console.error("Country D1 delete error:", err);
    return json({ error: "Failed to delete country" }, 500);
  }

  return new Response(null, { status: 204 });
};
