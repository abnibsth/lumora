# Fase-fase Backend LUMORA

Status: **fase 1–5 selesai**, fase 6 (AI) belum dikerjakan.
"Selesai" = endpoint terpasang di `cmd/api/main.go` + unit test hijau + smoke test live lolos + terdokumentasi di `docs/api.md`.

---

## Ringkasan status

| Fase | Scope | Status |
|---|---|---|
| 1 | Kontrak API, endpoint baca, seed 9 profil | ✅ **Selesai** |
| 2 | Auth — sesi cookie `httpOnly` | ✅ **Selesai** |
| 3 | Endpoint tulis profil (create / patch / publish) | ✅ **Selesai** |
| 4 | Bookmark per akun | ✅ **Selesai** |
| 5 | Upload media (`coverImage` / `logo`) | ✅ **Selesai** |
| 6 | AI draft profil | ❌ **Belum** |

Total tes saat ini: **62 tes utama / 76 kasus** (termasuk subtest), semua PASS — `gofmt` bersih, `go vet` bersih. Migrasi DB: **version 3**.
Ditambah **8 integration test** yang memukul Postgres asli (build tag `integration`, lihat di bawah).

---

## Fase 1 — Kontrak, baca, seed ✅

**Isi:**
- Stack: **Gin** + **Postgres 16** + **pgx/v5** + **sqlc** + **goose** (module `github.com/alfian/lumora/backend`).
- Skema `migrations/0001_init.sql`: tabel `users`, `businesses`, `business_milestones`, `bmc_entries` (field 1:1 dengan `frontend/types/business.ts`, JSON camelCase).
- `docs/api.md`: kontrak resmi buat frontend (envelope error, tipe `Business`, checklist integrasi).
- Seed `cmd/seed` — 9 profil disalin dari `frontend/data/businesses.ts`, idempoten (aman diulang).

**Endpoint aktif:**

| Method | Path | Catatan |
|---|---|---|
| GET | `/healthz` | cek server hidup |
| GET | `/api/v1/businesses` | filter `q` / `category` / `location`, paginasi `page` 1–50, hanya `published`, `total` akhir |
| GET | `/api/v1/businesses/:slug` | detail + `milestones[]` + `bmc[]`, salah slug → 404 |

**Verifikasi:** test hydrate (regresi bug salin-nilai), test paginasi, live curl (pagination 5+4 tanpa tumpang tindih, `q=kopi`, kategori, 400/404 envelope).

**Catatan:** sengaja **tanpa section down** di migrasi — sqlc membaca folder `migrations` sebagai schema source; rollback = drop database.

---

## Fase 2 — Auth sesi (cookie httpOnly) ✅

**Isi:**
- `migrations/0002_sessions.sql`: tabel `sessions` (token PK, `user_id` FK, `expires_at`) + index.
- Password **argon2id** PHC (`$argon2id$v=19$...`), min 8 / maks 128 karakter.
- Token sesi 32 byte random (base64url), TTL **30 hari**.
- Cookie `lumora_session`: `HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` otomatis saat `APP_ENV=production` (ditulis manual via `http.SetCookie`, bukan `gin.SetCookie`, karena gin tidak menulis `SameSite`).

**Endpoint aktif:**

| Method | Path | Respons |
|---|---|---|
| POST | `/api/v1/auth/register` | 201 + user + `Set-Cookie`; duplikat → 409 `email_taken` (case-insensitive) |
| POST | `/api/v1/auth/login` | 200 + user + `Set-Cookie`; gagal → 401 `invalid_credentials` (satu error untuk email & password salah) |
| POST | `/api/v1/auth/logout` | 200, cookie dihapus (Max-Age=0); aman dipanggil dobel |
| GET | `/api/v1/auth/me` | 200 user / 401 — buat hydration sesi di navbar |

**Keputusan keamanan:** email dinormalisasi lowercase, tidak ada token di localStorage, tanpa header Authorization (cookie saja), respons login/register tidak membedakan "email tak terdaftar" vs "password salah".

**Verifikasi:** roundtrip argon2, salt segar, register→sesi hidup, logout mematikan sesi, sesi kedaluwarsa ditolak + dihapus, handler 401/409/400 + flag cookie, live curl lengkap.

---

## Fase 3 — Endpoint tulis profil ✅

**Isi:**
- Query tulis: `GetBusinessByID`, `UpdateBusiness` (full-row), delete child (`sqlc generate`).
- Domain `business_write.go`: input create (lengkap) + patch (semua field pointer = opsional), validasi pesan Bahasa Indonesia per field (kategori tetap sentinel `ErrInvalidCategory` → kode `invalid_category`).
- Service `business_write.go`: slug otomatis (`slugify` + loop `-2`, `-3`), ownership check, merge patch, ganti total `milestones`/`bmc`, publish idempoten.

**Endpoint aktif (wajib login, hanya profil milik sendiri):**

| Method | Path | Respons |
|---|---|---|
| POST | `/api/v1/businesses` | 201, selalu mulai `draft`, slug dari nama, `owner_user_id` = akun pembuat |
| PATCH | `/api/v1/businesses/:id` | 200, merge field yang dikirim; `""` opsional = hapus (NULL); `slug` & kepemilikan tidak bisa berubah |
| POST | `/api/v1/businesses/:id/publish` | 200 `published` setelah cek kelengkapan; sudah published → tetap 200 |
| GET | `/api/v1/businesses/mine` | 200, semua profil milik akun (draft + published) + `status`, terbaru dulu |

Respons ketiganya = bentuk `Business` + field `status`.

**Aturan yang dijaga:**
- Draft **tidak bocor** ke list/detail publik (list tetap 9 sebelum publish).
- `404 not_found` (id tak ada) dibedakan dari `403 forbidden` (bukan milikmu) — beda dengan `401` (belum login).
- Batas payload: 50 milestones, 30 blok BMC, tahun 1900–2100, dst.
- Create/Update/Publish jalan dalam **satu transaksi DB** (`service.Transactor`), jadi profil + milestones/BMC tersimpan atomik — gagal di tengah = rollback, tidak ada profil yatim.

**Verifikasi:** 9 test service (ownership, merge tak menyentuh field lain, slug unik, ganti children, publish + gagal publish draft tak lengkap) + 6 test handler (401/403/404/400 mapping) + live curl 11 langkah lewat proxy FE.

**Catatan:** profil **hasil seed tidak punya pemilik** (`owner_user_id` NULL) → tidak bisa diedit/dipublish via API. Hanya profil yang dibuat lewat `POST` yang bisa dikelola.

---

## Fase 4 — Bookmark per akun ✅

**Isi:**
- `migrations/0003_bookmarks.sql`: tabel `bookmarks` (`user_id` + `business_id` PK gabungan, kedua FK `ON DELETE CASCADE`, index per user berdasarkan waktu simpan).
- Query sqlc: list dengan join (hanya `published`), insert `ON CONFLICT DO NOTHING`, delete by slug via subquery (tetap bisa unbookmark profil yang sudah tak terbit).
- Service `bookmarks.go` + refactor `hydrate` jadi fungsi bersama supaya daftar bookmark ikut terisi `milestones`/`bmc`.

**Endpoint aktif (wajib login):**

| Method | Path | Respons |
|---|---|---|
| GET | `/api/v1/bookmarks` | envelope list (tanpa paginasi, `total` = jumlah bookmark), items ter-hydrate |
| POST | `/api/v1/bookmarks/:slug` | 200 `{"status":"ok"}`, idempoten; slug tak ada/draft → 404 |
| DELETE | `/api/v1/bookmarks/:slug` | 200 selalu (idempoten) |

**Aturan yang dijaga:** hanya profil `published` yang bisa ditandai; draft dan "tidak ada" sama-sama 404 (tidak bisa dipakai menebak profil tak terbit); data `localStorage` di frontend bisa ditinggalkan.

**Verifikasi:** 5 test service (hydrates, kosong non-nil, add tolak tak-terbit, insert per user, remove idempoten) + 5 test handler (401 ketiga route, serahkan user/slug, 404, envelope, delete selalu 200) + 11 langkah smoke test live.

---

## Fase 5 — Upload media ✅

**Isi:**
- `handler/media.go`: `POST /api/v1/media` multipart field `file`, wajib login.
- Keamanan: tipe divalidasi lewat **sniff byte pertama** (`http.DetectContentType`) bukan nama file, nama file klien **tidak pernah** dipakai (server generate `<uuid>.<ext>` → tidak ada traversal), maks 5 MB, allowlist JPEG/PNG/WebP/GIF.
- Penyimpanan lokal `backend/uploads/` (env `UPLOAD_DIR`), disajikan publik lewat `r.Static("/uploads", ...)`; folder masuk `.gitignore`.
- `config.go`: tambah `UploadDir`.

**Endpoint aktif:**

| Method | Path | Respons |
|---|---|---|
| POST | `/api/v1/media` | 200 `{"url":"/uploads/<uuid>.png"}` — URL relatif untuk `coverImage`/`logo` |

**Verifikasi:** 6 test handler (401, field salah, PNG sukses + file benar-benar tersimpan, teks ditolak walau nama `.png`, kebesaran ditolak) + smoke test live (upload PNG → file terbaca publik 200 `image/png`, teks ditolak, tanpa login 401).

---

## Fase 6 — AI draft profil ❌ Belum

**Rencana:** `POST /api/v1/ai/draft-profile` — input narasi bebas UMKM → output draf profil terstruktur (kategorisasi, ringkasan, saran urutan) dalam satu respons (**non-streaming**).

**Yang belum ada:** pilihan AI provider **belum diputuskan**, API key, prompt, endpoint, mapping output ke shape `Business`, test, dokumentasi.

**Batasan yang sudah dikunci di kontrak:** AI **tidak boleh** mengarang `revenueLabel`, `growthLabel`, `revenueSeries` — angka finansial hanya dari input user.

---

## Pekerjaan di luar fase (backlog / known gaps)

| Item | Status |
|---|---|
| Git commit | ❌ `backend/`, `docs/`, `.gitignore`, edit `frontend/next.config.ts` **belum di-commit** |
| Klaim/assign pemilik profil seed | ❌ belum — dibutuhkan supaya data demo bisa diedit via API |
| Rate limiting login/register | ❌ belum (brute-force masih mungkin) |
| Rotasi/refresh token sesi | ❌ belum — sesi statis 30 hari |
| Integrasi test ke DB asli | ✔ **selesai** — `internal/service/integration_test.go` (build tag `integration`): lifecycle tulis→publish, slug vs seed, register/login/sesi (23505 asli), bookmark, seed ter-baca. Auto-skip kalau Postgres mati, auto-bersih tiap baris yang dibuat |
| CI (lint + test otomatis) | ❌ belum ada |
| Struktur logging | ❌ masih `log.Printf` standar |
| CORS | ✔ **sengaja tidak ada** — frontend lewat proxy rewrite `next.config.ts`, jadi same-origin |

---

## Cara verifikasi ulang

```powershell
cd backend
docker compose up -d --build             # full stack: postgres → migrate → seed → api (:8080), otomatis & idempoten
gofmt -l .                               # harus kosong
go vet ./... ; go test ./... -count=1    # semua ok (tanpa DB)
# integration test — butuh Postgres hidup, data test auto-dihapus (seed aman):
go test -tags integration ./internal/service -run Integration -v -count=1
curl.exe http://localhost:8080/healthz   # {"status":"ok"}
# uji manual seluruh endpoint (langkah + ekspektasi per status code):
#   docs/manual-test.md
```

Catatan Docker: image multi-binary (`Dockerfile` → `api` + `migrate` + `seed`), migrasi pakai `cmd/migrate`
(goose sebagai library — tidak perlu install goose CLI), one-shot `migrate`/`seed` jalan tiap `up` (idempoten),
data di volume `lumora-pgdata` + `lumora-uploads`. Jalankan tanpa Go pun bisa (cukup Docker Desktop).

Detail kontrak tiap endpoint (body, status, kode error): **`docs/api.md`**.
