-- Email is stored lowercase and callers must lowercase before querying, so
-- "Budi@Example.com" and "budi@example.com" are the same account.
-- name: InsertUser :one
INSERT INTO users (name, email, password_hash, role)
VALUES ($1, $2, $3, $4)
RETURNING *;

-- name: GetUserByEmail :one
SELECT *
FROM users
WHERE email = $1;

-- name: GetUserByID :one
SELECT *
FROM users
WHERE id = $1;

-- name: UpdateUserName :one
UPDATE users
SET name = $2
WHERE id = $1
RETURNING *;

-- name: UpdateUserPassword :exec
UPDATE users
SET password_hash = $2
WHERE id = $1;

-- One statement, because everything a user owns hangs off a foreign key:
-- sessions, email_verification_tokens, bookmarks, and businesses all cascade.
-- businesses cascading also reaches business_milestones, bmc_entries, and the
-- bookmarks other users made on those profiles.
-- name: DeleteUser :exec
DELETE FROM users
WHERE id = $1;
