-- +goose Up
-- LUMORA Partner Profiles: Dedicated workspace profile and partnership preferences
-- for accounts with role 'mitra'. One profile per user (1:1), cascading on account deletion.
--
-- No down section on purpose: sqlc reads this folder as its schema source.
-- Rollback for this schema = drop the database.

CREATE TABLE partner_profiles (
    id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id               uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    company_name          text NOT NULL DEFAULT '',
    partner_type          text NOT NULL DEFAULT 'Strategic Business Partner',
    location              text NOT NULL DEFAULT '',
    operational_coverage  text NOT NULL DEFAULT '',
    interested_categories text[] NOT NULL DEFAULT '{}',
    partnership_types     text[] NOT NULL DEFAULT '{}',
    collaboration_types   text[] NOT NULL DEFAULT '{}',
    description           text NOT NULL DEFAULT '',
    partnership_needs     text NOT NULL DEFAULT '',
    search_region         text NOT NULL DEFAULT '',
    business_criteria     text NOT NULL DEFAULT '',
    contact_email         text NOT NULL DEFAULT '',
    contact_phone         text NOT NULL DEFAULT '',
    contact_social        text NOT NULL DEFAULT '',
    share_contact         boolean NOT NULL DEFAULT false,
    created_at            timestamptz NOT NULL DEFAULT now(),
    updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX partner_profiles_user_idx ON partner_profiles (user_id);

