# Panduan test manual (seluruh endpoint)

Runbook cek semua endpoint API lewat terminal — dari read publik sampai upload media.
Cocok dipakai untuk cross-check hasil `go test` atau sebelum serah-terima ke frontend.

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
| 7 | `curl.exe -b $c -X POST "$api/businesses/$bizId/publish"` | 200, `status="published"`; list jadi `total`=10; perintah 4 kini 200 |

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
curl.exe -b $c2 -H "Content-Type: application/json" -d "@$bodyDir\patch.json" -X PATCH "$api/businesses/$bizId"                        # → 403 forbidden (bukan miliknya)
curl.exe -b $c2 -X POST "$api/businesses/00000000-0000-4000-8000-000000000000/publish"                                                 # → 404 not_found (UUID valid, tak ada)
curl.exe -b $c2 -H "Content-Type: application/json" -d "@$bodyDir\patch.json" -X PATCH "$api/businesses/id-tidak-ada"                   # → 400 invalid_parameter (bukan UUID)
```

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

## 7. Lewat frontend (proxy)

Pastikan `next.config.ts` punya rewrite `/api → :8080`, lalu:

```powershell
curl.exe "http://localhost:3000/api/v1/businesses"     # harus identik dengan :8080
```

Cukup uji 1–2 endpoint + satu endpoint auth (cookie `HttpOnly` dilihat dari DevTools → Application).

---

## 8. Bersih-bersih

```powershell
docker exec lumora-postgres psql -U lumora -d lumora -c `
  "DELETE FROM businesses WHERE slug LIKE 'uji-%'; DELETE FROM users WHERE email LIKE 'uji%';"
Remove-Item "$bodyDir" -Recurse -Force
Remove-Item "$env:TEMP\lumora\cookies*.txt" -Force -ErrorAction SilentlyContinue
Remove-Item ".\uploads\*" -Force -ErrorAction SilentlyContinue   # file upload hasil uji

curl.exe "$api/businesses"     # kembali total=9
```

> User & sesi ikut terhapus via `ON DELETE CASCADE` (bookmarks, sessions). Kalau table masih kotor: `users`/`sessions` dihapus manual dengan `psql`.

---

## Referensi

- Kontrak lengkap (body, respons, kode error): **`docs/api.md`**
- Peta fase & backlog: **`docs/fases.md`**
- 10 kode error: `invalid_body`, `invalid_parameter`, `invalid_category`, `validation_failed` (400) · `unauthenticated`, `invalid_credentials` (401) · `forbidden` (403) · `not_found` (404) · `email_taken` (409) · `internal_error` (500)
