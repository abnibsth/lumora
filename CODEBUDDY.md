# CODEBUDDY.md

This file provides guidance to CodeBuddy Code when working with code in this repository.

## Repository layout

- `backend/` — Go REST API (Gin + Postgres 16 + pgx/v5 + sqlc + goose); module `github.com/alfian/lumora/backend`, Go 1.27. Actively developed; phases 1–11 complete.
- `frontend/` — Next.js 16 App Router prototype (marketing + business discovery). Uses hardcoded mock data; it does **not** call the backend yet (only a dormant `/api/:path*` proxy rewrite exists).
- `docs/` — `api.md` (authoritative endpoint contract), `fases.md` (backend phase history + known gaps), `manual-test.md` (step-by-step endpoint smoke test; its section 10 is the production/Railway runbook).

## Common commands

### Backend (`cd backend`)

```bash
# Full stack (postgres → migrate → seed → api on :8080), idempotent
docker compose up -d --build

# Run locally against the compose Postgres (reads backend/.env)
go run ./cmd/api       # API server
go run ./cmd/migrate   # apply goose migrations (library, no goose CLI needed)
go run ./cmd/seed      # insert the 9 demo profiles (skips existing slugs)

# backend/.env is optional in development — defaults point at the compose DB.
# AI_PROVIDER defaults to "gemini", which then requires GEMINI_API_KEY and
# refuses to boot without it; set AI_PROVIDER=stub to run keyless.
curl http://localhost:8080/healthz   # {"status":"ok"}

# Tests — no database required
go test ./... -count=1
go test ./internal/service -run TestListReturnsTotalAndChildren -v   # single test

# Integration tests — hit a real Postgres, auto-skip if it is down, auto-clean rows
go test -tags integration ./internal/service -run Integration -v -count=1

# Style gate (must be clean)
gofmt -l . && go vet ./...

# Regenerate internal/store after editing queries/*.sql
sqlc generate

# Race detector — the host has no gcc, so run it in a container (from Git Bash)
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/src" -w /src golang:1.27 go test -race ./...
```

### Frontend (`cd frontend`)

```bash
npm install
npm run dev      # http://localhost:3000
npm run lint
npm run build
npm run start
```

## Architecture

### Backend request flow

`cmd/api/main.go` is the single wiring point: it loads config, opens the pgx pool, constructs services and handlers, and registers every route. The layers below it are, in order:

```
cmd/api (wiring)  →  internal/http/handler  →  internal/service  →  internal/store (sqlc)
                            ↓                        ↓
                     internal/http/middleware   internal/domain (types + sentinel errors)
```

- **`internal/domain`** — the `Business`, `User`, and AI draft types plus sentinel errors (`ErrNotFound`, `ErrForbidden`, `ErrInvalidCategory`, `ErrInvalidParameter`, `ErrAIUnavailable`). `domain.Business` mirrors `frontend/types/business.ts` field for field (camelCase JSON); `domain.Categories` mirrors `BUSINESS_CATEGORIES` there. These two lists are a contract — change both together.
- **`internal/store`** — **generated** by sqlc from `queries/*.sql` using `migrations/` as the schema. Do not hand-edit `*.sql.go`; change the query and run `sqlc generate`.
- **`internal/service`** — business logic. Each service declares a narrow repository interface (e.g. `BusinessRepository`) so it compiles and tests without a database. Multi-statement writes go through `service.Transactor` (`internal/service/tx.go`) so a failure halfway cannot leave a business without its milestones/BMC.
- **`internal/http/handler`** — HTTP concerns only. Handlers declare a service interface locally so they can be tested with fakes.
- **`internal/config`** — every env var is read and validated in `Load()`; invalid values **fail startup** rather than silently degrading. `cmd/migrate` and `cmd/seed` share `config.Load()` and must keep working without AI/email credentials, so `Config.RequireGeminiKey()` is called only by `cmd/api`.

### Error envelope (single contract)

Every error response is `{"error":{"code": "...", "message": "..."}}`. `writeError` lives in `internal/http/handler/business.go`; `abortWithError` in `internal/http/middleware/session.go` is a deliberate duplicate of the same shape (handler imports middleware, so middleware cannot import the handler). Keep both in sync — the codes are documented in `docs/api.md`.

### Auth & sessions

- Session token in an `httpOnly` cookie `lumora_session` (`SameSite=Lax`, `Secure` when `APP_ENV=production`). No `Authorization` header, no tokens in `localStorage`.
- Passwords are argon2id PHC strings (`internal/auth`). Login runs a dummy argon2 verify on the "email not found" path so response timing does not reveal whether an account exists.
- `AttachSession` is mounted on the `/api/v1` group (not the whole engine). `RequireSession()` guards authenticated routes; `RequireVerified()` is a **soft gate** applied only to the two endpoints that cost money or publish content: `POST /api/v1/businesses/:id/publish` and `POST /api/v1/ai/draft-profile`. Everything else (register, login, editing drafts, bookmarks, media upload) stays reachable unverified.
- Drafts must never leak to the public list/detail; `GET /api/v1/businesses` and `GET /api/v1/businesses/:slug` return only `published` rows. `DELETE /api/v1/businesses/:id` **archives** rather than deletes (status `archived`), so it drops out of every read path through that same `published` filter — the only queries that had to learn about it are `ListBusinessesByOwner`/`CountBusinessesByOwner`. `ownedRow` rejects archived rows *before* the ownership check, so a stranger guessing an archived UUID gets 404 rather than a 403 that would confirm the row exists.
- Deleting an account is one `DELETE FROM users`: sessions, verification tokens, bookmarks, and the account's businesses all cascade, and the businesses take their milestones, BMC blocks, and other users' bookmarks with them. `businesses.owner_user_id` is `ON DELETE CASCADE` (it was `SET NULL` before phase 10, which orphaned profiles permanently).

### Rate limiting

`internal/http/middleware/ratelimit.go` is an in-memory token bucket — no Redis, no background goroutine (lazy refill under one mutex). Keys are **never IP-based**: `SetTrustedProxies(nil)` is set because Railway's edge rewrites the forwarded-for chain, so `ClientIP()` is untrusted. Keys are user ID or the email in the request body (`EmailKey` reads and always restores the body).

Two load-bearing rules when adding a limited route:

1. Mount the **global valve before** the per-key limiter. Buckets are only allocated for new keys and swept after a full idle window, so a per-key-first order lets a flood of distinct keys grow the map without bound.
2. Counts come from env; **windows are constants in `cmd/api/main.go`**, so an env var name and its duration cannot drift.

State resets on every restart/redeploy, and the whole scheme assumes a **single instance** (a Railway volume blocks replicas). If more than one replica is ever needed, this must move to Redis — not gain a lock.

### Logging

Logging uses the stdlib `log/slog`, configured once in `internal/logging`. Each `cmd/*` binary calls `logging.Setup(cfg.AppEnv, cfg.LogLevel)` right after `config.Load()`; `cmd/api` must do so **before** `email.NewStub()`, which captures `slog.Default()`. Format is JSON when `APP_ENV=production`, human text otherwise; `LOG_LEVEL` (`debug`/`info`/`warn`/`error`, default `info`) is validated fail-fast like every other variable. Library code logs through the package-level `slog` default, so no logger is threaded through constructors. `middleware.AccessLog` replaces `gin.Logger()`, emits one structured line per request, and returns a generated `X-Request-ID` (never trusted from an inbound header). Never log payloads: the AI narrative, prompt, session tokens, and API key stay out of logs — the one deliberate exception is the email stub, which logs the raw verification link so a developer can copy it. The real Resend provider never logs the link, token, or recipient.

### AI drafting

`internal/ai` has two `service.Drafter` implementations: `gemini.go` (real provider, the default, needs `GEMINI_API_KEY`) and `stub.go` (deterministic offline heuristic for keyless runs and tests). Adding a provider = implement `service.Drafter`, add one `case` in `cmd/api/main.go`, add one value to `config.AIProviders`. `domain.DraftProfile` deliberately has **no financial fields**, so "the AI must not invent numbers" is structural rather than a convention; provider failures are normalized to a single `503 ai_unavailable`.

### Email verification

Register mints a 32-byte token, stores only its SHA-256 hash, and emails a link to `FRONTEND_BASE_URL/verify-email?token=...` (the link points at the **frontend**, which then POSTs the token to the API, so email scanners that prefetch GET links cannot consume it). Register succeeds even if the mail fails (the account is already committed); resend returns the send error.

`internal/email` has two `service.VerificationSender` implementations: `resend.go` (real provider over Resend's HTTPS API, `EMAIL_PROVIDER=resend`, needs `RESEND_API_KEY`) and `stub.go` (logs the link instead of sending, for local runs and tests). Adding a provider = implement `service.VerificationSender`, add one `case` in `cmd/api/main.go`, add one value to `config.EmailProviders`. Every provider failure collapses into `domain.ErrEmailUnavailable` → `503 email_unavailable`, the same shape as `503 ai_unavailable`.

Two fail-fast rules live in `config.RequireEmailSender()`, called **only by `cmd/api`** (like `RequireGeminiKey`): `EMAIL_PROVIDER=resend` without `RESEND_API_KEY`, and `EMAIL_PROVIDER=stub` when `APP_ENV=production`. It must **not** move into `config.Load()`, or the `/app/migrate` step in `docker-entrypoint.sh` would fail and break the whole deploy. `RESEND_FROM` defaults to `onboarding@resend.dev`, which Resend only delivers to the Resend account owner — reaching real users needs a verified domain.

The real provider uses the **HTTPS API, not SMTP**, because Railway blocks outbound SMTP below its top plan. The API key rides in an `Authorization` header (never a query string), and a failure log carries only the status and Resend's error enum — never the link, the token, or the recipient, because the link is a credential.

### Frontend

- App Router, Server Components by default; `"use client"` only for browser APIs, events, or state.
- `lib/constants.ts` is the source of truth for routes; `types/business.ts` is the data contract.
- `data/businesses.ts` holds the 9 demo profiles; `lib/bookmarks.ts` persists bookmarks to `localStorage` via `useSyncExternalStore`.
- `next.config.ts` rewrites `/api/:path*` → `http://localhost:8080/api/:path*` (unused so far) and maps the marketing routes to a shared renderer.
- `frontend/AGENTS.md` mandates the **antislop** skills for any UI, copy, people, mobile-layout, or code-comment work — read the relevant `.agents/skills/antislop*/SKILL.md` before that kind of change, and ask the user whether to apply it during or after the work.

## Railway deploy (production)

The backend runs on Railway: project `vps-b7g6qv9`, service `lumora-backend`, Postgres service `Postgres`, live at `https://lumora-backend-production-ed55.up.railway.app`.

Some bullets below are corroborated by this repo (`docker-entrypoint.sh`, the Dockerfile); others are Railway account/config state observed on 2026-09-30 that no file here can confirm. Re-check the dashboard if a deploy behaves unexpectedly.

- **Deploys are `railway up` snapshot uploads, not GitHub auto-deploy.** A `git push` does not trigger a build. Deploy explicitly from `backend/`: `railway up -c --service lumora-backend` (`-c` streams build logs then exits). CI runs on push/PR (`.github/workflows/backend.yml`) but does not gate a deploy, so still run `go test ./... -count=1` yourself first.
- **Run `railway up` from `backend/`.** That is what makes the Dockerfile findable: the uploaded snapshot's root becomes `backend/`, and the service's Root Directory is empty. From any other directory the build cannot find it.
- **`RAILWAY_RUN_UID=0` is load-bearing for uploads.** Railway mounts volumes owned by root, but the image ends with `USER lumora` (UID 10001); without that variable `docker-entrypoint.sh` skips the chown and every upload fails with EACCES at runtime — not at boot, so it looks like a code bug.
- **Migrations run on every deploy** (`docker-entrypoint.sh` runs `/app/migrate` before `/app/api`), so a deploy never serves a stale schema.
- **Volumes block replicas** (one volume per service) and cause brief redeploy downtime even with a healthcheck. This is the constraint behind the rate limiter's in-memory state — see the Rate limiting section.
- **Production env vars are literals, not `${{Postgres.DATABASE_URL}}` references**, so rotating a credential means updating every variable by hand. Required: `DATABASE_URL`, `APP_ENV=production`, `RAILWAY_RUN_UID=0`, `GEMINI_API_KEY`, `EMAIL_PROVIDER=resend`, `RESEND_API_KEY`. Production without `DATABASE_URL` fails fast with `ErrMissingDatabaseURL`; `cmd/api` also refuses to boot on `EMAIL_PROVIDER=resend` without a key or on `EMAIL_PROVIDER=stub` in production (see the Email verification section). **Set the email variables before `railway up`** — a boot on the stub or without the key now fails, so a deploy with stale env vars goes down rather than silently logging links.
- **Verification mail only reaches the Resend account owner until a domain is verified.** With the default `RESEND_FROM` (`onboarding@resend.dev`), Resend refuses every other recipient with `403 restricted_api_key`, which the API surfaces as `503 email_unavailable` on `resend-verification` (and swallows on register, which still returns `201`). A missing verification mail for a normal user is therefore expected, not a bug — see the Email verification section for the mechanism.
- **Production runs a newer Postgres major than local** — 18.6, versus the 16 pinned in `docker-compose.yml`. The compose version is not the prod version, so do not assume version-specific SQL behaves identically in both.
- **The production DB is not reachable from the internet** (no public proxy; `postgres.railway.internal` resolves only inside Railway). Reach it with `railway connect Postgres --ssh --tunnel-only -P 5433` plus a client against `host.docker.internal:5433`.
- **The tunnel bypasses password auth** — it lands on `127.0.0.1`, which `pg_hba.conf` matches with a `trust` rule before `scram-sha-256`, so any password is accepted. It cannot verify a credential; test the real `postgres.railway.internal` path instead.
- **Closing the tunnel needs two kills.** `railway connect` leaves an `ssh.exe` holding port 5433 plus its parent `railway.exe`; killing one orphans the other. Check `netstat -ano | findstr :5433` and `Stop-Process` both — in PowerShell, since `taskkill //PID` fails in Git Bash.
- **The Railway account is the security boundary, not the DB password**: `railway ssh -s Postgres whoami` returns `root` and `railway connect` bypasses auth. The password only protects the service-to-service path.

## Conventions & gotchas

- **Migrations have no down sections on purpose**: sqlc reads `migrations/` as its schema source; rollback means dropping the database.
- Seeded demo profiles have a NULL owner, so they cannot be edited or published through the API — only profiles created via `POST /api/v1/businesses` are manageable.
- Backend code style follows the `golang-*` skills under `backend/.agents/skills/` (early returns, no `else` after return, initialized slices/maps, named fields in literals, ≤4 params).
- Keep `gofmt` and `go vet` clean; run the race detector in the `golang:1.27` container (no local gcc).
- Never commit the real `backend/.env` or API keys; `.env.example` documents every variable.
- Railway deploy has non-obvious traps — see the section above before touching production.
- `docs/fases.md` tracks what is done and the open gaps (static 30-day sessions, no seed-owner claim, unverified Resend domain so mail only reaches the account owner, no password-reset flow).
