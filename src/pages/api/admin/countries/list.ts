export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../lib/admin-auth";

type CountryRow = {
  id: number;
  slug: string;
  name: string;
  sort_order: number;
  public_thumbnail_photo_id: string | null;
  public_thumbnail_key: string | null;
  private_thumbnail_photo_id: string | null;
  private_thumbnail_key: string | null;
  photo_count: number;
  public_photo_count: number;
};

type CityRow = {
  id: number;
  country_id: number;
  slug: string;
  name: string;
  photo_count: number;
};

export const GET: APIRoute = async ({ request }) => {
  const auth = requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const [countriesResult, citiesResult] = await env.DB.batch([
      env.DB.prepare(`
        SELECT
          co.id, co.slug, co.name, co.sort_order,
          co.public_thumbnail_photo_id,
          pt.r2_key_thumb AS public_thumbnail_key,
          co.private_thumbnail_photo_id,
          ft.r2_key_thumb AS private_thumbnail_key,
          COUNT(DISTINCT p.id) AS photo_count,
          COALESCE(SUM(CASE WHEN p.is_public = 1 THEN 1 ELSE 0 END), 0) AS public_photo_count
        FROM countries co
        LEFT JOIN photos pt ON pt.id = co.public_thumbnail_photo_id
        LEFT JOIN photos ft ON ft.id = co.private_thumbnail_photo_id
        LEFT JOIN photos p ON p.country_id = co.id
        GROUP BY co.id
        ORDER BY co.name ASC
      `),
      env.DB.prepare(`
        SELECT ci.id, ci.country_id, ci.slug, ci.name,
          COUNT(p.id) AS photo_count
        FROM cities ci
        LEFT JOIN photos p ON p.city_id = ci.id
        GROUP BY ci.id
        ORDER BY ci.name ASC
      `),
    ]);

    const countries = countriesResult.results as CountryRow[];
    const cities = citiesResult.results as CityRow[];

    const citiesByCountry = new Map<number, CityRow[]>();
    for (const city of cities) {
      const list = citiesByCountry.get(city.country_id) ?? [];
      list.push(city);
      citiesByCountry.set(city.country_id, list);
    }

    const result = countries.map(c => ({
      ...c,
      cities: citiesByCountry.get(c.id) ?? [],
    }));

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("countries/list error:", err);
    return new Response(JSON.stringify({ error: "Failed to load countries" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
