export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../lib/admin-auth";

export const POST: APIRoute = async ({ request }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const form = await request.formData();

  const country      = ((form.get("country")  as string | null) ?? "").trim();
  const city         = ((form.get("city")     as string | null) ?? "").trim();
  const isPublic     = form.get("is_public") === "1";
  const captionRaw   = ((form.get("caption")  as string | null) ?? "").trim();
  const caption      = captionRaw.length > 0 ? captionRaw : null;

  const thumb    = form.get("thumb")    as File | null;
  const medium   = form.get("medium")   as File | null;
  const full     = form.get("full")     as File | null;
  const original = form.get("original") as File | null;

  if (
    !thumb || thumb.size === 0 ||
    !medium || medium.size === 0 ||
    !full || full.size === 0 ||
    !original || original.size === 0
  ) {
    return new Response(JSON.stringify({ error: "Missing image variants" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!country || !city) {
    return new Response(JSON.stringify({ error: "Missing country or city" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (thumb.size + medium.size + full.size + original.size > 50 * 1024 * 1024) {
    return new Response(JSON.stringify({ error: "Payload too large" }), {
      status: 413,
      headers: { "Content-Type": "application/json" },
    });
  }

  const row = await env.DB.prepare(
    `SELECT co.id AS country_id, ci.id AS city_id
     FROM countries co
     JOIN cities ci ON ci.country_id = co.id
     WHERE co.slug = ?1 AND ci.slug = ?2`
  ).bind(country, city).first<{ country_id: number; city_id: number }>();

  if (!row) {
    return new Response(JSON.stringify({ error: "Unknown country/city combination" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const id          = crypto.randomUUID();
  const thumbKey    = `${id}-thumb.jpg`;
  const mediumKey   = `${id}-medium.jpg`;
  const fullKey     = `${id}-full.jpg`;
  const originalKey = `${id}-original.jpg`;

  try {
    await Promise.all([
      env.PHOTOS.put(thumbKey,    await thumb.arrayBuffer(),    { httpMetadata: { contentType: "image/jpeg" } }),
      env.PHOTOS.put(mediumKey,   await medium.arrayBuffer(),   { httpMetadata: { contentType: "image/jpeg" } }),
      env.PHOTOS.put(fullKey,     await full.arrayBuffer(),     { httpMetadata: { contentType: "image/jpeg" } }),
      env.PHOTOS.put(originalKey, await original.arrayBuffer(), { httpMetadata: { contentType: "image/jpeg" } }),
    ]);
  } catch (err) {
    console.error("R2 upload error:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    await env.DB.prepare(
      `INSERT INTO photos
         (id, city_id, country_id, is_public, caption,
          r2_key_thumb, r2_key_medium, r2_key_full, r2_key_original)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`
    ).bind(
      id,
      row.city_id,
      row.country_id,
      isPublic ? 1 : 0,
      caption,
      thumbKey,
      mediumKey,
      fullKey,
      originalKey,
    ).run();
  } catch (err) {
    console.error("D1 insert error:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ id, country, city, is_public: isPublic, caption }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
};
