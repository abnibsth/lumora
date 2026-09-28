-- +goose Up
-- LUMORA initial schema: accounts, business profiles, milestones, BMC blocks.
-- owner is stored as columns on businesses so the API shape matches the
-- frontend Business type 1:1; owner_user_id links it to an account later.
--
-- No down section on purpose: sqlc reads this same folder as its schema
-- source, and a DROP block living after the CREATEs would empty the in-memory
-- schema it parses. Rollback for this schema = drop the database.

CREATE TABLE users (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name          text NOT NULL,
    email         text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    role          text NOT NULL DEFAULT 'umkm' CHECK (role IN ('umkm', 'mitra')),
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE businesses (
    id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug              text NOT NULL UNIQUE,
    owner_user_id     uuid REFERENCES users (id) ON DELETE SET NULL,
    name              text NOT NULL,
    category          text NOT NULL CHECK (category IN ('F&B', 'Retail', 'Jasa', 'Kreatif', 'Fashion')),
    location          text NOT NULL,
    description       text NOT NULL,
    story             text NOT NULL,
    cover_image       text,
    cover_position    text,
    logo              text,
    founded_year      integer NOT NULL CHECK (founded_year >= 1900),
    revenue_label     text,
    growth_label      text,
    revenue_series    double precision[] NOT NULL DEFAULT '{}',
    seeking           text[] NOT NULL DEFAULT '{}',
    seeking_objective text,
    owner_name        text NOT NULL,
    owner_role        text NOT NULL,
    owner_bio         text NOT NULL,
    status            text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    verified          boolean NOT NULL DEFAULT false,
    created_at        timestamptz NOT NULL DEFAULT now(),
    updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX businesses_status_idx ON businesses (status);
CREATE INDEX businesses_category_idx ON businesses (category);
CREATE INDEX businesses_location_idx ON businesses (location);

CREATE TABLE business_milestones (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    year        integer NOT NULL,
    title       text NOT NULL,
    description text,
    position    integer NOT NULL DEFAULT 0
);

CREATE INDEX business_milestones_business_idx ON business_milestones (business_id, position);

CREATE TABLE bmc_entries (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    label       text NOT NULL,
    value       text NOT NULL,
    position    integer NOT NULL DEFAULT 0
);

CREATE INDEX bmc_entries_business_idx ON bmc_entries (business_id, position);
