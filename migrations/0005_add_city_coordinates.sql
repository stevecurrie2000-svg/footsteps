-- Phase 7 Slice 2: city centroid coordinates for the homepage map.
-- Both columns nullable so existing rows survive and the
-- "NULL coords + admin backfill" pattern works.

ALTER TABLE cities ADD COLUMN latitude REAL;
ALTER TABLE cities ADD COLUMN longitude REAL;
