CREATE TABLE diary_entries (
  id              TEXT PRIMARY KEY,        -- client-generated UUID (needed for offline later)
  title           TEXT,                    -- optional short heading
  body            TEXT NOT NULL,           -- the diary prose
  entry_date      TEXT NOT NULL,           -- ISO date the entry is about (manual)
  entry_time      TEXT,                    -- manual time-of-day string, free text
  location_label  TEXT,                    -- manual place name, e.g. "Glencoe, Scotland"
  latitude        REAL,                    -- reserved (future auto-GPS), unused now
  longitude       REAL,                    -- reserved (future auto-GPS), unused now
  attach_type     TEXT,                    -- reserved (NULL|'country'|'city'|'photo'), unused now
  attach_ref      TEXT,                    -- reserved, unused now
  created_at      TEXT NOT NULL,           -- ISO timestamp, server-set on first insert
  updated_at      TEXT NOT NULL            -- ISO timestamp, refreshed on every update
);
CREATE INDEX idx_diary_entry_date ON diary_entries (entry_date);
CREATE INDEX idx_diary_attach ON diary_entries (attach_type, attach_ref);
