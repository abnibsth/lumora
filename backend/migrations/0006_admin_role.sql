-- +goose Up
-- No down section on purpose: sqlc reads this same folder as its schema
-- source, and a DROP block living after the CREATEs would empty the in-memory
-- schema it parses. Rollback for this schema = drop the database.

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
    CHECK (role IN ('umkm', 'mitra', 'admin'));
