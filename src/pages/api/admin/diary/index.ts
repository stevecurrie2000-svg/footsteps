export const prerender = false;

import type { APIRoute } from "astro";
import { env } from "cloudflare:workers";
import { requireAdmin } from "../../../../lib/admin-auth";

type DiaryEntry = {
  id: string;
  title: string | null;
  body: string;
  entry_date: string;
  entry_time: string | null;
  location_label: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

const COLUMNS =
  `id, title, body, entry_date, entry_time, location_label,
   latitude, longitude, created_at, updated_at`;

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  // ?since={iso} powers the offline sync PULL: return only rows changed after
  // the watermark, oldest-first. Absent ?since= keeps the full list behaviour
  // the reading UI expects (newest-first).
  const since = new URL(request.url).searchParams.get("since");

  try {
    const result = since
      ? await env.DB.prepare(
          `SELECT ${COLUMNS} FROM diary_entries
           WHERE updated_at > ? ORDER BY updated_at ASC`
        ).bind(since).all<DiaryEntry>()
      : await env.DB.prepare(
          `SELECT ${COLUMNS} FROM diary_entries
           ORDER BY entry_date DESC, created_at DESC`
        ).all<DiaryEntry>();

    return new Response(JSON.stringify({ entries: result.results ?? [] }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  // POST is an UPSERT keyed on id (the offline sync PUSH path). It accepts a
  // full entry — including client-minted id and timestamps — and reconciles by
  // last-write-wins: an incoming write whose updated_at is older than the
  // stored row is a silent no-op (see the guard in the ON CONFLICT clause).
  let body: Partial<DiaryEntry>;
  try {
    body = await request.json() as Partial<DiaryEntry>;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.body || !body.body.trim()) {
    return new Response(JSON.stringify({ error: "body is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!body.entry_date || !body.entry_date.trim()) {
    return new Response(JSON.stringify({ error: "entry_date is required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const now = new Date().toISOString();
  const id = (body.id ?? "").trim() || crypto.randomUUID();
  const title = (body.title ?? "").trim() || null;
  const entryBody = body.body.trim();
  const entryDate = body.entry_date.trim();
  const entryTime = (body.entry_time ?? "").trim() || null;
  const locationLabel = (body.location_label ?? "").trim() || null;
  const latitude = typeof body.latitude === "number" ? body.latitude : null;
  const longitude = typeof body.longitude === "number" ? body.longitude : null;
  // created_at is preserved on conflict (it is NOT in the DO UPDATE SET); only
  // used here for a first insert. updated_at drives last-write-wins.
  const createdAt = (body.created_at ?? "").trim() || now;
  const updatedAt = (body.updated_at ?? "").trim() || now;

  try {
    await env.DB.prepare(
      `INSERT INTO diary_entries
         (id, title, body, entry_date, entry_time, location_label,
          latitude, longitude, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         title=excluded.title, body=excluded.body, entry_date=excluded.entry_date,
         entry_time=excluded.entry_time, location_label=excluded.location_label,
         latitude=excluded.latitude, longitude=excluded.longitude,
         updated_at=excluded.updated_at
       WHERE excluded.updated_at > diary_entries.updated_at`
    ).bind(
      id, title, entryBody, entryDate, entryTime, locationLabel,
      latitude, longitude, createdAt, updatedAt
    ).run();

    // Return the row as it now stands on the server. If the guard no-op'd an
    // older write, this is the newer stored version (correct for the client).
    const stored = await env.DB.prepare(
      `SELECT ${COLUMNS} FROM diary_entries WHERE id = ?`
    ).bind(id).first<DiaryEntry>();

    return new Response(JSON.stringify(stored), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
