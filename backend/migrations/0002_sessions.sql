-- +goose Up
-- Server-side sessions: the browser only ever holds the opaque token in an
-- httpOnly cookie, so logout and future "log out everywhere" are a DELETE.
-- No down section, same reason as 0001_init.sql.

CREATE TABLE sessions (
    token      text PRIMARY KEY,
    user_id    uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    expires_at timestamptz NOT NULL
);

CREATE INDEX sessions_user_id_idx ON sessions (user_id);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
