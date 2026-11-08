-- +goose Up
-- LUMORA Business Profile Analytics & Performance Tracking
-- Records visitor events (views, impressions, contact clicks) with visitor pseudonymization.

CREATE TABLE IF NOT EXISTS business_analytics_events (
    id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id   uuid NOT NULL REFERENCES businesses (id) ON DELETE CASCADE,
    event_type    text NOT NULL CHECK (event_type IN ('view', 'catalog_impression', 'contact_click')),
    source        text NOT NULL DEFAULT 'direct' CHECK (source IN ('direct', 'explore', 'search', 'matching')),
    visitor_hash  text NOT NULL,
    created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS analytics_events_biz_type_time_idx 
    ON business_analytics_events (business_id, event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_biz_time_idx 
    ON business_analytics_events (business_id, created_at DESC);

CREATE INDEX IF NOT EXISTS analytics_events_dedup_idx 
    ON business_analytics_events (business_id, event_type, visitor_hash, created_at DESC);

