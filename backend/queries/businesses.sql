-- Public list: page through matching published profiles by id only. Rows are
-- loaded by GetBusinessesByIDs afterwards so list and detail share a single
-- row->domain mapper. The match total is a separate query
-- (CountPublishedBusinesses) because a count(*) OVER () window only exists on
-- returned rows, so it reads 0 on a page past the last row.
-- The id tiebreaker keeps paging deterministic when two profiles share a name.
-- name: ListPublishedBusinessIDs :many
SELECT b.id
FROM businesses b
WHERE b.status = 'published'
  AND (sqlc.narg('category')::text IS NULL OR b.category = sqlc.narg('category'))
  AND (sqlc.narg('location')::text IS NULL OR b.location ILIKE sqlc.narg('location'))
  AND (
        sqlc.narg('q')::text IS NULL
        OR b.name ILIKE '%' || sqlc.narg('q') || '%'
        OR b.description ILIKE '%' || sqlc.narg('q') || '%'
        OR b.category ILIKE '%' || sqlc.narg('q') || '%'
        OR b.location ILIKE '%' || sqlc.narg('q') || '%'
      )
ORDER BY b.name ASC, b.id ASC
LIMIT sqlc.arg('limit') OFFSET sqlc.arg('offset');

-- Total rows matching the same filters, independent of LIMIT/OFFSET, so the
-- list envelope's `total` stays correct even when the requested page is empty.
-- name: CountPublishedBusinesses :one
SELECT count(*)
FROM businesses b
WHERE b.status = 'published'
  AND (sqlc.narg('category')::text IS NULL OR b.category = sqlc.narg('category'))
  AND (sqlc.narg('location')::text IS NULL OR b.location ILIKE sqlc.narg('location'))
  AND (
        sqlc.narg('q')::text IS NULL
        OR b.name ILIKE '%' || sqlc.narg('q') || '%'
        OR b.description ILIKE '%' || sqlc.narg('q') || '%'
        OR b.category ILIKE '%' || sqlc.narg('q') || '%'
        OR b.location ILIKE '%' || sqlc.narg('q') || '%'
      );

-- name: GetBusinessesByIDs :many
SELECT *
FROM businesses
WHERE id = ANY ($1::uuid[])
ORDER BY name ASC, id ASC;

-- name: GetPublishedBusinessBySlug :one
SELECT *
FROM businesses
WHERE slug = $1
  AND status = 'published';

-- One round-trip for the whole list: rows are grouped by business_id in the
-- service layer instead of querying per card.
-- name: ListMilestonesByBusinessIDs :many
SELECT *
FROM business_milestones
WHERE business_id = ANY ($1::uuid[])
ORDER BY business_id, position, year;

-- name: ListBmcEntriesByBusinessIDs :many
SELECT *
FROM bmc_entries
WHERE business_id = ANY ($1::uuid[])
ORDER BY business_id, position;

-- name: ExistsBusinessBySlug :one
SELECT EXISTS (SELECT 1 FROM businesses WHERE slug = $1);

-- name: InsertBusiness :one
INSERT INTO businesses (
    slug, owner_user_id, name, category, location, description, story,
    cover_image, cover_position, logo, founded_year,
    revenue_label, growth_label, revenue_series, seeking, seeking_objective,
    owner_name, owner_role, owner_bio, status, verified
) VALUES (
    $1, $2, $3, $4, $5, $6, $7,
    $8, $9, $10, $11,
    $12, $13, $14, $15, $16,
    $17, $18, $19, $20, $21
)
RETURNING *;

-- name: InsertMilestone :exec
INSERT INTO business_milestones (business_id, year, title, description, position)
VALUES ($1, $2, $3, $4, $5);

-- name: InsertBmcEntry :exec
INSERT INTO bmc_entries (business_id, label, value, position)
VALUES ($1, $2, $3, $4);

-- name: GetBusinessByID :one
SELECT *
FROM businesses
WHERE id = $1;

-- Full-row update: the service reads the row, merges the fields the client
-- sent, and writes everything back, one query instead of a SET per field.
-- slug and owner_user_id are absent on purpose: a profile URL never changes
-- and ownership never transfers through PATCH.
-- name: UpdateBusiness :one
UPDATE businesses
SET name              = $2,
    category          = $3,
    location          = $4,
    description       = $5,
    story             = $6,
    cover_image       = $7,
    cover_position    = $8,
    logo              = $9,
    founded_year      = $10,
    revenue_label     = $11,
    growth_label      = $12,
    revenue_series    = $13,
    seeking           = $14,
    seeking_objective = $15,
    owner_name        = $16,
    owner_role        = $17,
    owner_bio         = $18,
    status            = $19,
    verified          = $20,
    updated_at        = now()
WHERE id = $1
RETURNING *;

-- PATCH sends whole arrays, so replacing beats diffing positions one by one.
-- name: DeleteMilestonesByBusiness :exec
DELETE FROM business_milestones WHERE business_id = $1;

-- name: DeleteBmcEntriesByBusiness :exec
DELETE FROM bmc_entries WHERE business_id = $1;