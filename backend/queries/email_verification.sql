-- name: InsertEmailVerificationToken :exec
INSERT INTO email_verification_tokens (token_hash, user_id, expires_at)
VALUES ($1, $2, $3);

-- name: GetEmailVerificationToken :one
SELECT token_hash, user_id, created_at, expires_at, used_at
FROM email_verification_tokens
WHERE token_hash = $1;

-- name: ConsumeEmailVerificationToken :exec
UPDATE email_verification_tokens
SET used_at = now()
WHERE token_hash = $1 AND used_at IS NULL;

-- name: DeleteEmailVerificationTokensByUser :exec
DELETE FROM email_verification_tokens
WHERE user_id = $1;

-- SetUserEmailVerified is idempotent: the guard keeps the first verification
-- time instead of overwriting it on a repeat call.
-- name: SetUserEmailVerified :exec
UPDATE users
SET email_verified_at = now()
WHERE id = $1 AND email_verified_at IS NULL;

-- name: DeleteExpiredEmailVerificationTokens :exec
DELETE FROM email_verification_tokens
WHERE expires_at < now();
