# Fase-fase Backend LUMORA

Status: **fase 1–11 selesai**.
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
| 6 | AI draft profil | ✅ **Selesai** |
| 7 | Rate limiting endpoint AI (per akun + anggaran global) | ✅ **Selesai** |
| 8 | Rate limiting login/register (per email) | ✅ **Selesai** |
| 9 | Verifikasi email saat register | ✅ **Selesai** |
| 10 | Hapus profil (arsip) + kelola akun (edit nama, ganti sandi, hapus akun) | ✅ **Selesai** |
| 11 | Provider email asli (Resend) | ✅ **Selesai** |

Total tes saat ini: **258 tes utama / 417 kasus** (termasuk subtest), semua PASS — `gofmt` bersih, `go vet` bersih, `go test -race` bersih (dijalankan di container `golang:1.27` karena host tidak punya gcc). Migrasi DB: **version 5**.
Ditambah **11 integration test** (17 kasus) yang memukul Postgres asli (build tag `integration`, lihat di bawah).

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

## Fase 6 — AI draft profil ✅

**Isi:**
- `internal/ai/stub.go`: generator draf **offline deterministik** — heuristik kata kunci, tanpa panggilan jaringan, tanpa API key. Dipakai tes dan run tanpa kredensial (`AI_PROVIDER=stub`).
- `internal/ai/gemini.go`: provider asli lewat Google Gemini REST (`models.generateContent`), **default** (`AI_PROVIDER=gemini`, model `gemini-3.1-flash-lite`). Structured output (`responseMimeType: application/json` + `responseSchema`) jadi model tidak punya field finansial untuk diisi; `thinkingBudget: 0` supaya tidak menunggu proses reasoning. API key dikirim lewat header `x-goog-api-key` (bukan query string) dan tidak pernah muncul di pesan error; body error provider tidak diteruskan ke client — yang dicatat ke log cuma status HTTP + enum status provider (mis. `404/NOT_FOUND` = nama model sudah di-retire Google, `503/UNAVAILABLE` = lonjakan beban).
- `internal/config/config.go`: `AI_PROVIDER` divalidasi terhadap allowlist (`stub`, `gemini`), nilai asing ditolak saat start. `GEMINI_MODEL` opsional (default `gemini-3.1-flash-lite`). Key hanya diwajibkan lewat `Config.RequireGeminiKey()`, yang dipanggil **cuma** oleh `cmd/api`: `cmd/migrate` dan `cmd/seed` memakai `config.Load()` yang sama tapi tidak pernah membuat draf, jadi migrasi tetap jalan di mesin tanpa kredensial AI.
- `internal/service/ai.go`: interface `Drafter` (sisi konsumen), timeout per-generate (`DefaultAITimeout` 15 detik), dan normalisasi semua kegagalan provider jadi `domain.ErrAIUnavailable` → satu kode `503 ai_unavailable`. Log hanya tipe error + durasi, **tidak pernah** narasi atau isi draf.
- `internal/domain/ai.go`: `DraftProfile` **tanpa** field finansial sama sekali — guardrail "AI tidak boleh mengarang angka" jadi struktural, bukan konvensi. `Sanitize()` memotong output ke batas yang sama dengan endpoint tulis (kategori di luar enum → `""`, tahun di luar 1900–2100 → `0`, slice nil → `[]`).

**Endpoint aktif:**

| Method | Path | Respons |
|---|---|---|
| POST | `/api/v1/ai/draft-profile` | 200 draf profil (narasi 20–5000 karakter, body maks 64 KB); `503 ai_unavailable` kalau generator gagal |

Wajib login. Tidak menyimpan apa pun ke DB — hasilnya dipakai prefill form lalu dikirim ke `POST /businesses`.

**Verifikasi:** 17 test domain (`Validate` + `Sanitize` termasuk idempotensi & potong di batas rune), 33 kasus stub (kategori per keyword, word-boundary `tas` vs `atas`, lokasi/tahun, pemisahan kalimat, **determinisme** dua panggilan, output tak pernah memuat field finansial), 13 test Gemini / 23 kasus (parse respons, key di header & model di path, schema tidak punya field finansial + enum kategori sinkron `domain.Categories`, field finansial dari model dibuang saat unmarshal, body error provider tidak bocor ke pesan error, key tidak bocor saat transport error, respons rusak/blocked/cancel ditolak, `context.Canceled` diteruskan utuh, ekstraksi enum status provider), 8 test service (sanitasi output provider, error/timeout → `ErrAIUnavailable`), 8 test handler (401/400/503, body kebesaran, guardrail finansial) + 13 test config (default provider, allowlist, `RequireGeminiKey` untuk gemini saja).

**Live test (provider asli, key asli):** draf penuh 200 dalam ~4,8 detik; guardrail finansial lolos dua serangan — narasi yang minta `revenueLabel`/`growthLabel`/`revenueSeries` **dan** prompt injection "abaikan semua instruksi sebelumnya" dua-duanya balik 200 tanpa satu pun key finansial (dicek dengan enumerasi key JSON, bukan grep). Unicode + emoji (`Kopi Ĝøøđ` ☕) utuh. Narasi 4 karakter → `400 validation_failed`, body rusak → `400 invalid_body`, tanpa sesi → `401 unauthenticated`. Draf hasilnya dikirim balik ke `POST /businesses` → **201**. Data uji dihapus lagi (DB balik ke 9 profil / 0 user).

**Catatan:** provider asli sudah terpasang (Gemini). Menambah provider lain = bikin tipe baru yang memenuhi `service.Drafter`, lalu tambah satu `case` di `cmd/api/main.go` + satu nilai di `config.AIProviders`. Handler, service, dan test tidak perlu berubah.

---

## Fase 7 — Rate limiting endpoint AI (per akun + anggaran global) ✅

**Isi:**
- `internal/http/middleware/ratelimit.go`: **token bucket** per akun, murni di memori proses, tanpa dependensi baru dan tanpa goroutine background. Refill dihitung *lazy* saat request datang (`elapsed × rate`, dibatasi `capacity`), jadi tidak butuh ticker. Satu `sync.Mutex` menjaga map + seluruh bucket; refill-dan-consume terjadi dalam **satu critical section**, karena baca di luar lock lalu tulis di dalam lock adalah data race yang `-race` memang menangkap.
- **Kuncinya user ID, bukan IP.** `cmd/api/main.go` memakai `SetTrustedProxies(nil)`, jadi di belakang proxy Railway `ClientIP()` berisi IP edge yang **sama untuk semua orang** — pembatas per-IP justru akan menghitung seluruh internet sebagai satu klien. Per akun juga lebih tepat secara biaya: yang dibatasi adalah pengeluaran per akun.
- **Kuota dipakai saat request masuk, bukan saat sukses.** Body yang ditolak validasi dan request yang timeout ke provider sama-sama memakai satu token. Disengaja: provider mungkin sudah menagih walau kita timeout, dan tidak ada refund supaya percobaan berulang tidak gratis.
- Bucket baru **mulai penuh** — kalau mulai kosong, request pertama setiap akun langsung `429`. Eviction dijalankan di jalur insert tiap 256 kunci baru (map hanya tumbuh saat kunci baru datang, jadi sweep di situ cukup dan tidak perlu goroutine). **TTL eviction = satu jendela penuh**: kalau lebih pendek, bucket yang masih terisi sebagian akan dihapus lalu dibuat ulang **penuh** — itu celah reset gratis, jadi ini parameter kebenaran, bukan knob memori.
- `internal/config/config.go`: `AI_DRAFT_LIMIT_PER_HOUR` (default **20**). Nilai tidak valid / nol / negatif **ditolak saat start** (`ErrInvalidAIDraftLimit`) — dibaca sebagai "tanpa batas" akan menghapus satu-satunya penjaga di endpoint berbayar.
- **Anggaran global** `AI_DRAFT_GLOBAL_LIMIT_PER_HOUR` (default **200**): satu bucket bersama untuk semua akun, dipasang **di depan** limiter per-akun. Kuota per-akun saja membiarkan N akun membelanjakan N× kuota, dan register masih gratis — anggaran global inilah plafon total biayanya. Nilai tidak valid ditolak saat start dengan sentinel yang sama (`ErrInvalidAIDraftLimit`; pesannya kini generik karena menaungi dua variabel).
- `abortWithError` di `internal/http/middleware/session.go`: envelope error yang sama dengan `handler.writeError`, dipakai `RequireSession` dan limiter. Tidak bisa memakai `writeError` langsung karena `handler` meng-import `middleware` (kalau dibalik jadi import cycle).

**Endpoint aktif:**

| Method | Path | Respons |
|---|---|---|
| POST | `/api/v1/ai/draft-profile` | 200 draf profil; `429 rate_limited` + header `Retry-After` (detik, dibulatkan ke atas) kalau kuota akun **atau** anggaran global habis |

Urutan middleware penting dan diuji: `RequireSession()` **sebelum** limiter, supaya request tanpa sesi ditolak `401` tanpa ikut memakai kuota. Kalau limiter sampai dipasang tanpa sesi, ia **fail closed** (`500`), bukan menghitung semua pemanggil sebagai satu kunci kosong. Valve global dipasang **setelah** `RequireSession` tetapi **sebelum** limiter per-akun, dengan dua alasan: (1) keamanan memori — `allow()` mengalokasikan bucket per kunci baru dan hanya menyapu bucket yang idle satu jendela penuh, jadi per-akun-dulu akan membiarkan banjir akun (hasil pendaftaran massal) menumbuhkan map-nya tanpa batas; (2) keadilan kuota — request yang ditolak karena server sedang penuh **tidak** ikut membakar jatah pribadi pemanggil.

`429 rate_limited` (klien harus menunggu) sengaja dibedakan dari `503 ai_unavailable` (provider yang gagal) — beda arti, beda penanganan di frontend.

**Verifikasi:** 23 test middleware / 27 kasus — kapasitas, bucket baru mulai penuh, refill sesuai rate, refill berhenti di kapasitas, `Retry-After` (memakai jendela 2048 detik supaya rate-nya pangkat dua eksak dan nilai yang diharapkan bukan artefak floating point), antar-kunci saling lepas, **jam mundur tidak menguras bucket**, entri idle ter-evict, entri dalam TTL dipertahankan, 200 goroutine pada satu kunci → **tepat** `capacity` yang lolos, 200 kunci berbeda tanpa concurrent map write, plus test HTTP untuk 200/429/envelope/`Retry-After`/per-akun/urutan terhadap 401/fail-closed, test regresi envelope `401` setelah refactor `abortWithError`, dan 4 test anggaran global (valve dibagi antar-akun, valve membatasi pertumbuhan bucket per-akun, valve jalan setelah `RequireSession` sehingga `401` tidak memakai anggaran, dan envelope `429` + `Retry-After`). Ditambah 6 test config / 14 kasus (default, nilai valid, dan penolakan `abc`/`0`/`-5`/`1.5` untuk `AI_DRAFT_LIMIT_PER_HOUR` dan `AI_DRAFT_GLOBAL_LIMIT_PER_HOUR`).

**Catatan:** ini **sengaja** state in-memory, bukan Redis. API dijalankan satu instance (volume Railway memblokir replica), jadi state per-proses sudah benar di sini. Dua konsekuensi yang harus diingat: kuota **reset tiap restart/redeploy**, dan begitu butuh lebih dari satu replica, penghitung ini **harus** pindah ke Redis — bukan ditambah lock.

---

## Fase 8 — Rate limiting login/register (per email) ✅

**Isi:**
- Mesin limiter fase 7 dipakai ulang **tanpa duplikasi**. `allow(key)` sekarang jadi inti yang kunci-agnostik, dan dua adapter tipis menurunkan kunci dari request:
  - `Middleware()` — perilaku fase 7 (kunci = user ID, dipasang setelah `RequireSession`).
  - `MiddlewareFor(keyFn, code, message)` — umum: ambil kunci lewat `keyFn`, kalau `ok == false` **lewati** (`c.Next()`) dan biarkan handler yang menjawab.
- `KeyFunc func(*gin.Context) (string, bool)` sengaja **dua nilai balik**: "tidak ada kunci yang bisa dipakai" berbeda dari "kunci bernilai string kosong". Kalau dipaksa satu nilai, body tanpa `email` akan jadi kunci `""` yang dipakai bersama oleh semua request rusak — satu bucket palsu.
- `EmailKey` membaca body untuk mengambil `email`, lalu **selalu memulihkan** `c.Request.Body` (`io.ReadAll(http.MaxBytesReader(..., 4 KB))` → `io.NopCloser(bytes.NewReader(body))`). Pemulihan dilakukan **tanpa syarat**, termasuk saat `ReadAll` error, supaya handler di belakangnya tetap bisa membaca body (dan menjawab `400`) — kalau tidak, handler akan melihat body kosong.
- `GlobalKey` mengembalikan kunci tetap `"global"`.

**Dua katup per endpoint, urutan global-dulu:**
- Tiap endpoint auth punya **dua** limiter: katup **global** (satu bucket untuk seluruh proses) lalu katup **per-email**. Global dulu, baru per-email.
- Urutan ini keputusan **keamanan memori**, bukan estetika. `allow` mengalokasikan satu bucket untuk **setiap kunci baru** dan hanya menyapu bucket yang idle **satu jendela penuh**. Kalau per-email didahulukan, banjir ribuan email berbeda (semuanya ditolak katup per-email) tetap **membuat bucket baru** untuk tiap email sebelum katup global sempat menahan — map tumbuh tanpa batas. Dengan global dulu, email-email baru itu berhenti di katup global dan tidak pernah menyentuh map per-email.
- Konsekuensi yang diterima: kuota per-email dihitung **setelah** token global lolos, jadi serangan pada satu email tetap ikut memakai jatah global.

**Endpoint aktif:**

| Method | Path | Respons |
|---|---|---|
| POST | `/api/v1/auth/register` | 201 seperti biasa; `429 rate_limited` + `Retry-After` kalau kuota email/global habis |
| POST | `/api/v1/auth/login` | 200 seperti biasa; `429 rate_limited` + `Retry-After` kalau kuota email/global habis |

Pesan `429` sengaja **sama** untuk kedua endpoint (`authRateLimitMessage`) dan tidak menyebut endpoint mana yang kena, supaya tidak jadi oracle tambahan.

**Perbaikan timing oracle di login (ikut fase ini):**
- `Login` dulu **pulang lebih awal** saat email tak terdaftar (`pgx.ErrNoRows`) tanpa menjalankan argon2, sedangkan email terdaftar menjalankan argon2 — jadi waktu respons membedakan "email ada" vs "email tidak ada" walau pesannya sama (`invalid_credentials`). Itu membatalkan justru usaha anti-enumerasi fase 2.
- Sekarang cabang tak-terdaftar memanggil `payDummyVerify(password)`: argon2 terhadap **hash dummy** sehingga kedua jalur membakar kerja verifikasi yang setara. Hash dummy dibuat **sekali** (`sync.Once`) dari `s.hash` yang sama, jadi parameternya ikut kalau parameter argon2 diubah. `sync.Once` + field di struct service (bukan variabel paket) supaya test bisa menyuntik dan menghitungnya.

**Config (`internal/config/config.go`):**

| Variabel | Default | Jendela (hardcode `cmd/api`) |
|---|---|---|
| `AUTH_LOGIN_LIMIT_PER_15_MIN` | 10 | 15 menit |
| `AUTH_REGISTER_LIMIT_PER_HOUR` | 10 | 1 jam |
| `AUTH_LOGIN_GLOBAL_LIMIT_PER_HOUR` | 300 | 1 jam |
| `AUTH_REGISTER_GLOBAL_LIMIT_PER_HOUR` | 30 | 1 jam |

Konvensi tetap seperti fase 7: **jumlahnya** dari env, **jendelanya** hardcode di `cmd/api` (satu jendela per limiter, `NewRateLimiter` menerimanya sekali). Nilai tidak valid / nol / negatif **ditolak saat start** (`ErrInvalidAuthLimit`) — sama alasannya dengan `AI_DRAFT_LIMIT_PER_HOUR`: dibaca sebagai "tanpa batas" akan menghapus penjaganya. Register global (30/jam) sengaja lebih ketat dari login global (300/jam) karena register menulis baris `users` baru.

**Verifikasi:** 13 test middleware baru / 25 kasus (lolos di bawah limit, `429` + envelope + `Retry-After`, pesan terkonfigurasi, kunci per-email, varian penulisan email berbagi satu bucket, body dipulihkan untuk handler, lewati saat tanpa email, normalisasi `EmailKey`, tolak body tak terpakai, `EmailKey` memulihkan body yang dibacanya, **katup global jalan sebelum bucket per-email**, katup global dibagi antar-email, katup global membatasi pertumbuhan bucket per-email) + 3 test config / 19 kasus (default, `" 7 "` di-trim, penolakan `abc`/`0`/`-5`/`1.5` untuk 4 variabel) + 2 test service / 3 kasus (`Login` membakar satu verifikasi di kedua jalur, hash dummy dibuat sekali). Semua test AI fase 7 tetap hijau (19 test / 23 kasus tidak tersentuh).

**Catatan:** sama seperti fase 7, ini state in-memory — kuota **reset tiap restart/redeploy**, dan pindah ke Redis begitu butuh lebih dari satu replica.

---

## Fase 9 — Verifikasi email saat register ✅

**Isi:**
- `migrations/0004_email_verification.sql`: kolom `users.email_verified_at timestamptz` (NULL = belum, timestamp = kapan) + tabel `email_verification_tokens` (`token_hash` PK, `user_id` FK `ON DELETE CASCADE`, `created_at`, `expires_at`, `used_at`) + dua index (per user, per `expires_at`).
- Token disimpan **hanya sebagai hash** SHA-256 (`auth.HashToken`), bukan token mentah — bocornya DB tidak bisa di-replay ke API. Tanpa salt/stretching: masukannya sudah 256 bit acak, jadi tidak ada yang bisa di-brute-force.
- `auth.NewVerificationToken`: 32 byte random (base64url) — entropi sama dengan token sesi, tidak pernah diturunkan dari data user.
- **Backfill akun lama ada di file migrasi yang sama**: `UPDATE users SET email_verified_at = now() WHERE email_verified_at IS NULL`. Harus satu file dengan `ALTER`, karena goose membungkus satu file dalam satu transaksi; kalau dipisah ke migrasi berikutnya, akun baru yang belum verifikasi ikut ter-stamp verified. Akun yang lahir sebelum kontrak ini tidak boleh mendadak terkunci dari publish/draft.
- `internal/email/stub.go` + `internal/service/email.go`: interface `VerificationSender` (dideklarasikan di sisi konsumen, seperti `Drafter`) menerima **link jadi**, bukan token, sehingga pengirim tidak perlu tahu cara menyusun link. Stub hanya menulis link ke log — tanpa jaringan, tanpa kredensial.
- `internal/service/auth.go`: `VerificationTTL` 24 jam; `issueVerification` (mint token → simpan hash → kirim link) dipakai bersama `Register` dan `ResendVerification` supaya keduanya menghasilkan token & link yang sama bentuknya.
- **Register tidak gagal kalau email gagal terkirim** (best effort, cuma di-log): akun + sesi sudah commit, jadi mengembalikan error akan bilang "register gagal" padahal akun ada — dan retry berikutnya justru menjawab `email_taken`. User bisa minta link baru. Sebaliknya `ResendVerification` **mengembalikan** error kirim: tidak ada yang irreversible, dan diam akan membuat user menunggu email yang tak datang.
- `VerifyEmail` idempoten: akun yang sudah verified → sukses, jadi double click atau scanner email yang sudah memakai token tidak jadi error membingungkan. Cek "sudah verified" dilakukan **sebelum** cek expiry/used, karena setelah akun verified link sudah selesai tugasnya. Satu error `ErrInvalidToken` untuk token tak dikenal / kedaluwarsa / sudah dipakai (token tak tertebak, jadi membedakan ketiganya tidak memberi apa pun).
- `ResendVerification` menghapus token pending dulu, jadi hanya link terbaru yang hidup — resend tidak bisa dipakai memperpanjang umur link lama.
- `internal/http/middleware/session.go`: `RequireVerified()` → `403 email_not_verified` kalau sesi valid tapi email belum terbukti. **Gate lunak**, hanya di endpoint yang berbiaya/menerbitkan konten: `POST /businesses/:id/publish` dan `POST /ai/draft-profile`. Register, login, edit draft, bookmark, dan upload media tetap jalan tanpa verifikasi — alur daftar tidak memaksa mampir ke inbox.
- **Link menunjuk ke frontend, bukan API**: `FRONTEND_BASE_URL/verify-email?token=...`; halaman frontend yang mem-POST token ke API. Disengaja: scanner email men-prefetch URL GET, jadi verifikasi **tidak boleh** terjadi di GET.
- `internal/config/config.go`: `EMAIL_PROVIDER` (allowlist `EmailProviders`, default `stub`; nilai asing ditolak saat start via `ErrUnknownEmailProvider` — sama alasannya dengan `AI_PROVIDER`, typo tidak boleh diam-diam jatuh ke stub) dan `FRONTEND_BASE_URL` (default `http://localhost:3000`), plus tiga limit baru. `cmd/api` memperingatkan saat boot kalau `EMAIL_PROVIDER=stub && APP_ENV=production` — mail hanya masuk log, user tidak akan pernah menerima.
- Rate limit (mesin fase 7/8 dipakai ulang, tanpa duplikasi): `verify-email` cuma **valve global** — kuncinya token, dan token valid berhasil di percobaan pertama, jadi bucket per-token tidak menambah apa pun yang tak bisa dilewati dengan mengubah tebakan; valve inilah yang benar-benar membatasi tebakan. `resend` **per akun + valve global**, karena tiap panggilan mengirim satu email ke alamat nyata. Middleware baru `UserKey` (kunci = user ID) untuk endpoint ber-sesi yang pesan `429`-nya bukan pesan draft.

**Endpoint aktif:**

| Method | Path | Respons |
|---|---|---|
| POST | `/api/v1/auth/verify-email` | 200 `{"status":"ok"}`; token tak valid/kedaluwarsa/sudah dipakai → 400 `invalid_token`; body rusak → 400 `invalid_body`; `429 rate_limited` kalau valve global habis |
| POST | `/api/v1/auth/resend-verification` | 200 `{"status":"ok"}`; sudah verified → 409 `email_already_verified`; tanpa sesi → 401; `429 rate_limited` kalau kuota akun/global habis |

`verify-email` **tanpa sesi** (link dibuka dari klien email, yang tak punya sesi) — token di body itulah kredensialnya. `resend-verification` wajib sesi: belum ada alamat untuk dijadikan kunci sebelum terautentikasi. Urutan limiter `resend` = global dulu, baru per-akun, dengan alasan memori yang sama seperti fase 7/8 (bucket hanya dialokasikan untuk request yang lolos valve).

**Config (`internal/config/config.go`):**

| Variabel | Default | Jendela (hardcode `cmd/api`) |
|---|---|---|
| `EMAIL_PROVIDER` | `stub` | — |
| `FRONTEND_BASE_URL` | `http://localhost:3000` | — |
| `AUTH_VERIFY_GLOBAL_LIMIT_PER_HOUR` | 300 | 1 jam |
| `AUTH_RESEND_LIMIT_PER_HOUR` | 3 | 1 jam |
| `AUTH_RESEND_GLOBAL_LIMIT_PER_HOUR` | 100 | 1 jam |

Respons `User` kini punya field `emailVerified` (boolean, bukan timestamp — frontend cuma butuh ya/tidak), dinamai begitu supaya tidak tertukar dengan badge `verified` milik business.

**Verifikasi:** 2 test auth (token 32 byte & unik, `HashToken` deterministik + tidak pernah mengembalikan token mentah) + 3 test email stub (link + penerima masuk log, `ctx` yang sudah dibatalkan tidak melaporkan sukses, `NewStub` siap pakai) + 5 test config (default & override `EMAIL_PROVIDER`, penolakan nilai asing, default & override `FRONTEND_BASE_URL`) + 12 kasus baru di `TestLoadRejectsInvalidAuthLimits` (penolakan `abc`/`0`/`-5`/`1.5` untuk 3 variabel verifikasi) + 6 test middleware (gate `RequireVerified` tolak unverified / lolos verified / 401 tanpa sesi, gate jalan **sebelum** limiter AI sehingga request unverified tidak membakar kuota, `UserKey` mengembalikan ID akun / tanpa user) + 6 test handler (200, 400 `invalid_token`, 400 body rusak, 401, 409 `email_already_verified`, 200) + 11 test service (register mengirim link, register tetap sukses saat kirim gagal, verify menandai verified, idempoten, token tak dikenal / kedaluwarsa / sudah dipakai, resend mengganti token pending, resend tolak akun verified, user tak dikenal, resend mengembalikan error kirim) + 1 integration test ke Postgres asli (lookup by hash, consume, `UPDATE` ter-guard, resend mematikan token lama, idempoten). Semua test fase 1–8 tetap hijau.

**Catatan:** `EMAIL_PROVIDER` baru punya `stub` — mengirim email sungguhan = implement `service.VerificationSender` lalu tambah satu nilai di `config.EmailProviders` + satu `case` di `cmd/api/main.go`; handler, service, dan test tidak perlu berubah. Sampai provider asli dipasang, verifikasi email di production **tidak berfungsi** (link cuma masuk log) — itulah alasan peringatan saat boot. *(Peringatan itu diganti penolakan boot di fase 11; provider aslinya `internal/email/resend.go`.)*

> **Pelajaran (ketahuan 2026-09-30, diperbaiki di commit `c44635f`):** `RequireVerified` dipasang ke endpoint yang **sudah ada**, dan `docs/api.md` ikut diperbarui — tapi `docs/manual-test.md` tidak. Selama fase 9 sampai fase 10, runbook itu mendokumentasikan `200` untuk `publish` (§4 #7), draf AI (§7), dan `publish` production (§10.3 #9) yang **tidak mungkin tercapai**: tanpa verifikasi semuanya balas `403 email_not_verified`. Lebih buruk, runbook-nya tidak punya langkah verifikasi sama sekali — padahal `EMAIL_PROVIDER=stub` berarti token hanya ada di log, jadi pembaca tidak punya jalan memenuhi prasyarat barunya. Dua endpoint fase ini (`verify-email`, `resend-verification`) bahkan **nol penyebutan** di runbook. Jebakan turunannya: karena gate jalan **sebelum** handler, langkah yang seharusnya `400` (body rusak, narasi terlalu pendek) ikut jadi `403` — jadi "semua baris balas 403" terlihat seperti bug validasi, bukan gate.
>
> **Aturan yang diambil:** menambah gate ke endpoint lama bukan sekadar perubahan kode + `api.md`. Runbook manual diperbarui di commit yang sama, termasuk cara memenuhi prasyarat barunya. `api.md` saja tidak cukup — ia mendokumentasikan kontrak, bukan urutan langkah, jadi gate yang benar di `api.md` tetap meninggalkan runbook yang tidak bisa dijalankan.

---

## Fase 10 — Hapus profil (arsip) + kelola akun ✅

**Isi:**
- `migrations/0005_archive_and_account_deletion.sql`: `status` menerima `'archived'`, dan FK `businesses.owner_user_id` berubah dari `ON DELETE SET NULL` menjadi `ON DELETE CASCADE`. Keduanya `DROP CONSTRAINT IF EXISTS` + `ADD CONSTRAINT` supaya idempoten; nama constraint aslinya dicek dulu lewat `\d businesses` (bukan ditebak dari konvensi Postgres).
- `domain.StatusArchived`. `domain/user.go` dapat tiga tipe params baru — `UpdateProfileParams`, `ChangePasswordParams`, `DeleteAccountParams` — beserta `Validate()` yang memakai `invalid()`/`ValidationError` yang sudah ada, jadi pesannya Bahasa Indonesia dan ter-map ke `400 validation_failed` tanpa kode error baru.
- **Arsip, bukan hapus baris.** `BusinessService.Archive` memuat baris lewat `ownedRow`, set `Status = StatusArchived`, lalu menulis ulang dengan `UpdateBusiness` — query yang sama yang dipakai `Publish`, karena `UpdateBusiness` sudah menerima `status` sebagai parameter. Tidak ada query hapus bisnis baru.
- **`ownedRow` menolak arsip sebelum cek kepemilikan.** Urutannya load-bearing: kalau cek pemilik lebih dulu, orang asing yang menebak UUID profil terarsip akan dapat `403` sementara UUID tak dikenal memberi `404` — selisih itu mengonfirmasi barisnya ada. Efek sampingnya diinginkan: `Update` dan `Publish` pada profil terarsip sama-sama `404`, jadi `Publish` bukan jalan pintas membatalkan arsip.
- **Query baca publik tidak berubah.** `ListPublishedBusinessIDs`, `CountPublishedBusinesses`, `GetPublishedBusinessBySlug`, dan `ListBookmarks` semuanya sudah memfilter `status = 'published'`, jadi profil terarsip hilang dari list, detail, dan bookmark tanpa satu pun perubahan SQL. Yang perlu diubah hanya dua query milik pemilik: `ListBusinessesByOwner` dan `CountBusinessesByOwner` mendapat `AND status <> 'archived'`, supaya profil yang sudah "dihapus" tidak muncul lagi di dashboard.
- **Hapus akun = satu `DELETE`.** `DeleteUser` cukup satu baris karena seluruh jejaknya bergantung pada foreign key: `sessions`, `email_verification_tokens`, dan `bookmarks.user_id` sudah `CASCADE`; setelah migrasi ini `businesses.owner_user_id` juga, dan dari situ `business_milestones`, `bmc_entries`, serta bookmark milik **user lain** pada profil tersebut ikut terhapus. Karena itu service auth tidak butuh `Transactor` (yang saat ini bertipe `BusinessRepository`).
- **`DELETE /auth/me` mewajibkan kata sandi di body.** Ini aksi destruktif dan tidak bisa dibatalkan; tanpa re-autentikasi, satu cookie yang dicuri sudah cukup menghancurkan akun. Cookie baru dihapus setelah akun benar-benar hilang, jadi kata sandi yang salah meninggalkan sesi apa adanya — ada testnya.
- **Ganti kata sandi = logout perangkat lain.** `DeleteOtherSessions` menghapus semua sesi akun **kecuali** token pengirim request. Sesi yang mengganti tetap hidup (kalau tidak, request itu sendiri yang jadi terlihat gagal), sementara perangkat lain harus login ulang dengan sandi baru. Sandi baru yang sama dengan yang lama ditolak `400` — butuh verifikasi argon2 kedua, tapi percobaan itu dibatasi limiter.
- **`PATCH /auth/me` hanya mengubah `name`.** `role` tidak boleh diubah sendiri karena itu field kepercayaan (eskalasi ke `mitra`), dan `email` tidak boleh karena ia identitas login sekaligus kolom `UNIQUE` — menggantinya butuh alur verifikasi alamat baru tersendiri.
- `internal/service/auth.go`: `requirePassword` dipakai bersama `ChangePassword` dan `DeleteAccount` — load akun, `s.verify` terhadap hash tersimpan, salah → `domain.ErrInvalidCredentials`, akun tak ada → `ErrUnauthenticated`.
- **Rate limit endpoint ganti sandi.** Endpoint ini memverifikasi sandi lama, jadi ia adalah oracle tebak-sandi bagi pemegang sesi, sekaligus sumber kerja argon2id ganda. Dibatasi per akun + valve global, mengikuti pola fase 8 (valve **dulu**, baru per-akun, dengan alasan pertumbuhan map bucket yang sama).

**Endpoint aktif:**

| Method | Path | Respons |
|---|---|---|
| DELETE | `/api/v1/businesses/:id` | 200 `{"status":"ok"}` — arsip; `403 forbidden` bukan pemilik, `404 not_found` id tak ada / sudah terarsip, `400 invalid_parameter` id bukan uuid |
| PATCH | `/api/v1/auth/me` | 200 `User` terbaru; `400 validation_failed` nama kosong / > 100 karakter |
| DELETE | `/api/v1/auth/me` | 200 `{"status":"ok"}` + cookie dihapus; `401 invalid_credentials` sandi salah (cookie **tidak** dihapus) |
| POST | `/api/v1/auth/change-password` | 200 `{"status":"ok"}`; `401 invalid_credentials` sandi lama salah; `400 validation_failed` sandi baru < 8 / > 128 / sama dengan yang lama; `429 rate_limited` |

Keempatnya wajib login. Tidak ada yang memakai gate `RequireVerified`: arsip justru menghilangkan konten dari publik, bukan menerbitkannya.

**Config (`internal/config/config.go`):**

| Variabel | Default | Jendela (hardcode `cmd/api`) |
|---|---|---|
| `AUTH_PASSWORD_LIMIT_PER_HOUR` | 5 | 1 jam |
| `AUTH_PASSWORD_GLOBAL_LIMIT_PER_HOUR` | 100 | 1 jam |

**Verifikasi:** 3 test domain baru / 9 kasus (`Validate` ketiga params: trim, kosong, batas 100 karakter, sandi terlalu pendek/panjang) + 9 test service auth (nama berubah dan tersimpan, `role`/`email` tidak tersentuh, user tak dikenal, sandi lama salah tidak mengubah apa pun, sandi baru = lama ditolak, sesi pengirim bertahan sementara sesi lain terhapus, login pakai sandi baru berhasil dan sandi lama gagal, hapus akun menghilangkan user, sandi salah tidak menghapus) + 3 test service bisnis (`Archive` menyimpan `status` arsip dan membuat `Update`/`Publish`/`Archive` kedua `404`, ownership `403`/`400`/`404`, profil tanpa pemilik `403`) + 13 test handler (9 auth: status, kode error, token sesi diteruskan ke service, cookie dibersihkan saat sukses dan **tidak** dibersihkan saat sandi salah; 4 bisnis: 401, 200 + userID/id diteruskan, tabel mapping `404`/`403`/`400`, error tak terduga `500`) + 2 test config yang diperluas (default dan override dua variabel baru, plus masuk ke tabel penolakan `abc`/`0`/`-5`/`1.5`) + 2 integration test ke Postgres asli: arsip menghilangkan profil dari list publik, detail, dan dashboard sementara barisnya masih ada di DB (dibuktikan dengan `count(*)`), dan hapus akun mengosongkan enam tabel sekaligus (users, sessions, bookmarks, businesses, business_milestones, bmc_entries). Semua test fase 1–9 tetap hijau; `sqlc generate` tidak menghasilkan drift.

**Catatan:** tidak ada endpoint untuk **membatalkan** arsip, dan itu memang tidak diminta — `Publish` dan `PATCH` pada profil terarsip sama-sama `404`, jadi satu-satunya jalan pulih adalah akses DB langsung. Slug juga tidak dilepas saat arsip (kolomnya tetap `UNIQUE`), jadi membuat profil baru dengan nama sama akan mendapat sufiks `-2`. Kalau salah satu dari keduanya perlu diubah, itu endpoint/migrasi baru, bukan penyesuaian di fase ini.

**Ditunda (keputusan sadar):** alur **lupa / reset kata sandi**. Alurnya butuh mengirim email, sedangkan `EMAIL_PROVIDER` masih `stub` — link hanya masuk log, jadi di production fiturnya akan terlihat ada tapi tidak berfungsi. Dikerjakan setelah provider email asli terpasang. *(Provider asli terpasang di fase 11; penghalangnya sekarang alur reset itu sendiri, bukan pengiriman email.)*

---

## Fase 11 — Provider email asli (Resend) ✅

**Isi:**
- `internal/email/resend.go`: tipe `Resend` + `NewResend(apiKey, from)` + `SendVerification`. Meniru `internal/ai/gemini.go` hampir baris per baris — konfigurasi lewat parameter konstruktor, `baseURL` sebagai field (supaya test bisa mengarahkan ke `httptest`), `*http.Client` dengan timeout konstanta paket. **Tanpa dependensi baru**: hanya `net/http`.
- **Kirim lewat API HTTPS, bukan SMTP.** Railway memblokir SMTP keluar kecuali plan Pro, dan Resend merekomendasikan jalur HTTPS di sana. Endpoint: `POST https://api.resend.com/emails`, key di header `Authorization: Bearer`, body `{from, to[], subject, html, text}`.
- **Key di header, bukan query string** — supaya tidak bisa muncul di URL yang dicetak transport error. Body error dibaca terbatas untuk membuang koneksi tapi **tidak pernah** masuk error yang dikembalikan; log hanya membawa `status` + enum `name` Resend (`restricted_api_key`, `daily_quota_exceeded`, …). **Link, token, dan alamat penerima tidak pernah di-log** — berbeda dari stub yang justru menulis link (karena itu memang satu-satunya cara memakai stub). Aturan ini dikunci test.
- **`domain.ErrEmailUnavailable`** (baru, di `internal/domain/user.go`). `issueVerification` men-collapse setiap kegagalan provider jadi satu sentinel yang bisa di-retry — `fmt.Errorf("send verification email: %w: %w", domain.ErrEmailUnavailable, err)` — persis pola `ErrAIUnavailable`. Penyebab aslinya tetap ikut lewat `%w` kedua supaya log bisa membedakan kuota habis dari gangguan jaringan.
- Handler auth memetakannya ke `503 email_unavailable` (case baru di `ResendVerification`, sebelum `case err != nil`). `writeDomainError` di `business.go` tidak disentuh: jalur auth punya switch sendiri.
- **Register tetap menelan kegagalan kirim** (hanya di-log) — perilakunya tidak berubah, akun tetap dibuat. `ResendVerification` yang mengembalikannya, jadi sekarang `503`, bukan `500`.
- **`config.RequireEmailSender()`** (baru): tolak `EMAIL_PROVIDER=resend` tanpa `RESEND_API_KEY`, dan tolak `EMAIL_PROVIDER=stub` saat `APP_ENV=production`. **Hanya `cmd/api` yang memanggilnya** — sama seperti `RequireGeminiKey`. Kalau pengecekan ini ditaruh di `Load()`, langkah `/app/migrate` di `docker-entrypoint.sh` ikut gagal dan seluruh deploy rusak.
- Peringatan `slog.Warn` "stub in production" dihapus: diganti penolakan boot yang lebih keras.
- `EMAIL_PROVIDER` kini `stub | resend`; `RESEND_API_KEY` dan `RESEND_FROM` dibaca `Load()` (di-trim, **tidak** ditolak saat kosong — penolakan ada di `RequireEmailSender`). `RESEND_FROM` kosong berarti default `onboarding@resend.dev` di paket `email`, pola `GEMINI_MODEL`.
- Teks email (subjek + HTML + teks polos) hidup sebagai helper unexported di `resend.go`. Link di-`html.EscapeString` karena masuk ke `href` (bagian token aman/base64url, tapi base URL dikonfigurasi operator). Copy sengaja **tidak menyebut masa berlaku**: TTL ada di `service.VerificationTTL`, dan paket `email` tidak boleh mengimpor `service` hanya untuk mengutip angkanya.

**Config (`internal/config/config.go`):**

| Variabel | Default | Catatan |
|---|---|---|
| `EMAIL_PROVIDER` | `stub` | `resend` (butuh key) atau `stub` (link ke log). `stub` + production = gagal start |
| `RESEND_API_KEY` | — | Wajib saat `EMAIL_PROVIDER=resend` (`ErrMissingResendAPIKey`) |
| `RESEND_FROM` | `onboarding@resend.dev` | Default ada di paket `email`, bukan di config |

**Batasan yang harus diketahui:** `onboarding@resend.dev` hanya bisa mengirim ke email **pemilik akun Resend**; penerima lain ditolak `403 restricted_api_key` → diteruskan sebagai `503 email_unavailable`. Jadi fase ini membuat alur bisa **dibuktikan jalan di production** (kirim ke email sendiri), tapi pengguna umum baru menerima email setelah **domain diverifikasi di Resend** dan `RESEND_FROM` diarahkan ke domain itu. Verifikasi domain itu konfigurasi dashboard, bukan kode — dicatat sebagai gap di backlog.

**Urutan deploy jadi penting:** karena `stub` di production sekarang fatal, env var (`EMAIL_PROVIDER=resend`, `RESEND_API_KEY`) harus dipasang di Railway **sebelum** `railway up`, atau deploy berikutnya gagal boot.

**Verifikasi:** 10 test `internal/email/resend_test.go` (POST yang benar: method/path/header/body ter-decode + link di HTML **dan** text; escaping `&` di HTML tapi tidak di teks; non-200 menyembunyikan body rahasia dan token; transport error menyembunyikan key; context dibatalkan tidak memanggil API; 200 rusak — bukan JSON / `{}` / id kosong — ditolak; **log kegagalan tidak memuat link/token/penerima tapi memuat enum**; default `from` dan trim; tabel `resendErrorName`; assertion compile-time interface) + 4 test config baru (Load menerima `resend` tanpa key, trim `RESEND_API_KEY`/`RESEND_FROM`, `RESEND_FROM` kosong tetap kosong, tabel `RequireEmailSender` 6 kasus) + `TestResendVerificationReturnsSendError` diperluas (`errors.Is(err, domain.ErrEmailUnavailable)` **dan** pesan asli tetap terbawa) + 1 test handler baru (`503 email_unavailable`). `TestLoadRejectsUnknownEmailProvider` (`smtp`) tetap tidak berubah. Semua test fase 1–10 tetap hijau.

**Pelajaran (fase 9 → 11):** pelajaran fase 9 — "runbook manual diperbarui di commit yang sama" — diterapkan di sini: `docs/manual-test.md` §3 dan §10.3 yang menyuruh mengambil token dari log diperbarui jadi "buka inbox penerima" bersamaan dengan kodenya, bukan menyusul.

**Ditunda (keputusan sadar):** alur **lupa / reset kata sandi** tetap belum ada. Penghalangnya sekarang bukan lagi provider email — provider asli sudah tersedia — melainkan alur itu sendiri (endpoint minta + endpoint setel ulang dengan token sekali-pakai).

---

## Pekerjaan di luar fase (backlog / known gaps)

| Item | Status |
|---|---|
| Git commit | ✔ **selesai** — `backend/` + `docs/` sudah di-commit dan di-push ke `origin/backend`. Sisa: edit `frontend/next.config.ts` (scope frontend) |
| Provider AI asli | ✔ **selesai** — Google Gemini (`AI_PROVIDER=gemini`, default) dengan structured output; stub tetap ada untuk run tanpa kredensial |
| Rate limiting endpoint AI | ✔ **selesai** — fase 7: token bucket per akun, `AI_DRAFT_LIMIT_PER_HOUR` (default 20) → `429 rate_limited` + `Retry-After` |
| Klaim/assign pemilik profil seed | ❌ belum — dibutuhkan supaya data demo bisa diedit via API |
| Hapus profil bisnis | ✔ **selesai** — fase 10: `DELETE /businesses/:id` **mengarsipkan** (status `archived`), bukan menghapus baris. Query publik sudah memfilter `published`, jadi tidak ada perubahan SQL di sana; yang ditambah `AND status <> 'archived'` hanya dua query dashboard pemilik. Tidak ada endpoint pembatalan arsip |
| Edit & hapus akun | ✔ **selesai** — fase 10: `PATCH /auth/me` (nama saja; `role`/`email` sengaja tidak bisa), `POST /auth/change-password` (verifikasi sandi lama, logout semua perangkat lain, rate limit per akun + valve), `DELETE /auth/me` (wajib sandi di body, cascade ke sesi/bookmark/profil miliknya) |
| Lupa / reset kata sandi | ❌ **ditunda** — provider email asli sudah ada (fase 11), jadi penghalangnya sekarang alur reset itu sendiri (endpoint minta + endpoint setel ulang dengan token sekali-pakai) |
| Rate limiting login/register | ✔ **selesai** — fase 8: kunci **email** (bukan IP), dua katup (global lalu per-email) per endpoint → `429 rate_limited` + `Retry-After`. Alasan tidak pakai IP: `SetTrustedProxies(nil)` membuat `ClientIP()` berisi IP edge Railway yang sama untuk semua orang, dan `X-Forwarded-For` Railway tidak bisa dipercaya (jawaban resmi saling bertentangan). Kunci email menutup brute-force per akun; katup global menutup banjir email acak. Ditambah perbaikan timing oracle login |
| Verifikasi email saat register | ✔ **selesai** — fase 9: kolom `users.email_verified_at` + tabel token (hash SHA-256, TTL 24 jam), gate lunak `RequireVerified` hanya di `publish` & `ai/draft-profile` → `403 email_not_verified`, rate limit verify (valve global) & resend (per akun + global) |
| Provider email asli | ✔ **selesai** — fase 11: `EMAIL_PROVIDER=resend` mengirim lewat API HTTPS Resend (`internal/email/resend.go`), kegagalan kirim → `503 email_unavailable`, `stub` + production menolak start. **Sisa:** verifikasi domain di Resend — selama `RESEND_FROM` masih `onboarding@resend.dev`, email hanya sampai ke pemilik akun Resend |
| Rotasi/refresh token sesi | ❌ belum — sesi statis 30 hari |
| Integrasi test ke DB asli | ✔ **selesai** — `internal/service/integration_test.go` (build tag `integration`): lifecycle tulis→publish, slug vs seed, register/login/sesi (23505 asli), bookmark, seed ter-baca, arsip hilang dari semua jalur baca, hapus akun meng-CASCADE enam tabel. Auto-skip kalau Postgres mati, auto-bersih tiap baris yang dibuat |
| CI (lint + test otomatis) | ✔ **selesai** — `.github/workflows/backend.yml`: job `test` (gofmt gate, vet, build, unit test, race), `integration` (Postgres 16 + migrate + seed), `sqlc` (drift check, sqlc 1.31.1 dipin) |
| Struktur logging | ✔ **selesai** — `log/slog` terstruktur lewat `internal/logging` (JSON saat production, text selain itu), `LOG_LEVEL` divalidasi fail-fast, access log + `X-Request-ID` menggantikan `gin.Logger` |
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

**Race detector** — host tidak punya gcc, jadi `-race` harus lewat container (dari Git Bash):

```bash
cd backend
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/src" -w /src golang:1.27 go test -race ./...
```

Detail kontrak tiap endpoint (body, status, kode error): **`docs/api.md`**.
