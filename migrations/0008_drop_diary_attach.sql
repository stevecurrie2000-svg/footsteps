-- Remove the attach_type / attach_ref columns and their index from diary_entries.
-- These were added in 0007 for the D6 attachment feature, which has been removed
-- by design decision. The diary is now a standalone private journal.
DROP INDEX IF EXISTS idx_diary_attach;
ALTER TABLE diary_entries DROP COLUMN attach_type;
ALTER TABLE diary_entries DROP COLUMN attach_ref;
