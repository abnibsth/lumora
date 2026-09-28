-- +goose Up
-- Phase 4: bookmarks per akun, menggantikan localStorage di frontend.
-- Kedua FK pakai ON DELETE CASCADE: hapus akun -> bookmarks-nya ikut hilang,
-- hapus profil -> tidak ada bookmark yatim.
CREATE TABLE bookmarks (
    user_id     uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    business_id uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, business_id)
);

-- List view mengurutkan per user berdasarkan waktu simpan.
CREATE INDEX bookmarks_user_idx ON bookmarks (user_id, created_at DESC);
