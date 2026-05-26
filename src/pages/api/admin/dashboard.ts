export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../lib/admin-auth";
import { listAllowlistEmails } from "../../../lib/cf-access";

const CACHE_KEY = "admin:dashboard";
const CACHE_TTL = 300;

type DashboardData = {
  photoCount: number;
  countryCount: number;
  lastUploadIso: string | null;
  allowlistCount: number | null;
  r2BytesUsed: number;
};

async function computeStats(): Promise<DashboardData> {
  const [photoRow, countryRow, lastUploadRow] = await env.DB.batch([
    env.DB.prepare("SELECT COUNT(*) AS n FROM photos"),
    env.DB.prepare("SELECT COUNT(*) AS n FROM countries"),
    env.DB.prepare("SELECT MAX(created_at) AS ts FROM photos"),
  ]);

  const photoCount = (photoRow.results[0] as any)?.n ?? 0;
  const countryCount = (countryRow.results[0] as any)?.n ?? 0;
  const lastUploadIso: string | null = (lastUploadRow.results[0] as any)?.ts ?? null;

  let allowlistCount: number | null = null;
  const token = env.CF_ACCESS_API_TOKEN;
  if (token) {
    try {
      const emails = await listAllowlistEmails(token);
      allowlistCount = emails.length;
    } catch {
      // non-fatal — dashboard still renders
    }
  }

  let r2BytesUsed = 0;
  let cursor: string | undefined;
  do {
    const listed = await env.PHOTOS.list(cursor ? { cursor } : {});
    for (const obj of listed.objects) {
      r2BytesUsed += obj.size;
    }
    cursor = listed.truncated ? listed.cursor : undefined;
  } while (cursor);

  return { photoCount, countryCount, lastUploadIso, allowlistCount, r2BytesUsed };
}

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const cached = await env.SESSION.get(CACHE_KEY);
  if (cached) {
    return new Response(cached, {
      headers: { "Content-Type": "application/json", "X-Cache": "HIT" },
    });
  }

  try {
    const data = await computeStats();
    const json = JSON.stringify(data);
    await env.SESSION.put(CACHE_KEY, json, { expirationTtl: CACHE_TTL });
    return new Response(json, {
      headers: { "Content-Type": "application/json", "X-Cache": "MISS" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
