-- +goose Up
-- Email verification. users.email_verified_at is NULL until the address is
-- proven; a timestamp rather than a boolean records when it happened and makes
-- NULL the natural "never verified". The emailed token is stored only as a
-- SHA-256 hash, so a database leak cannot be replayed against the API.
-- No down section, same reason as 0001_init.sql: sqlc parses this folder as its
-- schema source and a DROP block after the CREATEs would empty it.

ALTER TABLE users ADD COLUMN email_verified_at timestamptz;

CREATE TABLE email_verification_tokens (
    token_hash text PRIMARY KEY,
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL,
    used_at    timestamptz
);

CREATE INDEX email_verification_tokens_user_id_idx ON email_verification_tokens (user_id);
CREATE INDEX email_verification_tokens_expires_at_idx ON email_verification_tokens (expires_at);

-- Grandfather every account that predates verification: they were created under
-- the old contract, so locking them out of draft/publish would be a regression.
-- This MUST stay in the same file as the ALTER. goose wraps one file in a single
-- transaction, so no registration can slip in between the column appearing and
-- the backfill running; split into a later migration, it would instead mark
-- genuinely-unverified new accounts as verified.
UPDATE users SET email_verified_at = now() WHERE email_verified_at IS NULL;
