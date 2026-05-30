// src/lib/diary-sync.ts
//
// Background sync engine for the offline-first diary (Phase D, Slice D4).
//
// Strategy: push-then-pull, reconciled by updated_at, last-write-wins. This is
// a SINGLE-AUTHOR diary, so there is no conflict UI — the server simply keeps
// whichever updated_at is newer and discards the older write.
//
//   PUSH — drain the outbox against the API (POST upsert / DELETE).
//   PULL — GET ?since={lastSync}, merge newer server rows into IndexedDB.
//
// Triggers: page load (if online), the window 'online' event, and a debounced
// call after each local write.
//
// THE OUTBOX IS SACRED. A failed sync NEVER drops a queued change. Sync calls
// pass through Cloudflare Access; an expired session returns an HTML redirect,
// not JSON. Any non-JSON / 401 / 3xx response is treated as "not authenticated
// right now": leave the outbox intact, abort quietly, retry next trigger.

import {
  getOutbox,
  getEntry,
  clearOutboxItem,
  mergeServerEntry,
  type DiaryEntry,
} from "./diary-local";

const LAST_SYNC_KEY = "footsteps-diary-last-sync";

export type SyncStatus = "synced" | "pending" | "syncing";

// ── Listeners ─────────────────────────────────────────────────────

type StatusListener = (status: SyncStatus) => void;
const statusListeners = new Set<StatusListener>();
const entryListeners = new Set<() => void>();

export function onSyncStatus(fn: StatusListener): void {
  statusListeners.add(fn);
}

export function onEntriesChanged(fn: () => void): void {
  entryListeners.add(fn);
}

function emitEntriesChanged(): void {
  for (const fn of entryListeners) fn();
}

// Derive status from the outbox unless an override (e.g. "syncing") is given.
export async function emitStatus(override?: SyncStatus): Promise<void> {
  let status: SyncStatus = override ?? "synced";
  if (!override) {
    const outbox = await getOutbox();
    status = outbox.length === 0 ? "synced" : "pending";
  }
  for (const fn of statusListeners) fn(status);
}

// Refresh the indicator from current outbox state (called after local writes).
export function refreshStatus(): Promise<void> {
  return emitStatus();
}

// ── Auth detection ────────────────────────────────────────────────

// A response is usable API JSON only if it both succeeded and declares JSON.
// Cloudflare Access redirects return HTML, so a non-JSON body means the Access
// session has lapsed — treat it as "not authenticated right now".
function isJsonResponse(res: Response): boolean {
  return (res.headers.get("Content-Type") ?? "").includes("application/json");
}

class NotAuthenticatedError extends Error {}

// ── Core sync (push then pull) ────────────────────────────────────

let syncing = false;
let rerunQueued = false;

export async function sync(): Promise<void> {
  if (typeof navigator !== "undefined" && !navigator.onLine) {
    await emitStatus(); // offline: just reflect current outbox state
    return;
  }
  if (syncing) {
    rerunQueued = true; // a trigger arrived mid-sync; run once more after
    return;
  }
  syncing = true;
  try {
    await emitStatus("syncing");
    await push();
    await pull();
    await emitStatus(); // "synced" if outbox drained, else "pending"
  } catch (err) {
    if (!(err instanceof NotAuthenticatedError)) {
      console.error("[diary-sync] unexpected sync error", err);
    }
    // Either way the outbox is intact; reflect current (likely "pending") state.
    await emitStatus();
  } finally {
    syncing = false;
    if (rerunQueued) {
      rerunQueued = false;
      void sync();
    }
  }
}

// Drain the outbox. Stop on the first failure and leave that item (and the
// rest) queued for the next trigger.
async function push(): Promise<void> {
  const outbox = await getOutbox();

  for (const item of outbox) {
    if (item.op === "delete") {
      const res = await fetch(`/api/admin/diary/${encodeURIComponent(item.id)}`, {
        method: "DELETE",
      });
      // 204 deleted, 404 already gone — both mean the tombstone is satisfied.
      if (res.status === 204 || res.status === 404) {
        await clearOutboxItem(item.id);
        continue;
      }
      if (!isJsonResponse(res)) throw new NotAuthenticatedError();
      return; // JSON error (e.g. 500): leave queued, stop draining.
    }

    // op === "upsert"
    const entry = await getEntry(item.id);
    if (!entry) {
      // The entry was deleted after this upsert was queued; the delete
      // tombstone (same key) supersedes it. Drop the stale upsert.
      await clearOutboxItem(item.id);
      continue;
    }
    const res = await fetch("/api/admin/diary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(entry),
    });
    if (res.ok && isJsonResponse(res)) {
      await clearOutboxItem(item.id);
      continue;
    }
    if (!isJsonResponse(res)) throw new NotAuthenticatedError();
    return; // JSON error: leave queued, stop draining.
  }
}

// Fetch server changes since the last clean sync and merge newer rows in.
async function pull(): Promise<void> {
  const lastSync = localStorage.getItem(LAST_SYNC_KEY);
  const url = lastSync
    ? `/api/admin/diary?since=${encodeURIComponent(lastSync)}`
    : "/api/admin/diary";

  const res = await fetch(url);
  if (!res.ok || !isJsonResponse(res)) throw new NotAuthenticatedError();

  const data = (await res.json()) as { entries?: DiaryEntry[] };
  let changed = false;
  for (const entry of data.entries ?? []) {
    if (await mergeServerEntry(entry)) changed = true;
  }

  // Watermark only advances after a clean push+pull.
  localStorage.setItem(LAST_SYNC_KEY, new Date().toISOString());
  if (changed) emitEntriesChanged();
}

// ── Triggers / wiring ─────────────────────────────────────────────

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

// Debounced sync after a local write (~1s) so a flurry of edits coalesces.
export function scheduleSync(delay = 1000): void {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void sync();
  }, delay);
}

// Wire load + 'online' triggers. Call once after the page hydrates.
export function initSync(): void {
  window.addEventListener("online", () => void sync());
  if (navigator.onLine) {
    void sync();
  } else {
    void emitStatus();
  }
}
