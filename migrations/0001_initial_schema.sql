-- Footsteps photo portfolio — initial schema
-- All dates stored as ISO8601 TEXT (SQLite convention)

-- ============================================================
-- countries
-- ============================================================
CREATE TABLE countries (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  slug               TEXT    NOT NULL UNIQUE,           -- e.g. "france", "united-kingdom"
  name               TEXT    NOT NULL,                  -- e.g. "France", "United Kingdom"
  thumbnail_photo_id TEXT,                              -- FK to photos.id, set later
  sort_order         INTEGER NOT NULL DEFAULT 0,
  created_at         TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- cities
-- ============================================================
CREATE TABLE cities (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  country_id INTEGER NOT NULL REFERENCES countries(id) ON DELETE CASCADE,
  slug       TEXT    NOT NULL,                          -- e.g. "paris", "nice"
  name       TEXT    NOT NULL,                          -- e.g. "Paris", "Nice"
  created_at TEXT    NOT NULL DEFAULT (datetime('now')),
  UNIQUE (country_id, slug)
);

-- ============================================================
-- photos
-- ============================================================
CREATE TABLE photos (
  id                TEXT    PRIMARY KEY,                -- UUID, generated at insert time
  city_id           INTEGER NOT NULL REFERENCES cities(id)    ON DELETE CASCADE,
  country_id        INTEGER NOT NULL REFERENCES countries(id),-- denormalised for faster queries
  capture_date      TEXT,                               -- ISO8601 from EXIF (Phase 4)
  caption           TEXT,
  is_public         INTEGER NOT NULL DEFAULT 0,         -- 0=private, 1=public (fail-safe default)
  latitude          REAL,                               -- from EXIF
  longitude         REAL,                               -- from EXIF
  original_filename TEXT,                               -- e.g. "IMG_4521.JPG"
  r2_key_thumb      TEXT    NOT NULL,
  r2_key_medium     TEXT    NOT NULL,
  r2_key_full       TEXT    NOT NULL,
  r2_key_original   TEXT    NOT NULL,
  created_at        TEXT    NOT NULL DEFAULT (datetime('now'))
);

-- ============================================================
-- Indexes for frequent query filters
-- ============================================================
CREATE INDEX idx_photos_country_id ON photos (country_id);
CREATE INDEX idx_photos_city_id    ON photos (city_id);
CREATE INDEX idx_photos_is_public  ON photos (is_public);
