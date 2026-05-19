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

export const PATCH: APIRoute = async ({ request, params }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = parseInt(params.id ?? "");
  if (isNaN(id)) return json({ error: "Invalid id" }, 400);

  let body: { name?: string };
  try {
    body = await request.json() as { name?: string };
  } catch {
    return json({ error: "Invalid JSON" }, 400);
  }

  const name = (body.name ?? "").trim().slice(0, 100);
  if (!name) return json({ error: "Missing name" }, 400);

  const newSlug = slugify(name);
  if (!newSlug) return json({ error: "Name produces empty slug" }, 400);

  const city = await env.DB.prepare(
    `SELECT id FROM cities WHERE id = ?`
  ).bind(id).first<{ id: number }>();
  if (!city) return json({ error: "Not found" }, 404);

  try {
    const updated = await env.DB.prepare(
      `UPDATE cities SET name = ?1, slug = ?2 WHERE id = ?3 RETURNING id, slug, name, country_id`
    ).bind(name, newSlug, id).first<{ id: number; slug: string; name: string; country_id: number }>();

    return json(updated);
  } catch (err: unknown) {
    if (String(err).includes("UNIQUE")) {
      return json({ error: "City with this name already exists in this country" }, 409);
    }
    console.error("City update error:", err);
    return json({ error: "Failed to update city" }, 500);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = parseInt(params.id ?? "");
  if (isNaN(id)) return json({ error: "Invalid id" }, 400);

  const city = await env.DB.prepare(
    `SELECT id FROM cities WHERE id = ?`
  ).bind(id).first<{ id: number }>();
  if (!city) return json({ error: "Not found" }, 404);

  type PhotoKeys = {
    r2_key_thumb: string;
    r2_key_medium: string;
    r2_key_full: string;
    r2_key_original: string;
  };
  const { results: photos } = await env.DB.prepare(
    `SELECT r2_key_thumb, r2_key_medium, r2_key_full, r2_key_original
     FROM photos WHERE city_id = ?`
  ).bind(id).all<PhotoKeys>();

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
      console.error("R2 delete error (city):", err);
    }
  }

  try {
    await env.DB.batch([
      env.DB.prepare(`DELETE FROM photos WHERE city_id = ?`).bind(id),
      env.DB.prepare(`DELETE FROM cities WHERE id = ?`).bind(id),
      // Clear any country thumbnails that pointed at deleted photos
      env.DB.prepare(
        `UPDATE countries SET public_thumbnail_photo_id = NULL
         WHERE public_thumbnail_photo_id IS NOT NULL
           AND public_thumbnail_photo_id NOT IN (SELECT id FROM photos)`
      ),
      env.DB.prepare(
        `UPDATE countries SET private_thumbnail_photo_id = NULL
         WHERE private_thumbnail_photo_id IS NOT NULL
           AND private_thumbnail_photo_id NOT IN (SELECT id FROM photos)`
      ),
    ]);
  } catch (err) {
    console.error("City D1 delete error:", err);
    return json({ error: "Failed to delete city" }, 500);
  }

  return new Response(null, { status: 204 });
};
