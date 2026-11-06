-- +goose Up
-- LUMORA Collaboration Requests & Inbox System
-- Supports bidirectional collaboration proposals (Mitra <-> UMKM)
-- and unlocks transactional conversation inbox once accepted.

CREATE TABLE IF NOT EXISTS collaboration_requests (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_user_id          uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    sender_role             text NOT NULL CHECK (sender_role IN ('umkm', 'mitra')),
    receiver_user_id        uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    receiver_role           text NOT NULL CHECK (receiver_role IN ('umkm', 'mitra')),
    business_id             uuid REFERENCES businesses (id) ON DELETE CASCADE,
    partner_profile_id      uuid REFERENCES partner_profiles (id) ON DELETE CASCADE,
    direction               text NOT NULL CHECK (direction IN ('partner_to_umkm', 'umkm_to_partner')),
    collaboration_type      text NOT NULL,
    title                   text NOT NULL,
    message                 text NOT NULL,
    proposal_detail         text NOT NULL DEFAULT '',
    status                  text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'withdrawn', 'expired')),
    responded_at            timestamptz,
    expires_at              timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

-- Unique index to prevent duplicate pending requests for the same partnership objective
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_collab_request 
    ON collaboration_requests (sender_user_id, receiver_user_id, COALESCE(business_id, '00000000-0000-0000-0000-000000000000'::uuid), collaboration_type) 
    WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS collab_requests_receiver_idx ON collaboration_requests (receiver_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS collab_requests_sender_idx ON collaboration_requests (sender_user_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS collab_requests_business_idx ON collaboration_requests (business_id);
CREATE INDEX IF NOT EXISTS collab_requests_partner_idx ON collaboration_requests (partner_profile_id);

-- Collaboration Status Audit Trail
CREATE TABLE IF NOT EXISTS collaboration_request_events (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id              uuid NOT NULL REFERENCES collaboration_requests (id) ON DELETE CASCADE,
    actor_user_id           uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    from_status             text NOT NULL,
    to_status               text NOT NULL,
    reason                  text NOT NULL DEFAULT '',
    created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS collab_events_request_idx ON collaboration_request_events (request_id, created_at ASC);

-- Inbox / Conversations System (Activated upon Accepted status)
CREATE TABLE IF NOT EXISTS conversations (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collaboration_request_id uuid NOT NULL UNIQUE REFERENCES collaboration_requests (id) ON DELETE CASCADE,
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS conversations_collab_idx ON conversations (collaboration_request_id);

CREATE TABLE IF NOT EXISTS conversation_participants (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id         uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    user_id                 uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    joined_at               timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT conversation_user_unique UNIQUE (conversation_id, user_id)
);

CREATE INDEX IF NOT EXISTS conv_participants_user_idx ON conversation_participants (user_id);
CREATE INDEX IF NOT EXISTS conv_participants_conv_idx ON conversation_participants (conversation_id);

CREATE TABLE IF NOT EXISTS messages (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id         uuid NOT NULL REFERENCES conversations (id) ON DELETE CASCADE,
    sender_id               uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    content                 text NOT NULL,
    read_at                 timestamptz,
    created_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS messages_conv_idx ON messages (conversation_id, created_at ASC);
CREATE INDEX IF NOT EXISTS messages_sender_idx ON messages (sender_id);

