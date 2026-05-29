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

export const GET: APIRoute = async ({ request, params }) => {
  const auth = await requireAdmin(request);
  if (auth instanceof Response) return auth;

  const id = params.id ?? "";

  try {
    const entry = await env.DB.prepare(
      `SELECT id, title, body, entry_date, entry_time, location_label,
              attach_type, attach_ref, created_at, updated_at
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
  const now = new Date().toISOString();

  try {
    const result = await env.DB.prepare(
      `UPDATE diary_entries
       SET title = ?, body = ?, entry_date = ?, entry_time = ?, location_label = ?, updated_at = ?
       WHERE id = ?`
    ).bind(title, entryBody, entryDate, entryTime, locationLabel, now, id).run();

    if (result.meta.changes === 0) {
      return new Response(JSON.stringify({ error: "Not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const updated = await env.DB.prepare(
      `SELECT id, title, body, entry_date, entry_time, location_label,
              attach_type, attach_ref, created_at, updated_at
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
