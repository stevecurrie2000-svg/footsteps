-- Phase 4 Slice 5: split countries.thumbnail_photo_id into two columns.
-- public_thumbnail_photo_id — shown on the public homepage country grid (public photos only).
-- family_thumbnail_photo_id — shown on /admin/countries and future family section (all photos).

ALTER TABLE countries RENAME COLUMN thumbnail_photo_id TO public_thumbnail_photo_id;
ALTER TABLE countries ADD COLUMN family_thumbnail_photo_id TEXT;
