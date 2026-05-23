export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../lib/admin-auth";

type PhotoRow = {
  id: string;
  r2_key_thumb: string;
  r2_key_medium: string;
  r2_key_full: string;
  r2_key_original: string;
};

type PhotoState = {
  id: string;
  country_id: number;
  city_id: number;
  is_public: number;
  caption: string | null;
};

export const PATCH: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = params.id ?? "";
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: { country_id?: unknown; city_id?: unknown; is_public?: unknown; caption?: unknown };
  try {
    body = await request.json() as typeof body;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const photo = await env.DB.prepare(
    `SELECT id, country_id, city_id, is_public, caption FROM photos WHERE id = ?`
  ).bind(id).first<PhotoState>();

  if (!photo) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  const newCountryId = typeof body.country_id === "number" ? body.country_id : photo.country_id;
  const newCityId    = typeof body.city_id    === "number" ? body.city_id    : photo.city_id;
  const newIsPublic  = typeof body.is_public  === "boolean"
    ? (body.is_public ? 1 : 0)
    : photo.is_public;
  const newCaption   = "caption" in body
    ? (body.caption == null ? null : String(body.caption).slice(0, 500))
    : photo.caption;

  // Validate country if changed.
  if (newCountryId !== photo.country_id) {
    const country = await env.DB.prepare(
      `SELECT id FROM countries WHERE id = ?`
    ).bind(newCountryId).first<{ id: number }>();
    if (!country) {
      return new Response(JSON.stringify({ error: "Country not found" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // Validate city if changed — must belong to newCountryId.
  if (newCityId !== photo.city_id) {
    const city = await env.DB.prepare(
      `SELECT id, country_id FROM cities WHERE id = ?`
    ).bind(newCityId).first<{ id: number; country_id: number }>();
    if (!city || city.country_id !== newCountryId) {
      return new Response(JSON.stringify({ error: "City not found or does not belong to the specified country" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  try {
    await env.DB.batch([
      // Update the photo row.
      env.DB.prepare(
        `UPDATE photos SET country_id = ?1, city_id = ?2, is_public = ?3, caption = ?4 WHERE id = ?5`
      ).bind(newCountryId, newCityId, newIsPublic, newCaption, id),

      // Clear old audience thumbnail on old country (no-op if this photo wasn't the thumbnail).
      photo.is_public === 1
        ? env.DB.prepare(
            `UPDATE countries SET public_thumbnail_photo_id = NULL WHERE id = ?1 AND public_thumbnail_photo_id = ?2`
          ).bind(photo.country_id, id)
        : env.DB.prepare(
            `UPDATE countries SET private_thumbnail_photo_id = NULL WHERE id = ?1 AND private_thumbnail_photo_id = ?2`
          ).bind(photo.country_id, id),

      // Auto-set thumbnail on new country for new audience (IS NULL guard).
      newIsPublic === 1
        ? env.DB.prepare(
            `UPDATE countries SET public_thumbnail_photo_id = ?1 WHERE id = ?2 AND public_thumbnail_photo_id IS NULL`
          ).bind(id, newCountryId)
        : env.DB.prepare(
            `UPDATE countries SET private_thumbnail_photo_id = ?1 WHERE id = ?2 AND private_thumbnail_photo_id IS NULL`
          ).bind(id, newCountryId),
    ]);
  } catch (err) {
    console.error("Photo PATCH D1 error:", err);
    return new Response(JSON.stringify({ error: "Failed to update photo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ id, country_id: newCountryId, city_id: newCityId, is_public: newIsPublic === 1, caption: newCaption }),
    { status: 200, headers: { "Content-Type": "application/json" } }
  );
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = params.id ?? "";
  if (!id) {
    return new Response(JSON.stringify({ error: "Missing id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const photo = await env.DB.prepare(
    `SELECT id, r2_key_thumb, r2_key_medium, r2_key_full, r2_key_original
     FROM photos WHERE id = ?`
  ).bind(id).first<PhotoRow>();

  if (!photo) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Clear thumbnail references and delete the photo row atomically.
  try {
    await env.DB.batch([
      env.DB.prepare(
        `UPDATE countries SET public_thumbnail_photo_id = NULL WHERE public_thumbnail_photo_id = ?`
      ).bind(id),
      env.DB.prepare(
        `UPDATE countries SET private_thumbnail_photo_id = NULL WHERE private_thumbnail_photo_id = ?`
      ).bind(id),
      env.DB.prepare(`DELETE FROM photos WHERE id = ?`).bind(id),
    ]);
  } catch (err) {
    console.error("Photo D1 delete error:", err);
    return new Response(JSON.stringify({ error: "Failed to delete photo" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Delete all R2 variants (swallowed on error — D1 row already gone).
  const r2Keys = [photo.r2_key_thumb, photo.r2_key_medium, photo.r2_key_full, photo.r2_key_original];
  try {
    await env.PHOTOS.delete(r2Keys);
  } catch (err) {
    console.error("R2 delete error (photo):", err);
  }

  return new Response(null, { status: 204 });
};
