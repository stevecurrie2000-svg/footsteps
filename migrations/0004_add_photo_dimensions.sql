-- Phase 6 Slice 3: add source image dimensions to photos
-- Used to set <img width> and <img height> attributes for
-- layout-shift-free lazy loading. Source dimensions (i.e. the
-- pre-resize camera/phone capture), not the resized variant
-- dimensions — the aspect ratio is invariant and that's what
-- the browser uses.

ALTER TABLE photos ADD COLUMN width INTEGER;
ALTER TABLE photos ADD COLUMN height INTEGER;
