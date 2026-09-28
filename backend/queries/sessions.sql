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

-- name: DeleteExpiredSessions :exec
DELETE FROM sessions
WHERE expires_at < now();
