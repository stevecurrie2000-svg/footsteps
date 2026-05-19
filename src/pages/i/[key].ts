import { env } from "cloudflare:workers";
import type { APIRoute } from "astro";

export const GET: APIRoute = async ({ params, request }) => {
  const key = params.key;
  if (!key) return new Response("Not Found", { status: 404 });

  const row = await env.DB
    .prepare(
      `SELECT is_public FROM photos
       WHERE r2_key_thumb = ?1 OR r2_key_medium = ?1
          OR r2_key_full  = ?1 OR r2_key_original = ?1
       LIMIT 1`
    )
    .bind(key)
    .first<{ is_public: number }>();

  if (!row) return new Response("Not Found", { status: 404 });

  if (row.is_public === 0) {
    const jwt = request.headers.get("Cf-Access-Jwt-Assertion");
    if (!jwt) return new Response("Not Found", { status: 404 });
  }

  const obj = await env.PHOTOS.get(key);
  if (!obj) return new Response("Not Found", { status: 404 });

  return new Response(obj.body, {
    headers: {
      "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg",
      "Cache-Control": "public, max-age=31536000, immutable",
      "ETag": obj.etag,
    },
  });
};
