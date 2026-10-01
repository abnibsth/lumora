-- name: InsertSession :exec
INSERT INTO sessions (token, user_id, expires_at)
VALUES ($1, $2, $3);

-- name: GetSessionByToken :one
SELECT token, user_id, expires_at
FROM sessions
WHERE token = $1;

-- name: DeleteSessionByToken :exec
DELETE FROM sessions
WHERE token = $1;

-- Changing a password logs out every other device but keeps the caller signed
-- in, so the request that changed it does not invalidate its own cookie.
-- name: DeleteOtherSessions :exec
DELETE FROM sessions
WHERE user_id = $1
  AND token <> $2;

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions
WHERE expires_at < now();
