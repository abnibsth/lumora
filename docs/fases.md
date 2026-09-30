# Fase-fase Backend LUMORA

Status: **fase 1–8 selesai**.
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

Total tes saat ini: **175 tes utama / 275 kasus** (termasuk subtest), semua PASS — `gofmt` bersih, `go vet` bersih, `go test -race` bersih (dijalankan di container `golang:1.27` karena host tidak punya gcc). Migrasi DB: **version 3**.
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

## Pekerjaan di luar fase (backlog / known gaps)

| Item | Status |
|---|---|
| Git commit | ✔ **selesai** — `backend/` + `docs/` sudah di-commit dan di-push ke `origin/backend`. Sisa: edit `frontend/next.config.ts` (scope frontend) |
| Provider AI asli | ✔ **selesai** — Google Gemini (`AI_PROVIDER=gemini`, default) dengan structured output; stub tetap ada untuk run tanpa kredensial |
| Rate limiting endpoint AI | ✔ **selesai** — fase 7: token bucket per akun, `AI_DRAFT_LIMIT_PER_HOUR` (default 20) → `429 rate_limited` + `Retry-After` |
| Klaim/assign pemilik profil seed | ❌ belum — dibutuhkan supaya data demo bisa diedit via API |
| Rate limiting login/register | ✔ **selesai** — fase 8: kunci **email** (bukan IP), dua katup (global lalu per-email) per endpoint → `429 rate_limited` + `Retry-After`. Alasan tidak pakai IP: `SetTrustedProxies(nil)` membuat `ClientIP()` berisi IP edge Railway yang sama untuk semua orang, dan `X-Forwarded-For` Railway tidak bisa dipercaya (jawaban resmi saling bertentangan). Kunci email menutup brute-force per akun; katup global menutup banjir email acak. Ditambah perbaikan timing oracle login |
| Verifikasi email saat register | ❌ belum — register gratis & instan, jadi pendaftaran massal tetap mungkin: katup global register (30/jam) dan anggaran AI global (`AI_DRAFT_GLOBAL_LIMIT_PER_HOUR`, 200/jam) **membatasi biaya**-nya tapi tidak menutup spam profil maupun multi-akun. Butuh kolom status di `users` + tabel token + pengiriman email |
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

**Race detector** — host tidak punya gcc, jadi `-race` harus lewat container (dari Git Bash):

```bash
cd backend
MSYS_NO_PATHCONV=1 docker run --rm -v "$(pwd -W):/src" -w /src golang:1.27 go test -race ./...
```

Detail kontrak tiap endpoint (body, status, kode error): **`docs/api.md`**.
