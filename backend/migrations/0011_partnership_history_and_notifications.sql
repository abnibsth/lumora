-- +goose Up
-- LUMORA Partnership History & Notifications System
-- 1. Expands collaboration_requests status lifecycle to include in_progress, completed, cancelled.
-- 2. Creates notifications table with recipient index for unread badge counts and activity feed.

ALTER TABLE collaboration_requests DROP CONSTRAINT IF EXISTS collaboration_requests_status_check;
ALTER TABLE collaboration_requests ADD CONSTRAINT collaboration_requests_status_check 
    CHECK (status IN ('pending', 'accepted', 'in_progress', 'completed', 'rejected', 'withdrawn', 'cancelled', 'expired'));

CREATE TABLE IF NOT EXISTS notifications (
    id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_user_id   uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    actor_user_id       uuid REFERENCES users (id) ON DELETE SET NULL,
    type                text NOT NULL,
    title               text NOT NULL,
    body                text NOT NULL,
    target_type         text NOT NULL DEFAULT 'system',
    target_id           text NOT NULL DEFAULT '',
    read_at             timestamptz,
    created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS notifications_recipient_idx ON notifications (recipient_user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_type_idx ON notifications (type);

