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

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = requireAdmin(request);
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
