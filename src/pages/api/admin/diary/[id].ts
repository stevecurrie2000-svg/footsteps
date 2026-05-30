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
  attach_type: string | null;
  attach_ref: string | null;
  created_at: string;
  updated_at: string;
};

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = params.id ?? "";

  try {
    const entry = await env.DB.prepare(
      `SELECT id, title, body, entry_date, entry_time, location_label,
              latitude, longitude, attach_type, attach_ref, created_at, updated_at
       FROM diary_entries
       WHERE id = ?`
    ).bind(id).first<DiaryEntry>();

    if (!entry) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify(entry), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = params.id ?? "";

  let body: {
    title?: string;
    body?: string;
    entry_date?: string;
    entry_time?: string;
    location_label?: string;
    updated_at?: string;
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

  const title = (body.title ?? "").trim() || null;
  const entryBody = body.body.trim();
  const entryDate = body.entry_date.trim();
  const entryTime = (body.entry_time ?? "").trim() || null;
  const locationLabel = (body.location_label ?? "").trim() || null;
  // Last-write-wins: honour a client-supplied updated_at if present (so an
  // older write can be detected and no-op'd); otherwise stamp now.
  const incomingUpdatedAt = (body.updated_at ?? "").trim() || new Date().toISOString();

  try {
    const existing = await env.DB.prepare(
      `SELECT id FROM diary_entries WHERE id = ?`
    ).bind(id).first<{ id: string }>();

    if (!existing) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // The `? > updated_at` guard mirrors the POST upsert: an incoming write
    // older than the stored row changes nothing (silent no-op).
    await env.DB.prepare(
      `UPDATE diary_entries
       SET title = ?, body = ?, entry_date = ?, entry_time = ?, location_label = ?, updated_at = ?
       WHERE id = ? AND ? > updated_at`
    ).bind(title, entryBody, entryDate, entryTime, locationLabel, incomingUpdatedAt, id, incomingUpdatedAt).run();

    // Return the row as it now stands (the newer version, whichever won).
    const updated = await env.DB.prepare(
      `SELECT id, title, body, entry_date, entry_time, location_label,
              latitude, longitude, attach_type, attach_ref, created_at, updated_at
       FROM diary_entries WHERE id = ?`
    ).bind(id).first<DiaryEntry>();

    return new Response(JSON.stringify(updated), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = params.id ?? "";

  try {
    await env.DB.prepare("DELETE FROM diary_entries WHERE id = ?").bind(id).run();
    return new Response(null, { status: 204 });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
