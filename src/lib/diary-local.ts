// src/lib/diary-local.ts
//
// Offline-first local layer for the diary (Phase D, Slice D4).
//
// All UI reads and writes go through here. Entries live in IndexedDB on the
// device — so reading and writing never need the network — and every change is
// queued in an "outbox" to be replayed against D1 when a connection returns.
// The sync engine (diary-sync.ts) reconciles IndexedDB with the server
// separately; the UI never calls the API directly.
//
// Conventions (locked for later diary slices):
//   - IndexedDB db "footsteps-diary", stores "entries" + "outbox".
//   - Outbox items are keyed by entry id, so an upsert + delete on the same id
//     collapse to a single pending change (the latest write).
//   - Deletes propagate via tombstones: { op:'delete' } left in the outbox
//     until the server DELETE confirms.

import { openDB, type DBSchema, type IDBPDatabase } from "idb";

export type DiaryEntry = {
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

export type OutboxItem = {
  id: string; // entry id — also the store key
  op: "upsert" | "delete";
  updated_at: string; // ISO timestamp the local change was made
};

interface DiaryDB extends DBSchema {
  entries: { key: string; value: DiaryEntry };
  outbox: { key: string; value: OutboxItem };
}

const DB_NAME = "footsteps-diary";
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<DiaryDB>> | null = null;

function getDB(): Promise<IDBPDatabase<DiaryDB>> {
  if (!dbPromise) {
    dbPromise = openDB<DiaryDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("entries")) {
          db.createObjectStore("entries", { keyPath: "id" });
        }
        if (!db.objectStoreNames.contains("outbox")) {
          db.createObjectStore("outbox", { keyPath: "id" });
        }
      },
    });
  }
  return dbPromise;
}

// ── Reads (the UI's source of truth) ──────────────────────────────

// Newest-first by entry_date, tie-broken by created_at — mirrors the server's
// ORDER BY entry_date DESC, created_at DESC.
export async function getAllEntries(): Promise<DiaryEntry[]> {
  const db = await getDB();
  const all = await db.getAll("entries");
  return all.sort((a, b) => {
    if (a.entry_date !== b.entry_date) return a.entry_date < b.entry_date ? 1 : -1;
    if (a.created_at !== b.created_at) return a.created_at < b.created_at ? 1 : -1;
    return 0;
  });
}

export async function getEntry(id: string): Promise<DiaryEntry | undefined> {
  const db = await getDB();
  return db.get("entries", id);
}

// ── Writes (entries + outbox, atomically) ─────────────────────────

export type DiaryInput = {
  id?: string | null;
  title?: string | null;
  body: string;
  entry_date: string;
  entry_time?: string | null;
  location_label?: string | null;
  attach_type?: string | null;
  attach_ref?: string | null;
};

// Persist a new or edited entry. A missing/blank id means a brand-new entry:
// mint a UUID and set created_at. updated_at is always refreshed to now. The
// write and its outbox upsert item land in one transaction.
export async function saveEntry(input: DiaryInput): Promise<DiaryEntry> {
  const db = await getDB();
  const now = new Date().toISOString();
  const existingId = (input.id ?? "").trim();

  let entry: DiaryEntry;
  if (existingId) {
    const prev = await db.get("entries", existingId);
    entry = {
      id: existingId,
      title: input.title ?? null,
      body: input.body,
      entry_date: input.entry_date,
      entry_time: input.entry_time ?? null,
      location_label: input.location_label ?? null,
      latitude: prev?.latitude ?? null,
      longitude: prev?.longitude ?? null,
      // If caller provides attach_type/attach_ref (even as null), honour it;
      // if undefined (caller didn't touch it), preserve the previous value.
      attach_type: input.attach_type !== undefined ? (input.attach_type ?? null) : (prev?.attach_type ?? null),
      attach_ref:  input.attach_ref  !== undefined ? (input.attach_ref  ?? null) : (prev?.attach_ref  ?? null),
      created_at: prev?.created_at ?? now,
      updated_at: now,
    };
  } else {
    entry = {
      id: crypto.randomUUID(),
      title: input.title ?? null,
      body: input.body,
      entry_date: input.entry_date,
      entry_time: input.entry_time ?? null,
      location_label: input.location_label ?? null,
      latitude: null,
      longitude: null,
      attach_type: input.attach_type ?? null,
      attach_ref:  input.attach_ref  ?? null,
      created_at: now,
      updated_at: now,
    };
  }

  const tx = db.transaction(["entries", "outbox"], "readwrite");
  await tx.objectStore("entries").put(entry);
  await tx.objectStore("outbox").put({ id: entry.id, op: "upsert", updated_at: now });
  await tx.done;

  return entry;
}

// Remove an entry locally and leave a delete tombstone in the outbox so the
// deletion still propagates to the server on the next sync.
export async function deleteEntry(id: string): Promise<void> {
  const db = await getDB();
  const now = new Date().toISOString();
  const tx = db.transaction(["entries", "outbox"], "readwrite");
  await tx.objectStore("entries").delete(id);
  await tx.objectStore("outbox").put({ id, op: "delete", updated_at: now });
  await tx.done;
}

// ── Outbox / merge helpers (used by diary-sync.ts) ────────────────

export async function getOutbox(): Promise<OutboxItem[]> {
  const db = await getDB();
  return db.getAll("outbox");
}

export async function clearOutboxItem(id: string): Promise<void> {
  const db = await getDB();
  await db.delete("outbox", id);
}

// Merge a server row into IndexedDB keeping whichever updated_at is newer.
// Returns true if local state actually changed (so the UI can re-render).
export async function mergeServerEntry(server: DiaryEntry): Promise<boolean> {
  const db = await getDB();
  const local = await db.get("entries", server.id);
  if (!local || server.updated_at > local.updated_at) {
    await db.put("entries", server);
    return true;
  }
  return false;
}
