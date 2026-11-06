-- +goose Up
-- LUMORA Partner Preferences & Master Taxonomy Migration
-- 1. Adds logo and offered_collaborations (what the partner offers to UMKM) to partner_profiles.
-- 2. Creates partner_preferences table with composite foreign key (partner_profile_id, user_id).
-- 3. Backfills existing partner profile search preferences into partner_preferences.
-- 4. Normalizes legacy partnership & seeking labels into standardized Master Taxonomy identifiers.
-- 5. Installs zero-drift transition trigger.

-- 1. Alter partner_profiles: add logo, offered_collaborations, and composite unique constraint
ALTER TABLE partner_profiles 
    ADD COLUMN IF NOT EXISTS logo text NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS offered_collaborations text[] NOT NULL DEFAULT '{}';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'partner_profiles_id_user_id_uk'
    ) THEN
        ALTER TABLE partner_profiles ADD CONSTRAINT partner_profiles_id_user_id_uk UNIQUE (id, user_id);
    END IF;
END $$;

-- 2. Create partner_preferences table with strictly guaranteed 1:1 relationship
CREATE TABLE IF NOT EXISTS partner_preferences (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id                 uuid NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    partner_profile_id      uuid NOT NULL UNIQUE,
    target_categories       text[] NOT NULL DEFAULT '{}',
    search_region           text NOT NULL DEFAULT '',
    strict_region_match     boolean NOT NULL DEFAULT false,
    seeking_collaborations  text[] NOT NULL DEFAULT '{}',
    specific_needs          text NOT NULL DEFAULT '',
    qualification_criteria  text NOT NULL DEFAULT '',
    created_at              timestamptz NOT NULL DEFAULT now(),
    updated_at              timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT partner_preferences_profile_user_fk 
        FOREIGN KEY (partner_profile_id, user_id) 
        REFERENCES partner_profiles (id, user_id) 
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS partner_preferences_user_idx ON partner_preferences (user_id);
CREATE INDEX IF NOT EXISTS partner_preferences_profile_idx ON partner_preferences (partner_profile_id);

-- 3. Helper function to map legacy Indonesian strings to Master Taxonomy identifiers
CREATE OR REPLACE FUNCTION map_legacy_taxonomy_item(val text)
RETURNS text AS $$
BEGIN
    RETURN CASE trim(val)
        WHEN 'Distribusi Produk' THEN 'PRODUCT_DISTRIBUTION'
        WHEN 'Mitra Distribusi' THEN 'PRODUCT_DISTRIBUTION'
        WHEN 'Konsinyasi / Titip Jual' THEN 'RETAIL_CONSIGNMENT'
        WHEN 'Mitra Retail' THEN 'RETAIL_CONSIGNMENT'
        WHEN 'Reseller & Agen' THEN 'RESELLER_NETWORK'
        WHEN 'Reseller / Agen Penjualan' THEN 'RESELLER_NETWORK'
        WHEN 'Pemasok Bahan Baku' THEN 'RAW_MATERIAL_SUPPLY'
        WHEN 'Pasokan Bahan' THEN 'RAW_MATERIAL_SUPPLY'
        WHEN 'B2B Supply' THEN 'EQUIPMENT_TOOL_SUPPLY'
        WHEN 'Mitra Peralatan' THEN 'EQUIPMENT_TOOL_SUPPLY'
        WHEN 'Kemitraan Lisensi' THEN 'LICENSING_FRANCHISE'
        WHEN 'Kemitraan Lisensi & Waralaba' THEN 'LICENSING_FRANCHISE'
        WHEN 'Pendanaan & Modal Usaha' THEN 'FUNDING_INTRODUCTION'
        WHEN 'Pendanaan & Investasi' THEN 'FUNDING_INTRODUCTION'
        WHEN 'Mitra Modal' THEN 'FUNDING_INTRODUCTION'
        WHEN 'Mentoring Operasional' THEN 'OPERATIONAL_MENTORING'
        WHEN 'Mentoring & Pelatihan' THEN 'OPERATIONAL_MENTORING'
        WHEN 'Mitra Operasional' THEN 'OPERATIONAL_MENTORING'
        WHEN 'Kolaborasi Pemasaran' THEN 'MARKETING_CO_BRANDING'
        WHEN 'Co-branding / Kolaborasi Pemasaran' THEN 'MARKETING_CO_BRANDING'
        WHEN 'Mitra Proyek' THEN 'MARKETING_CO_BRANDING'
        WHEN 'Pengembangan Produk Bersama' THEN 'PRODUCTION_PARTNERSHIP'
        WHEN 'Mitra Produksi' THEN 'PRODUCTION_PARTNERSHIP'
        WHEN 'Mitra Ekspansi' THEN 'BUSINESS_EXPANSION'
        WHEN 'Mitra Teknologi' THEN 'TECHNOLOGY_INTEGRATION'
        ELSE trim(val)
    END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION map_legacy_taxonomy_array(arr text[])
RETURNS text[] AS $$
DECLARE
    item text;
    result text[] := '{}';
    mapped text;
BEGIN
    IF arr IS NULL OR array_length(arr, 1) IS NULL THEN
        RETURN '{}';
    END IF;
    FOREACH item IN ARRAY arr LOOP
        mapped := map_legacy_taxonomy_item(item);
        IF mapped IS NOT NULL AND mapped <> '' AND NOT (result @> ARRAY[mapped]) THEN
            result := array_append(result, mapped);
        END IF;
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 4. Backfill existing partner profiles into partner_preferences
INSERT INTO partner_preferences (
    user_id,
    partner_profile_id,
    target_categories,
    search_region,
    strict_region_match,
    seeking_collaborations,
    specific_needs,
    qualification_criteria,
    created_at,
    updated_at
)
SELECT 
    p.user_id,
    p.id,
    COALESCE(p.interested_categories, '{}'),
    COALESCE(p.search_region, ''),
    false,
    map_legacy_taxonomy_array(array_cat(COALESCE(p.partnership_types, '{}'), COALESCE(p.collaboration_types, '{}'))),
    COALESCE(p.partnership_needs, ''),
    COALESCE(p.business_criteria, ''),
    p.created_at,
    p.updated_at
FROM partner_profiles p
ON CONFLICT (user_id) DO UPDATE SET
    partner_profile_id     = EXCLUDED.partner_profile_id,
    target_categories      = EXCLUDED.target_categories,
    search_region          = EXCLUDED.search_region,
    seeking_collaborations = EXCLUDED.seeking_collaborations,
    specific_needs         = EXCLUDED.specific_needs,
    qualification_criteria = EXCLUDED.qualification_criteria,
    updated_at             = now();

-- 5. Normalize existing UMKM seeking arrays in businesses table
UPDATE businesses
SET seeking = map_legacy_taxonomy_array(seeking)
WHERE array_length(seeking, 1) > 0;

-- 6. Transition Trigger to guarantee zero-drift if legacy backend updates partner_profiles
CREATE OR REPLACE FUNCTION sync_legacy_partner_profile_to_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO partner_preferences (
        user_id,
        partner_profile_id,
        target_categories,
        search_region,
        strict_region_match,
        seeking_collaborations,
        specific_needs,
        qualification_criteria,
        created_at,
        updated_at
    )
    VALUES (
        NEW.user_id,
        NEW.id,
        COALESCE(NEW.interested_categories, '{}'),
        COALESCE(NEW.search_region, ''),
        false,
        map_legacy_taxonomy_array(array_cat(COALESCE(NEW.partnership_types, '{}'), COALESCE(NEW.collaboration_types, '{}'))),
        COALESCE(NEW.partnership_needs, ''),
        COALESCE(NEW.business_criteria, ''),
        NEW.created_at,
        NEW.updated_at
    )
    ON CONFLICT (user_id) DO UPDATE SET
        partner_profile_id     = EXCLUDED.partner_profile_id,
        target_categories      = CASE 
            WHEN array_length(partner_preferences.target_categories, 1) IS NULL OR array_length(partner_preferences.target_categories, 1) = 0 
            THEN EXCLUDED.target_categories 
            ELSE partner_preferences.target_categories 
        END,
        search_region          = CASE 
            WHEN partner_preferences.search_region = '' 
            THEN EXCLUDED.search_region 
            ELSE partner_preferences.search_region 
        END,
        seeking_collaborations = CASE 
            WHEN array_length(partner_preferences.seeking_collaborations, 1) IS NULL OR array_length(partner_preferences.seeking_collaborations, 1) = 0 
            THEN EXCLUDED.seeking_collaborations 
            ELSE partner_preferences.seeking_collaborations 
        END,
        specific_needs         = CASE 
            WHEN partner_preferences.specific_needs = '' 
            THEN EXCLUDED.specific_needs 
            ELSE partner_preferences.specific_needs 
        END,
        qualification_criteria = CASE 
            WHEN partner_preferences.qualification_criteria = '' 
            THEN EXCLUDED.qualification_criteria 
            ELSE partner_preferences.qualification_criteria 
        END,
        updated_at             = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_legacy_partner_profile ON partner_profiles;
CREATE TRIGGER trg_sync_legacy_partner_profile
AFTER INSERT OR UPDATE ON partner_profiles
FOR EACH ROW
EXECUTE FUNCTION sync_legacy_partner_profile_to_preferences();

