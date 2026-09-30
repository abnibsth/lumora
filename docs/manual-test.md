# Panduan test manual (seluruh endpoint)

Runbook cek semua endpoint API lewat terminal — dari read publik sampai upload media.
Cocok dipakai untuk cross-check hasil `go test` atau sebelum serah-terima ke frontend.

Semua perintah dijalankan di **PowerShell** (Windows), pakai `curl.exe`. Bagian 1–9 untuk stack lokal; versi production (Railway) ada di **Bagian 10** — bedanya cukup banyak (cookie `Secure`, AI berbayar, DB production sudah ter-seed 9 profil), jadi jangan campur.

Endpoint otomatis (unit + integration test):

```powershell
cd backend
go test ./... -count=1                                   # tanpa DB
go test -tags integration ./internal/service -run Integration -v   # ke Postgres asli
```

---

## Aturan main di PowerShell

- Pakai **`curl.exe`**, bukan `curl` (di PowerShell, `curl` = `Invoke-WebRequest`).
- **JSON body dikirim via file** (`-d "@file.json"`). PS 5.1 memakan tanda kutip kalau menulis `-d '{...}'` → error palsu `invalid_body`.
- **Cookie sesi**: `-c file.txt` = simpan cookie, `-b file.txt` = kirim cookie.
- Lihat kode status: tambah `-w "%{http_code}"` di akhir perintah.

---

## 1. Persiapan

```powershell
cd D:\alfian\kuliah\semester7\Ngoding\lumora\backend
docker compose up -d --build      # full stack: postgres → migrate → seed → api (:8080), urut otomatis
curl.exe http://localhost:8080/healthz      # {"status":"ok"} = siap
```

> **Bagian 7 (AI) butuh provider.** Tanpa konfigurasi apa pun, `docker compose` jalan sebagai `AI_PROVIDER=stub` (offline, tanpa kredensial). Untuk Gemini: set `AI_PROVIDER=gemini` + `GEMINI_API_KEY` di `backend/.env` (atau ekspor `$env:AI_PROVIDER="gemini"` dan `$env:GEMINI_API_KEY="..."`) — compose membaca keduanya, sama seperti `go run ./cmd/api`.
>
> **Bagian 3 (verifikasi email) mengikuti `EMAIL_PROVIDER`.** Default stack lokal adalah `stub`, yang menulis link ke log. Set `EMAIL_PROVIDER=resend` + `RESEND_API_KEY` kalau mau mencoba pengiriman sungguhan (lihat §3 untuk batasan `RESEND_FROM`).
>
> Kalau `docker compose ps` menunjukkan `api` restart terus, cek `docker compose logs api`: dengan `AI_PROVIDER=gemini` tanpa key, app memang menolak start (pesan `GEMINI_API_KEY wajib diisi`), bukan diam-diam membalas `503`. Hal yang sama berlaku untuk `EMAIL_PROVIDER=resend` tanpa `RESEND_API_KEY` (`RESEND_API_KEY wajib diisi`), dan untuk `EMAIL_PROVIDER=stub` dengan `APP_ENV=production`.

```powershell
# --- file bantuan (sekali bikin, dipakai bagian 2-5) ---
$bodyDir = "$env:TEMP\lumora"
New-Item -ItemType Directory $bodyDir -Force | Out-Null

@'
{"name":"Uji Manual","email":"uji@example.com","password":"rahasia123"}
'@ | Set-Content "$bodyDir\reg.json" -Encoding ascii

@'
{"email":"uji@example.com","password":"salah"}
'@ | Set-Content "$bodyDir\login-salah.json" -Encoding ascii

@'
{"email":"uji@example.com","password":"rahasia123"}
'@ | Set-Content "$bodyDir\login.json" -Encoding ascii

# create lengkap (langsung layak publish)
@'
{"name":"Uji Manual Test","category":"F&B","location":"Jakarta",
 "description":"Profil uji manual.","story":"Cerita singkat uji manual.",
 "foundedYear":2020,
 "owner":{"name":"Uji","role":"Founder","bio":"Pemilik uji."}}
'@ | Set-Content "$bodyDir\bisnis.json" -Encoding ascii

# create sengaja kurang (wajib ditolak)
@'
{"name":"Uji Kurang","category":"F&B"}
'@ | Set-Content "$bodyDir\bisnis-kurang.json" -Encoding ascii

@'
{"description":"Deskripsi sudah dilengkapi lewat PATCH."}
'@ | Set-Content "$bodyDir\patch.json" -Encoding ascii

$api = "http://localhost:8080/api/v1"
```

---

## 2. Read publik (tanpa cookie)

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe "$api/businesses"` | 200, `total`=9, tiap item punya `milestones` & `bmc` (tidak `null`) |
| 2 | `curl.exe "$api/businesses?page=2&limit=5"` | 4 item, tidak tumpang-tindih dengan halaman 1 |
| 3 | `curl.exe "$api/businesses?q=kopi"` | `total`≥1, semua hasil mengandung "kopi" |
| 4 | `curl.exe "$api/businesses?category=F%26B"` | hanya kategori F&B (`%26` = `&`) |
| 5 | `curl.exe "$api/businesses/kopi-ruang-senja"` | 200, `owner.name` terisi, `milestones`≥1 |
| 6 | `curl.exe "$api/businesses/tidak-ada"` | **404** `{"error":{"code":"not_found",...}}` |
| 7 | `curl.exe "$api/businesses?page=abc"` | 400 `invalid_parameter` |
| 8 | `curl.exe "$api/businesses?category=Ngaco"` | 400 `invalid_category` |

---

## 3. Auth

```powershell
$c = "$env:TEMP\lumora\cookies.txt"
```

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe -H "Content-Type: application/json" -d "@$bodyDir\reg.json" "$api/auth/register"` | **201** + `Set-Cookie: lumora_session=...; HttpOnly; SameSite=Lax` |
| 2 | ulangi perintah 1 | **409** `email_taken` |
| 3 | `curl.exe -c $c -H "Content-Type: application/json" -d "@$bodyDir\login-salah.json" "$api/auth/login"` | **401** `invalid_credentials` |
| 4 | `curl.exe -c $c -H "Content-Type: application/json" -d "@$bodyDir\login.json" "$api/auth/login"` | **200**, cookie baru tersimpan |
| 5 | `curl.exe -b $c "$api/auth/me"` | 200, email `uji@example.com` |
| 6 | `curl.exe "$api/auth/me"` | 401 (tanpa cookie) |
| 7 | `curl.exe -b $c -X POST "$api/auth/logout"` | 200 `{"status":"ok"}` |
| 8 | `curl.exe -b $c "$api/auth/me"` | 401 — sesi sudah mati |

> Login gagal harus selalu `invalid_credentials` — **jangan** beda antara email tak terdaftar vs password salah (biar tidak jadi indikator akun).

**Verifikasi email — prasyarat §4 #7 (`publish`) dan seluruh §7 (draf AI).**

Kedua endpoint itu digerbangi `RequireVerified`: akun yang belum verifikasi dibalas **`403 email_not_verified`**, bukan `200`. Register **tidak** memverifikasi otomatis — `emailVerified` tetap `false` sampai link-nya diklik. Endpoint lain (edit draft, bookmark, media, arsip) tidak terpengaruh.

Cara mengambil token tergantung `EMAIL_PROVIDER`:

- **`stub`** (default stack lokal) — link hanya ditulis ke log:

```powershell
# token terakhir untuk uji@example.com
$log   = docker compose logs api 2>&1 | Select-String "uji@example.com"
$token = ($log | Select-Object -Last 1) -replace '.*token=([A-Za-z0-9_-]+).*','$1'

"{""token"":""$token""}" | Set-Content "$bodyDir\verify.json" -Encoding ascii
```

- **`resend`** — tautannya sampai ke **inbox** alamat akun, jadi tidak ada link di log. Buka email dari LUMORA, salin nilai `token=…` dari URL-nya, lalu tulis `verify.json` dengan tangan:

```powershell
# ganti <token-dari-email> dengan nilai yang disalin
'{"token":"<token-dari-email>"}' | Set-Content "$bodyDir\verify.json" -Encoding ascii
```

> **Batasan `RESEND_FROM`.** Selama masih default (`onboarding@resend.dev`), Resend **hanya** mengirim ke alamat pemilik akun Resend — penerima lain ditolak `403 restricted_api_key` dan API meneruskannya sebagai `503 email_unavailable`. Jadi untuk mencoba jalur `resend` tanpa domain terverifikasi, daftar dengan alamat pemilik akun Resend itu sendiri.

```powershell
'{"token":"salah"}' | Set-Content "$bodyDir\verify-salah.json" -Encoding ascii
```

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe -H "Content-Type: application/json" -d "@$bodyDir\verify.json" "$api/auth/verify-email"` | **200** `{"status":"ok"}` — tanpa cookie, tokennya sendiri yang jadi kredensial |
| 2 | ulangi perintah 1 | **200** — verifikasi **idempoten**, klik dua kali tetap sukses |
| 3 | `curl.exe -c $c -H "Content-Type: application/json" -d "@$bodyDir\login.json" "$api/auth/login"` lalu `curl.exe -b $c "$api/auth/me"` | **`"emailVerified":true`** |
| 4 | `curl.exe -b $c -X POST "$api/auth/resend-verification"` | **409** `email_already_verified` |
| 5 | `curl.exe -H "Content-Type: application/json" -d "@$bodyDir\verify-salah.json" "$api/auth/verify-email"` | **400** `invalid_token` |

> Perintah 3 perlu login ulang karena langkah 7 di tabel atas sudah logout (`$c` masih ada tapi sesinya mati). Perintah 4 butuh sesi: sebelum terautentikasi tidak ada alamat yang bisa dipakai jadi kunci rate limit — itu sebabnya `resend-verification` wajib login sedangkan `verify-email` tidak.
>
> Kalau memakai `stub` dan `$token` kosong, baris log-nya sudah tergeser keluar jendela `docker compose logs`. Pakai `resend-verification` lalu ambil tokennya **segera**.

**Rate limiting login → 429** (pakai email khusus — kuota dihitung **per email**, jadi jangan pakai `uji@example.com` atau alur di atas ikut terkunci 15 menit):

```powershell
@'
{"email":"brute@example.com","password":"salah"}
'@ | Set-Content "$bodyDir\login-brute.json" -Encoding ascii

# 10 percobaan pertama (default AUTH_LOGIN_LIMIT_PER_15_MIN=10) → semua 401 invalid_credentials
1..10 | ForEach-Object {
  curl.exe -s -o NUL -w "%{http_code} " -H "Content-Type: application/json" -d "@$bodyDir\login-brute.json" "$api/auth/login"
}
# percobaan ke-11 → 429 rate_limited + header Retry-After (tampil via -i)
curl.exe -s -i -H "Content-Type: application/json" -d "@$bodyDir\login-brute.json" "$api/auth/login"
```

→ keluaran loop `401 401 ... 401`, lalu respons terakhir `HTTP/1.1 429` + `Retry-After: <detik>` + body `{"error":{"code":"rate_limited",...}}`.

> Endpoint `register` berperilaku sama (`AUTH_REGISTER_LIMIT_PER_HOUR` default 10, global 30/jam). Register ulang ke email yang sama tetap **memakai** token walau balasannya `409 email_taken` — jadi 10× register ke satu email → yang ke-11 `429`.
>
> Batas per-email bekerja setelah katup **global** (login 300/jam, register 30/jam). Kalau runbook ini diulang berkali-kali dalam satu jam, `429` bisa datang dari katup global, bukan per-email. Reset cepat: restart container `api` (state-nya in-memory, lihat `docs/fases.md`).

**Kelola akun — ganti nama, ganti sandi, hapus akun.**

Pakai akun sekali pakai, **bukan** `uji@example.com` — bagian 4 login ulang dengan akun itu, jadi ia tidak boleh ikut terhapus di sini.

```powershell
$cH = "$env:TEMP\lumora\cookies-hapus.txt"
@'
{"name":"Uji Hapus","email":"uji-hapus@example.com","password":"rahasia123"}
'@ | Set-Content "$bodyDir\reg-hapus.json" -Encoding ascii
@'
{"email":"uji-hapus@example.com","password":"rahasia123"}
'@ | Set-Content "$bodyDir\login-hapus.json" -Encoding ascii
@'
{"email":"uji-hapus@example.com","password":"rahasia456"}
'@ | Set-Content "$bodyDir\login-hapus-baru.json" -Encoding ascii
@'
{"name":"Uji Manual Baru"}
'@ | Set-Content "$bodyDir\patch-me.json" -Encoding ascii
@'
{"currentPassword":"rahasia123","newPassword":"rahasia456"}
'@ | Set-Content "$bodyDir\ganti-sandi.json" -Encoding ascii
@'
{"currentPassword":"rahasia123","newPassword":"rahasia123"}
'@ | Set-Content "$bodyDir\sandi-sama.json" -Encoding ascii

curl.exe -c $cH -H "Content-Type: application/json" -d "@$bodyDir\reg-hapus.json" "$api/auth/register"   # 201
```

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe -b $cH -H "Content-Type: application/json" -d "@$bodyDir\patch-me.json" -X PATCH "$api/auth/me"` | 200, `name` = "Uji Manual Baru" |
| 2 | `curl.exe -b $cH "$api/auth/me"` | 200, `name` benar-benar tersimpan |
| 3 | `curl.exe -b $cH -H "Content-Type: application/json" -d '{"name":"   "}' -X PATCH "$api/auth/me"` | 400 `validation_failed` (nama kosong) |
| 4 | `curl.exe -b $cH -H "Content-Type: application/json" -d "@$bodyDir\sandi-sama.json" -X POST "$api/auth/change-password"` | 400 `validation_failed` — sandi baru = lama |
| 5 | `curl.exe -b $cH -H "Content-Type: application/json" -d '{"currentPassword":"salah","newPassword":"rahasia456"}' -X POST "$api/auth/change-password"` | 401 `invalid_credentials` |
| 6 | `curl.exe -b $cH -H "Content-Type: application/json" -d "@$bodyDir\ganti-sandi.json" -X POST "$api/auth/change-password"` | 200 `{"status":"ok"}` |
| 7 | `curl.exe -b $cH "$api/auth/me"` | **200** — sesi yang mengganti tetap hidup |
| 8 | `curl.exe -H "Content-Type: application/json" -d "@$bodyDir\login-hapus.json" "$api/auth/login"` | **401** — sandi lama sudah tidak berlaku |
| 9 | `curl.exe -c $cH -H "Content-Type: application/json" -d "@$bodyDir\login-hapus-baru.json" "$api/auth/login"` | 200 — sandi baru berlaku |
| 10 | `curl.exe -b $cH -H "Content-Type: application/json" -d '{"password":"salah"}' -X DELETE "$api/auth/me"` | 401 `invalid_credentials` |
| 11 | `curl.exe -b $cH "$api/auth/me"` | **200** — akun masih ada, cookie tidak dihapus |
| 12 | `curl.exe -s -i -b $cH -H "Content-Type: application/json" -d '{"password":"rahasia456"}' -X DELETE "$api/auth/me"` | 200 `{"status":"ok"}` + `Set-Cookie: lumora_session=; Max-Age=0` |
| 13 | `curl.exe -b $cH "$api/auth/me"` | **401** — akun & sesinya sudah hilang |

> Perintah 10–11 adalah intinya: kata sandi yang salah **tidak** menghapus apa pun dan **tidak** menghapus cookie. Cookie baru dibersihkan setelah akun benar-benar terhapus.
>
> Kalau akun ini punya profil bisnis, perintah 12 juga menghapus profilnya (beserta milestones, BMC, dan bookmark orang lain pada profil itu) lewat `ON DELETE CASCADE`. Di runbook ini akunnya belum punya profil, jadi tidak ada yang ikut hilang.

---

## 4. Profil bisnis (tulis)

```powershell
curl.exe -c $c -H "Content-Type: application/json" -d "@$bodyDir\login.json" "$api/auth/login"   # login lagi (sesi habis di bagian 3)
$bizId = (curl.exe -b $c -H "Content-Type: application/json" -d "@$bodyDir\bisnis.json" "$api/businesses" | ConvertFrom-Json).id
```

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe -H "Content-Type: application/json" -d "@$bodyDir\bisnis.json" -X POST "$api/businesses"` (tanpa `-b $c`) | 401 `unauthenticated` |
| 2 | hasil create `$bizId` di atas | **201**, `status="draft"`, `slug="uji-manual-test"` |
| 3 | create dengan `bisnis-kurang.json` (pakai `-b $c`) | 400 `validation_failed`, pesan field pertama yang kosong (mis. "Lokasi wajib diisi.") |
| 4 | `curl.exe "$api/businesses/uji-manual-test"` | **404** — draft tak pernah terbaca publik |
| 5 | `curl.exe "$api/businesses"` | `total` **tetap 9** — draft bocor ke list = BUG |
| 6 | `curl.exe -b $c -H "Content-Type: application/json" -d "@$bodyDir\patch.json" -X PATCH "$api/businesses/$bizId"` | 200, `description` berubah, `slug`/`status` tidak berubah |
| 7 | `curl.exe -b $c -X POST "$api/businesses/$bizId/publish"` | 200, `status="published"`; list jadi `total`=10; perintah 4 kini 200. **Butuh email terverifikasi** (blok verifikasi di §3) — kalau belum, `403 email_not_verified` dan `total` tetap 9 |

**Ownership → 403** (pakai akun kedua, `$bizId` milik akun pertama):

```powershell
$c2 = "$env:TEMP\lumora\cookies2.txt"
@'
{"name":"Uji Dua","email":"uji2@example.com","password":"rahasia123"}
'@ | Set-Content "$bodyDir\reg2.json" -Encoding ascii
@'
{"email":"uji2@example.com","password":"rahasia123"}
'@ | Set-Content "$bodyDir\login2.json" -Encoding ascii

curl.exe -H "Content-Type: application/json" -d "@$bodyDir\reg2.json" "$api/auth/register"       # 201
curl.exe -c $c2 -H "Content-Type: application/json" -d "@$bodyDir\login2.json" "$api/auth/login"  # 200

# verifikasi uji2 juga — tanpa ini baris publish di bawah balas 403 email_not_verified
# (gate RequireVerified jalan SEBELUM handler, jadi bukan 404/403 ownership)
# EMAIL_PROVIDER=stub: token dari log. resend: salin token dari inbox, bukan dari log.
$log2 = docker compose logs api 2>&1 | Select-String "uji2@example.com"
$t2   = ($log2 | Select-Object -Last 1) -replace '.*token=([A-Za-z0-9_-]+).*','$1'
"{""token"":""$t2""}" | Set-Content "$bodyDir\verify2.json" -Encoding ascii
curl.exe -H "Content-Type: application/json" -d "@$bodyDir\verify2.json" "$api/auth/verify-email"   # 200

curl.exe -b $c2 -H "Content-Type: application/json" -d "@$bodyDir\patch.json" -X PATCH "$api/businesses/$bizId"                        # → 403 forbidden (bukan miliknya)
curl.exe -b $c2 -X POST "$api/businesses/00000000-0000-4000-8000-000000000000/publish"                                                 # → 404 not_found (UUID valid, tak ada)
curl.exe -b $c2 -H "Content-Type: application/json" -d "@$bodyDir\patch.json" -X PATCH "$api/businesses/id-tidak-ada"                   # → 400 invalid_parameter (bukan UUID)
curl.exe -b $c2 -X DELETE "$api/businesses/$bizId"                                                                                     # → 403 forbidden (bukan miliknya)
```

**Arsip → profil hilang dari semua jalur baca** (jalankan **setelah** blok ownership di atas, karena arsip tidak bisa dibatalkan):

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe -b $c -X DELETE "$api/businesses/$bizId"` | 200 `{"status":"ok"}` — profil **diarsipkan**, barisnya masih ada di DB |
| 2 | `curl.exe "$api/businesses/uji-manual-test"` | **404** — hilang dari detail publik |
| 3 | `curl.exe "$api/businesses"` | `total` balik ke **9** |
| 4 | `curl.exe -b $c "$api/businesses/mine"` | profil itu **tidak muncul** di dashboard |
| 5 | `curl.exe -b $c -X POST "$api/businesses/$bizId/publish"` | **404** — arsip tidak bisa dibatalkan lewat publish |
| 6 | `curl.exe -b $c -H "Content-Type: application/json" -d "@$bodyDir\patch.json" -X PATCH "$api/businesses/$bizId"` | **404** — PATCH juga menolak profil terarsip |
| 7 | `curl.exe -b $c -X DELETE "$api/businesses/$bizId"` | **404** — sudah terarsip |

> Perintah 5–6 memastikan arsip benar-benar final: satu-satunya jalan pulih adalah mengubah `status` langsung di DB. Baris di bawah membuktikan profilnya masih ada (bukan terhapus) — perhatikan `status='archived'`:
>
> ```powershell
> docker exec lumora-postgres psql -U lumora -d lumora -c "SELECT slug, status FROM businesses WHERE slug = 'uji-manual-test';"
> ```

---

## 5. Bookmark (wajib login)

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe "$api/bookmarks"` | 401 |
| 2 | `curl.exe -b $c "$api/bookmarks"` | 200, `items=[]` (**array kosong, bukan `null`**), `total=0` |
| 3 | `curl.exe -b $c -X POST "$api/bookmarks/kopi-ruang-senja"` | 200 `{"status":"ok"}` |
| 4 | ulangi perintah 3 | 200 lagi (idempoten) |
| 5 | `curl.exe -b $c "$api/bookmarks"` | `total=1`, item **ter-hydrate** (`milestones`/`bmc` terisi) |
| 6 | `curl.exe -b $c -X POST "$api/bookmarks/ngawur"` | 404 — slug tak ada & draft sengaja dibedakan 404 |
| 7 | `curl.exe -b $c -X DELETE "$api/bookmarks/kopi-ruang-senja"` | 200 |
| 8 | ulangi perintah 7 | 200 (idempoten) |
| 9 | `curl.exe -b $c "$api/bookmarks"` | `total=0` |

---

## 6. Upload media (wajib login)

```powershell
# file uji
Add-Type -AssemblyName System.Drawing
$bmp = New-Object System.Drawing.Bitmap 8,8
$bmp.Save("$bodyDir\ok.png", [System.Drawing.Imaging.ImageFormat]::Png)
Set-Content "$bodyDir\teks.txt" "bukan gambar" -Encoding ascii
# PNG valid tapi > 5 MB (header PNG + padding)
$png = [byte[]](0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A) + (New-Object byte[] (6*1024*1024))
[IO.File]::WriteAllBytes("$bodyDir\besar.png", $png)
```

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe -F "file=@$bodyDir\ok.png" "$api/media"` | 401 |
| 2 | `curl.exe -b $c -F "file=@$bodyDir\ok.png" "$api/media"` | 200 `{"url":"/uploads/<uuid>.png"}` |
| 3 | `curl.exe "http://localhost:8080<url hasil 2>"` | 200 `Content-Type: image/png` (publik, tanpa login) |
| 4 | `curl.exe -b $c -F "file=@$bodyDir\teks.txt" "$api/media"` | 400 `validation_failed` — tipe dicek dari **isi byte**; rename `.png` pun tetap ditolak |
| 5 | `curl.exe -b $c -F "file=@$bodyDir\besar.png" "$api/media"` | 400 `validation_failed` (lewat 5 MB) |
| 6 | `curl.exe -b $c -F "gagal=@$bodyDir\ok.png" "$api/media"` | 400 `invalid_body` (field `file` tidak ada) |

> URL hasil upload bisa langsung ditempel ke `coverImage` / `logo` lewat `PATCH /businesses/:id`.

---

## 7. AI draft profil (wajib login + email terverifikasi)

> **Butuh email terverifikasi** (blok di §3). Akun yang belum verifikasi dibalas `403 email_not_verified` di **semua** langkah di bawah — termasuk langkah 4 dan 5 yang seharusnya `400`, karena `RequireVerified` jalan sebelum handler. Jadi kalau seluruh tabel ini balas `403`, yang salah bukan narasinya.

```powershell
Set-Content "$bodyDir\narasi.json" '{"narrative":"Kedai kopi kami di Bandung berdiri sejak 2015 dan sekarang mencari mitra distributor."}' -Encoding ascii
Set-Content "$bodyDir\narasi-pendek.json" '{"narrative":"kopi"}' -Encoding ascii
```

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe -H "Content-Type: application/json" -d "@$bodyDir\narasi.json" -X POST "$api/ai/draft-profile"` | 401 `unauthenticated` |
| 2 | `curl.exe -b $c -H "Content-Type: application/json" -d "@$bodyDir\narasi.json" -X POST "$api/ai/draft-profile"` | 200 — `category` `"F&B"`, `location` `"Bandung"`, `foundedYear` `2015`, `seeking` memuat `"Mitra Distribusi"` |
| 3 | periksa isi respons langkah 2 | **tidak memuat** `revenueLabel` / `growthLabel` / `revenueSeries` — angka finansial tidak pernah dibuat otomatis |
| 4 | `curl.exe -b $c -H "Content-Type: application/json" -d "@$bodyDir\narasi-pendek.json" -X POST "$api/ai/draft-profile"` | 400 `validation_failed` (narasi di bawah 20 karakter) |
| 5 | `curl.exe -b $c -H "Content-Type: application/json" -d "@$bodyDir\teks.txt" -X POST "$api/ai/draft-profile"` | 400 `invalid_body` (bukan JSON) |

> Langkah 2 dengan **`stub`**: `name`/`story` kosong dan `milestones`/`bmc` `[]` — stub hanya mengisi yang bisa ditebak dari kata kunci. Dengan **`gemini`** (default, ~5 detik): `description`, `story`, dan `seekingObjective` ikut terisi; `name`, `owner`, `milestones`, `bmc` **tetap kosong** di narasi contoh ini karena narasinya tidak menyebut nama usaha, pemilik, atau tonggak — model memang dilarang mengarang. Empat nilai yang diuji di baris 2 harus benar di kedua provider, dan baris 3 wajib lolos di keduanya.
>
> Cek provider benar-benar aktif, bukan cuma jalan: kalau `gemini` dipilih tapi responsnya kosong-kosong seperti stub, periksa `AI_PROVIDER` di proses API (`docker compose config | Select-String AI_PROVIDER` atau log start). Kalau draf balas `503` terus, lihat log API — `status=404 provider_status="NOT_FOUND"` berarti nama modelnya sudah di-retire Google, ganti lewat `GEMINI_MODEL`.

> Tidak ada yang ditulis ke DB. Tempel hasilnya ke form lalu kirim ke `POST /businesses`; field `suggestions` diabaikan backend, jadi seluruh respons aman dikirim balik.

> **Kuota dua lapis.** Selain kuota per akun (`AI_DRAFT_LIMIT_PER_HOUR`, default 20), ada anggaran **global** `AI_DRAFT_GLOBAL_LIMIT_PER_HOUR` (default 200) untuk semua akun digabung. Karena 200 terlalu besar untuk dihabiskan manual, uji anggaran global dengan **menurunkannya**: set `AI_DRAFT_GLOBAL_LIMIT_PER_HOUR=3` (mis. di `backend/.env`), lalu `docker compose up -d api`. Tiga draf — boleh dari akun berbeda — lolos, request ke-4 dari akun mana pun → `429 rate_limited` + `Retry-After`. Narasi sub-minimum (langkah 4) cukup untuk menghabiskan kuota **tanpa biaya** karena ditolak sebelum provider dipanggil.

---

## 8. Lewat frontend (proxy)

Pastikan `next.config.ts` punya rewrite `/api → :8080`, lalu:

```powershell
curl.exe "http://localhost:3000/api/v1/businesses"     # harus identik dengan :8080
```

Cukup uji 1–2 endpoint + satu endpoint auth (cookie `HttpOnly` dilihat dari DevTools → Application).

---

## 9. Bersih-bersih (lokal)

```powershell
docker exec lumora-postgres psql -U lumora -d lumora -c `
  "DELETE FROM businesses WHERE slug LIKE 'uji-%'; DELETE FROM users WHERE email LIKE 'uji%';"
Remove-Item "$bodyDir" -Recurse -Force -ErrorAction SilentlyContinue   # sekaligus cookie di dalamnya

# Upload hasil uji. PENTING: tergantung cara API dijalankan.
docker exec backend-api-1 sh -c "rm -f /app/uploads/*"                  # docker compose -> named volume
Remove-Item ".\uploads\*" -Force -ErrorAction SilentlyContinue          # go run di host -> folder host

curl.exe "$api/businesses"     # kembali total=9
docker exec lumora-postgres psql -U lumora -d lumora -t -c `
  "select (select count(*) from users) users, (select count(*) from sessions) sessions;"
```

> **Kenapa dua perintah uploads?** `docker compose` memasang named volume di `/app/uploads`, jadi file uji **tidak** masuk ke `backend\uploads\` di host — menghapus folder host saja menyisakan file di volume (ketahuan saat runbook ini dijalankan: folder host 0 file, volume masih 1). `backend-api-1` adalah nama container dari `docker compose`; cek dengan `docker compose ps`.

> User & sesi ikut terhapus via `ON DELETE CASCADE` (bookmarks, sessions, dan sejak fase 10 juga `businesses` beserta milestones/BMC-nya). Kalau table masih kotor: `users`/`sessions` dihapus manual dengan `psql`.
>
> Profil yang diarsipkan **tidak** ikut perintah `DELETE FROM businesses WHERE slug LIKE 'uji-%'` di atas? Ikut — arsip tetap baris biasa di tabel yang sama, jadi slug-nya masih cocok. Yang tidak hilang dengan sendirinya hanyalah arsip milik profil non-uji.

---

## 10. Production (Railway)

Bagian 1–9 mengasumsikan stack lokal. Bagian ini mengulang alur inti terhadap API yang sudah live, dan menandai hal-hal yang **beda** — terutama isi DB, cookie, dan biaya AI.

### 10.1 Yang beda dari lokal

| | Lokal (`docker compose`) | Production (Railway) |
|---|---|---|
| Base URL | `http://localhost:8080` | `https://lumora-backend-production-ed55.up.railway.app` |
| Skema | `http` | **`https`** — wajib, lihat catatan cookie |
| Isi DB | seed: 9 bisnis | **9 bisnis** — di-seed manual 2026-09-30 (entrypoint tidak pernah menjalankan `seed`), 0 user |
| Cookie `lumora_session` | tanpa `Secure` | **`Secure`** (karena `APP_ENV=production`) |
| Provider AI | `stub` (default compose) | **`gemini` sungguhan — berbayar** |
| Provider email | `stub` (default compose) — link ke log | **`resend` sungguhan** — `stub` ditolak saat start di production; token dari inbox, bukan log |
| State kuota AI | in-memory, reset saat restart | in-memory, **reset tiap redeploy** |
| Hapus data uji | `docker exec ... psql` | `DELETE /auth/me` per akun uji; sisa baris lewat `railway ssh` (10.5) |
| Hapus akun | `DELETE /auth/me` (wajib sandi di body) | sama, tapi lihat catatan biaya/isi DB di bawah |

> **Cookie `Secure`.** Di production cookie ditandai `Secure`, jadi curl **hanya** mengirimnya ke `https://`. Kalau `$root` salah tulis `http://`, semua request ber-cookie balas `401` dan terlihat seperti "login gagal" padahal sesinya sehat. Selalu pakai `https://`.

### 10.2 Persiapan

```powershell
$root = "https://lumora-backend-production-ed55.up.railway.app"
$api  = "$root/api/v1"
$bodyDir = "$env:TEMP\lumora-prod"
New-Item -ItemType Directory $bodyDir -Force | Out-Null
$c = "$bodyDir\cookies.txt"

curl.exe "$root/healthz"          # {"status":"ok"} = service hidup

Set-Content "$bodyDir\reg.json" -Encoding ascii -Value '{"name":"Uji Prod","email":"uji-prod@example.com","password":"rahasia123"}'
Set-Content "$bodyDir\login.json" -Encoding ascii -Value '{"email":"uji-prod@example.com","password":"rahasia123"}'
```

`bisnis.json` dibangun lewat hashtable, bukan satu string panjang — barisnya jadi pendek-pendek sehingga tidak ada yang bisa terpotong saat di-paste:

```powershell
$b = @{
  name = "Uji Prod"
  category = "F&B"
  location = "Jakarta"
  description = "Profil uji production."
  story = "Cerita singkat uji production."
  foundedYear = 2020
  owner = @{ name = "Uji"; role = "Founder"; bio = "Pemilik uji." }
}
$b | ConvertTo-Json -Depth 9 | Set-Content "$bodyDir\bisnis.json" -Encoding ascii
```

> **Email tetap (`uji-prod@example.com`), sengaja bukan timestamp.** Versi timestamp sempat dipakai dan justru bikin bug: mengulang blok 10.2 mengganti email di `login.json` ke akun yang belum pernah didaftarkan → login balas `401 invalid_credentials`. Dengan email tetap, 10.2 boleh diulang kapan saja; kalau emailnya sudah terdaftar, register balas `409 email_taken` dan itu **normal** — lanjut ke langkah 4.

> **Tiap baris `Set-Content` harus masuk sebagai satu baris utuh.** Kalau terpotong saat di-paste, PowerShell tetap menjalankan perintahnya (potongan tetap di dalam string), tapi **spasi/newline ikut masuk ke nilai string**. Terbukti saat runbook ini dipakai: `"Uji⏎  Prod"` tersimpan jadi `Uji  Prod` (spasi dobel). Untuk `name` cuma kosmetik; kalau yang kena `email` atau `password`, login langsung `401 invalid_credentials`. Jadi jangan andalkan "terpotong pun aman".
>
> Hindari here-string `@"..."@` di sini — kalau baris `"@` penutupnya ikut terpotong, PowerShell masuk mode lanjutan `>>` dan perintah-perintah setelahnya ikut gagal. Jangan pakai `-w` juga: kalau `-w` terpisah dari nilainya, curl membalas `option -w: requires parameter`.

### 10.3 Alur inti

```powershell
# Jalankan setelah langkah 4 (login) berhasil — create + tangkap id-nya:
$bizId = (curl.exe -b $c -H "Content-Type: application/json" -d "@$bodyDir\bisnis.json" "$api/businesses" | ConvertFrom-Json).id

# Verifikasi email — prasyarat langkah 10 (publish) dan §10.4 (AI).
# Production memakai EMAIL_PROVIDER=resend (stub DITOLAK saat start sejak fase 11),
# jadi tautannya sampai ke INBOX alamat akun, bukan ke log Railway. Buka email
# dari LUMORA, salin nilai token=… dari URL-nya, lalu tulis verify.json:
'{"token":"<token-dari-email>"}' | Set-Content "$bodyDir\verify.json" -Encoding ascii
curl.exe -H "Content-Type: application/json" -d "@$bodyDir\verify.json" "$api/auth/verify-email"   # 200
```

> **Penerima harus pemilik akun Resend (belum ada domain).** Selama `RESEND_FROM` masih default (`onboarding@resend.dev`), Resend hanya mengirim ke alamat pemilik akun Resend; alamat lain ditolak `403 restricted_api_key` dan API meneruskannya sebagai `503 email_unavailable` di `resend-verification` (di `register` kegagalan kirim hanya dicatat di log — akun tetap dibuat, jadi langkah 3 tetap `201`). Jadi pakai alamat pemilik akun Resend untuk `uji-prod@example.com`, atau set `RESEND_FROM` ke domain yang sudah diverifikasi di Resend.
>
> Kalau `railway logs` **masih** menampilkan baris link verifikasi, berarti service masih memakai `EMAIL_PROVIDER=stub` — sejak fase 11 itu seharusnya menolak boot di production, jadi periksa env var-nya di dashboard.

| # | Perintah | Ekspektasi |
|---|---|---|
| 1 | `curl.exe "$api/businesses"` | 200, **`total`=9** — 9 profil seed. Kalau >9, ada sisa uji sebelumnya |
| 2 | `curl.exe "$api/businesses/kopi-ruang-senja"` | 200 — profil seed **ada** di production (di-seed manual 2026-09-30), bukan hanya di lokal |
| 3 | `curl.exe -c $c -H "Content-Type: application/json" -d "@$bodyDir\reg.json" "$api/auth/register"` | **201** + `Set-Cookie: lumora_session=...; HttpOnly; SameSite=Lax; Secure` — atau **409** `email_taken` kalau sudah pernah; keduanya lanjut ke langkah 4 |
| 4 | `curl.exe -c $c -H "Content-Type: application/json" -d "@$bodyDir\login.json" "$api/auth/login"` | 200 (**bukan** 401 `invalid_credentials`) |
| 5 | `curl.exe -b $c "$api/auth/me"` | 200, email = `uji-prod@example.com`, `emailVerified:false` |
| 6 | `curl.exe "$api/auth/me"` | 401 (tanpa cookie) |
| 7 | create di atas (`$bizId`) | **201**, `status="draft"`, `slug="uji-prod"` |
| 8 | `curl.exe "$api/businesses/uji-prod"` | **404** — draft tak pernah terbaca publik |
| 9 | verifikasi email (blok di atas) lalu `curl.exe -b $c "$api/auth/me"` | **`"emailVerified":true`** |
| 10 | `curl.exe -b $c -X POST "$api/businesses/$bizId/publish"` | 200 → list jadi `total`=10, langkah 8 kini 200. **Tanpa langkah 9 ini `403 email_not_verified`** dan `total` tetap 9 |

> `railway logs` tidak lagi memuat link verifikasi sejak production pindah ke `EMAIL_PROVIDER=resend` (link memuat token, dan provider asli sengaja tidak pernah menuliskannya ke log). Kalau tidak menemukan emailnya, cek folder spam, lalu pastikan alamat penerimanya benar-benar pemilik akun Resend (lihat catatan di 10.3).
>
> **Rate limit login juga aktif di production** (kode sama seperti lokal). Kalau mau memastikan: pakai email khusus (mis. `brute-prod@example.com`), lalu ulangi login gagal 10× → yang ke-11 `429 rate_limited` + `Retry-After`. **Jangan** pakai `uji-prod@example.com` — kalau kena limit, langkah 4 di atas ikut terkunci 15 menit. Tidak ada biaya (tidak memanggil AI), tapi ingat katup global login 300/jam.

### 10.4 AI (berbayar) & kuota

> **Harus sudah login _dan_ terverifikasi.** `$c` cuma *path* yang didefinisikan di 10.2 — isinya baru terisi setelah **10.3 langkah 3–4** (register/login). `401 unauthenticated` di sini hampir selalu berarti belum login, atau jendela PowerShell-nya baru sehingga `$api`/`$c` hilang. Jebakan diam-diamnya: kalau `$c` kosong, `-b $c` jadi `-b` telanjang dan curl menelan argumen berikutnya sebagai nilai cookie (`-b -H` → cookie literal `"-H"`) — perintahnya terlihat benar tapi tetap 401. Buktikan sesi dulu: `curl.exe -b $c "$api/auth/me"` harus 200.
>
> Kalau balasannya `403 email_not_verified`, berarti **10.3 langkah 9** (verifikasi email) belum dijalankan — gate-nya jalan sebelum handler, jadi langkah yang seharusnya `400` pun ikut `403`.
>
> **`invalid_credentials` saat login ≠ masalah cookie.** Itu email/password-nya yang ditolak. Pastikan `reg.json` dan `login.json` memuat email yang sama (`uji-prod@example.com`), lalu jalankan register sekali lagi — kalau akunnya memang belum ada, register balas `201` dan login berikutnya `200`.

```powershell
Set-Content "$bodyDir\narasi.json" '{"narrative":"Kedai kopi kami di Bandung berdiri sejak 2015 dan sekarang mencari mitra distributor."}' -Encoding ascii
Set-Content "$bodyDir\pendek.json" '{"narrative":"x"}' -Encoding ascii

curl.exe -b $c -H "Content-Type: application/json" -d "@$bodyDir\narasi.json" -X POST "$api/ai/draft-profile"
```

Baris terakhir memanggil **Gemini berbayar** (~5 detik) dan memakai 1 dari 20 kuota. `category` harus `"F&B"`, `foundedYear` `2015`, dan respons **tidak boleh** memuat `revenueLabel`/`growthLabel`/`revenueSeries`.

Sisa kuota bisa dihabiskan **tanpa biaya** — narasi di bawah 20 karakter ditolak validasi *sebelum* provider dipanggil, tapi tetap memakai token (charge-on-entry):

```powershell
1..21 | ForEach-Object {
  $code = curl.exe -s -o NUL -w "%{http_code}" -b $c -H "Content-Type: application/json" -d "@$bodyDir\pendek.json" -X POST "$api/ai/draft-profile"
  "{0,2} -> {1}" -f $_, $code
}
```

Setelah 1 draf nyata di atas, sisa kuota 19 → keluaran **19× `400` lalu `429`**. Kalau baru redeploy, hitungannya mulai dari 20 lagi (state-nya in-memory, lihat `docs/fases.md`).

```powershell
curl.exe -i -b $c -H "Content-Type: application/json" -d "@$bodyDir\pendek.json" -X POST "$api/ai/draft-profile" |
  Select-String -Pattern "HTTP/|Retry-After|rate_limited"
```

→ `HTTP/1.1 429` + `Retry-After: <detik>`.

> Kuota dihitung **per akun**, jadi akun kedua dapat jatah 20 sendiri. Yang menahan penyalahgunaan adalah **anggaran global** (`AI_DRAFT_GLOBAL_LIMIT_PER_HOUR`, default 200/jam) — total semua akun. Register masih gratis & instan, jadi multi-akun tetap mungkin; anggaran global membatasi **biayanya**, bukan jumlah akun. Verifikasi email aktif sejak fase 9 (gate lunak di `publish` & `ai/draft-profile`); pengirimnya provider asli sejak fase 11 (`EMAIL_PROVIDER=resend`), dengan batasan penerima di 10.3 — lihat `docs/fases.md`.

### 10.5 Bersih-bersih

Cara utama: **`DELETE /auth/me`** untuk setiap akun uji. Sejak fase 10 kolom `businesses.owner_user_id` memakai `ON DELETE CASCADE`, jadi satu perintah ini menghapus seluruh jejak akun:

```powershell
curl.exe -b $c -H "Content-Type: application/json" -d '{"password":"rahasia123"}' -X DELETE "$api/auth/me"   # 200
```

Yang ikut terhapus: **semua profil miliknya** — draft, terbit, **maupun yang sudah diarsipkan** — beserta milestone dan blok BMC-nya; lalu sesi, token verifikasi email, bookmark yang dia buat, dan bookmark user lain pada profil-profil itu.

> Sampai fase 9 FK-nya `SET NULL`, sehingga profil yang diarsipkan jadi yatim dan **tetap tinggal** setelah akunnya dihapus. Itu **sudah tidak berlaku** sejak fase 10. Jangan lagi berasumsi ada sisa baris `archived` setelah hapus akun.

Yang **tidak** ikut terhapus adalah baris seed — owner-nya `NULL`, bukan milik akun uji mana pun. Jadi setelah bersih-bersih, daftar publik kembali ke **`total`=9, bukan 0**:

```powershell
Remove-Item $bodyDir -Recurse -Force -ErrorAction SilentlyContinue   # sekaligus cookie di dalamnya
curl.exe "$api/businesses"     # kembali total=9
```

Untuk memeriksa DB production langsung — atau membuang sisa akun uji yang lupa dihapus — pakai `railway ssh`, dijalankan dari `backend/`:

```powershell
cd backend

railway ssh --service Postgres -- psql -h 127.0.0.1 -U postgres -d railway -t -A -c "SELECT count(*) FROM businesses;"

railway ssh --service Postgres -- psql -h 127.0.0.1 -U postgres -d railway -t -A -c "DELETE FROM users WHERE email LIKE 'uji-%';"
```

> **`-h 127.0.0.1` wajib.** Lewat loopback koneksi cocok dengan baris `trust` di `pg_hba.conf` **sebelum** aturan `scram-sha-256`, jadi tidak perlu password. Tanpa `-h`, psql menyambung ke `postgres.railway.internal` dan gagal `password authentication failed for user "postgres"` — walaupun `PGPASSWORD` terisi di container. Ini juga sebabnya password apa pun "berhasil" di jalur ini; itu **bukan** bukti kredensial benar.
>
> **Tulis dalam satu baris.** PowerShell tidak memakai `\` sebagai lanjutan baris; kalau dipaksa, `\` ikut terkirim sebagai argumen ke shell remote (`bash: line 3: \: command not found`) dan sisa barisnya dieksekusi PowerShell lokal (`psql is not recognized`). Untuk multi-baris, karakter lanjutannya backtick `` ` ``.
>
> **Jalankan dari `backend/`** — di situ link project Railway berada. Dari folder lain CLI membalas `No linked project found`.

Kalau butuh SQL yang lebih rumit daripada satu baris, tunnel lama masih tersedia: `railway connect Postgres --ssh --tunnel-only -P 5433`, lalu klien dari Docker ke `host.docker.internal:5433` (`PGPASSWORD=x` cukup, alasan loopback di atas). Tutup tunnel-nya butuh **dua** kill — `ssh.exe` pemegang port 5433 *dan* `railway.exe` induknya; cek `netstat -ano | findstr :5433` lalu `Stop-Process -Id <pid> -Force`. Di Git Bash, `taskkill //PID <pid> //F` **tidak** jalan — taskkill membaca `//PID` sebagai opsi tak dikenal.

---

## Referensi

- Kontrak lengkap (body, respons, kode error): **`docs/api.md`**
- Peta fase & backlog: **`docs/fases.md`**
- 16 kode error: `invalid_body`, `invalid_parameter`, `invalid_category`, `validation_failed`, `invalid_token` (400) · `unauthenticated`, `invalid_credentials` (401) · `forbidden`, `email_not_verified` (403) · `not_found` (404) · `email_taken`, `email_already_verified` (409) · `rate_limited` (429) · `internal_error` (500) · `ai_unavailable`, `email_unavailable` (503)
