-- Migration 0006: per-email notes for access users
-- The email list is authoritative in Cloudflare; this table only
-- holds metadata (notes) that Cloudflare doesn't store.

CREATE TABLE access_user_notes (
  email TEXT PRIMARY KEY,
  note TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
