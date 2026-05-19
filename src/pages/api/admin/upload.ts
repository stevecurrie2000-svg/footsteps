export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../lib/admin-auth";
import { slugify } from "../../../lib/nominatim";

export const POST: APIRoute = async ({ request }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  const form = await request.formData();

  const country      = ((form.get("country")  as string | null) ?? "").trim();
  const city         = ((form.get("city")     as string | null) ?? "").trim();
  const isPublic     = form.get("is_public") === "1";

  const captureDateRaw     = ((form.get("capture_date")      as string | null) ?? "").trim();
  const latitudeRaw        = ((form.get("latitude")          as string | null) ?? "").trim();
  const longitudeRaw       = ((form.get("longitude")         as string | null) ?? "").trim();
  const originalFilenameRaw = ((form.get("original_filename") as string | null) ?? "").trim();

  let captureDate: string | null = null;
  if (captureDateRaw) {
    const d = new Date(captureDateRaw);
    if (isNaN(d.getTime())) {
      console.warn("Invalid capture_date:", captureDateRaw);
    } else {
      captureDate = captureDateRaw;
    }
  }

  let latitude: number | null = null;
  if (latitudeRaw) {
    const n = parseFloat(latitudeRaw);
    if (isFinite(n) && n >= -90 && n <= 90) latitude = n;
  }

  let longitude: number | null = null;
  if (longitudeRaw) {
    const n = parseFloat(longitudeRaw);
    if (isFinite(n) && n >= -180 && n <= 180) longitude = n;
  }

  const originalFilename = originalFilenameRaw.length > 0
    ? originalFilenameRaw.slice(0, 255)
    : null;

  const geocodedCountry = ((form.get("geocoded_country") as string | null) ?? "").trim().slice(0, 100);
  const geocodedCity    = ((form.get("geocoded_city")    as string | null) ?? "").trim().slice(0, 100);

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

  const isNewCountry = country.startsWith("__new__:");
  const isNewCity    = city.startsWith("__new__:");
  const countrySlug  = isNewCountry ? country.slice("__new__:".length) : country;
  const citySlug     = isNewCity    ? city.slice("__new__:".length)    : city;

  if (!countrySlug || !citySlug) {
    return new Response(JSON.stringify({ error: "Invalid country or city identifier" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (isNewCountry) {
    if (!geocodedCountry) {
      return new Response(JSON.stringify({ error: "New country requires geocoded_country" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (slugify(geocodedCountry) !== countrySlug) {
      return new Response(JSON.stringify({ error: "Country slug mismatch" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  if (isNewCity) {
    if (!geocodedCity) {
      return new Response(JSON.stringify({ error: "New city requires geocoded_city" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (slugify(geocodedCity) !== citySlug) {
      return new Response(JSON.stringify({ error: "City slug mismatch" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
  }

  // ── Resolve country_id ────────────────────────────────────────────────────
  let countryId: number;
  if (isNewCountry) {
    const inserted = await env.DB.prepare(
      `INSERT INTO countries (slug, name) VALUES (?1, ?2) ON CONFLICT(slug) DO NOTHING RETURNING id`
    ).bind(countrySlug, geocodedCountry).first<{ id: number }>();
    if (inserted) {
      countryId = inserted.id;
    } else {
      const existing = await env.DB.prepare(
        `SELECT id FROM countries WHERE slug = ?1`
      ).bind(countrySlug).first<{ id: number }>();
      if (!existing) {
        return new Response(JSON.stringify({ error: "Country lookup failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      countryId = existing.id;
    }
  } else {
    const existing = await env.DB.prepare(
      `SELECT id FROM countries WHERE slug = ?1`
    ).bind(countrySlug).first<{ id: number }>();
    if (!existing) {
      return new Response(JSON.stringify({ error: "Unknown country" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    countryId = existing.id;
  }

  // ── Resolve city_id ───────────────────────────────────────────────────────
  let cityId: number;
  if (isNewCity) {
    const inserted = await env.DB.prepare(
      `INSERT INTO cities (country_id, slug, name) VALUES (?1, ?2, ?3) ON CONFLICT(country_id, slug) DO NOTHING RETURNING id`
    ).bind(countryId, citySlug, geocodedCity).first<{ id: number }>();
    if (inserted) {
      cityId = inserted.id;
    } else {
      const existing = await env.DB.prepare(
        `SELECT id FROM cities WHERE country_id = ?1 AND slug = ?2`
      ).bind(countryId, citySlug).first<{ id: number }>();
      if (!existing) {
        return new Response(JSON.stringify({ error: "City lookup failed" }), {
          status: 500,
          headers: { "Content-Type": "application/json" },
        });
      }
      cityId = existing.id;
    }
  } else {
    const existing = await env.DB.prepare(
      `SELECT id FROM cities WHERE country_id = ?1 AND slug = ?2`
    ).bind(countryId, citySlug).first<{ id: number }>();
    if (!existing) {
      return new Response(JSON.stringify({ error: "Unknown city" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    cityId = existing.id;
  }

  // Note: if photo insert fails after country/city create,
  // orphan rows remain. Slice 5's admin country page will handle cleanup.
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
    const batchStmts = [
      env.DB.prepare(
        `INSERT INTO photos
           (id, city_id, country_id, is_public,
            capture_date, latitude, longitude, original_filename,
            r2_key_thumb, r2_key_medium, r2_key_full, r2_key_original)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)`
      ).bind(
        id,
        cityId,
        countryId,
        isPublic ? 1 : 0,
        captureDate,
        latitude,
        longitude,
        originalFilename,
        thumbKey,
        mediumKey,
        fullKey,
        originalKey,
      ),
      // New country: always set family thumbnail; public photos also set public thumbnail.
      // Existing country: only set public thumbnail when null and photo is public.
      ...(isNewCountry ? [
        env.DB.prepare(
          `UPDATE countries SET family_thumbnail_photo_id = ?1 WHERE id = ?2 AND family_thumbnail_photo_id IS NULL`
        ).bind(id, countryId),
      ] : []),
      ...(isPublic ? [
        env.DB.prepare(
          `UPDATE countries SET public_thumbnail_photo_id = ?1 WHERE id = ?2 AND public_thumbnail_photo_id IS NULL`
        ).bind(id, countryId),
      ] : []),
    ];
    await env.DB.batch(batchStmts);
  } catch (err) {
    console.error("D1 insert error:", err);
    return new Response(JSON.stringify({ error: "Upload failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({ id, country, city, is_public: isPublic }),
    {
      status: 201,
      headers: { "Content-Type": "application/json" },
    }
  );
};
