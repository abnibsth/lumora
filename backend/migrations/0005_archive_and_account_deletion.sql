-- +goose Up
-- Profile archiving and account deletion.
--
-- 'archived' joins the status enum so DELETE /businesses/:id can hide a profile
-- without destroying it. Every public read already filters status = 'published',
-- so an archived row drops out of the list, the detail page, and bookmarks with
-- no query change.
--
-- The owner FK flips from SET NULL to CASCADE: deleting an account must not
-- leave behind profiles nobody can manage. The old behaviour turned them into
-- permanent orphans, exactly like the seeded demo rows. Cascading here also
-- reaches business_milestones, bmc_entries, and bookmarks through their own
-- ON DELETE CASCADE, so one DELETE FROM users removes the whole footprint.
--
-- No down section, same reason as 0001_init.sql: sqlc parses this folder as its
-- schema source and a DROP block after the CREATEs would empty it.

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_status_check;
ALTER TABLE businesses ADD CONSTRAINT businesses_status_check
    CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE businesses DROP CONSTRAINT IF EXISTS businesses_owner_user_id_fkey;
ALTER TABLE businesses ADD CONSTRAINT businesses_owner_user_id_fkey
    FOREIGN KEY (owner_user_id) REFERENCES users (id) ON DELETE CASCADE;
