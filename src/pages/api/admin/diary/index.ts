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
  attach_type: string | null;
  attach_ref: string | null;
  created_at: string;
  updated_at: string;
};

export const GET: APIRoute = async ({ request }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  try {
    const result = await env.DB.prepare(
      `SELECT id, title, body, entry_date, entry_time, location_label,
              attach_type, attach_ref, created_at, updated_at
       FROM diary_entries
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

  let body: {
    id?: string;
    title?: string;
    body?: string;
    entry_date?: string;
    entry_time?: string;
    location_label?: string;
  };
  try {
    body = await request.json() as typeof body;
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

  const id = (body.id ?? "").trim() || crypto.randomUUID();
  const title = (body.title ?? "").trim() || null;
  const entryBody = body.body.trim();
  const entryDate = body.entry_date.trim();
  const entryTime = (body.entry_time ?? "").trim() || null;
  const locationLabel = (body.location_label ?? "").trim() || null;
  const now = new Date().toISOString();

  try {
    await env.DB.prepare(
      `INSERT INTO diary_entries
         (id, title, body, entry_date, entry_time, location_label, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, title, entryBody, entryDate, entryTime, locationLabel, now, now).run();

    const entry: DiaryEntry = {
      id,
      title,
      body: entryBody,
      entry_date: entryDate,
      entry_time: entryTime,
      location_label: locationLabel,
      attach_type: null,
      attach_ref: null,
      created_at: now,
      updated_at: now,
    };

    return new Response(JSON.stringify(entry), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
