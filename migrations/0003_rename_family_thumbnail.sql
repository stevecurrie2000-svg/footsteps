PRAGMA foreign_keys = OFF;

CREATE TABLE countries_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  public_thumbnail_photo_id TEXT,
  private_thumbnail_photo_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (public_thumbnail_photo_id) REFERENCES photos(id),
  FOREIGN KEY (private_thumbnail_photo_id) REFERENCES photos(id)
);

INSERT INTO countries_new (id, slug, name, sort_order, public_thumbnail_photo_id, private_thumbnail_photo_id, created_at)
SELECT id, slug, name, sort_order, public_thumbnail_photo_id, family_thumbnail_photo_id, created_at
FROM countries;

DROP TABLE countries;
ALTER TABLE countries_new RENAME TO countries;

PRAGMA foreign_keys = ON;
