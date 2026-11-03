-- +goose Up
-- Manajemen Beranda: draft state, published revisions, dan riwayat pemulihan konten

CREATE TABLE IF NOT EXISTS homepage_content_revisions (
    id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    content         jsonb NOT NULL,
    published_at    timestamptz NOT NULL DEFAULT now(),
    published_by    uuid REFERENCES users (id) ON DELETE SET NULL,
    published_by_name text NOT NULL DEFAULT '',
    restored_from   uuid REFERENCES homepage_content_revisions (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS homepage_content_revisions_published_at_idx 
    ON homepage_content_revisions (published_at DESC);

CREATE TABLE IF NOT EXISTS homepage_content_state (
    key                     text PRIMARY KEY DEFAULT 'home' CHECK (key = 'home'),
    draft_content           jsonb NOT NULL,
    lock_version            bigint NOT NULL DEFAULT 1,
    draft_updated_at        timestamptz NOT NULL DEFAULT now(),
    draft_updated_by        uuid REFERENCES users (id) ON DELETE SET NULL,
    draft_updated_by_name   text NOT NULL DEFAULT '',
    published_revision_id   uuid REFERENCES homepage_content_revisions (id) ON DELETE SET NULL
);
