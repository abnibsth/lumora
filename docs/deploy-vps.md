# Deploy Backend LUMORA ke VPS

Panduan ini memindahkan backend dari Railway ke VPS kamu, sementara frontend
tetap di Vercel. Hasil akhir: frontend Vercel memanggil API yang berjalan di VPS
kamu lewat `http://<IP-VPS>:8080`.

## Cara kerja singkat

```
Browser ──HTTPS──▶ Vercel (frontend)
                      │  Next.js rewrite (/api/*, /uploads/*)
                      ▼
                  VPS kamu (backend) http://<IP>:8080
                      │
                      ▼
                  PostgreSQL (container)
```

- Frontend **tidak** nembak backend langsung dari browser — semua lewat proxy
  Next.js di Vercel, jadi **CORS tidak diperlukan**.
- Cookie sesi bertanda `Secure` (karena `APP_ENV=production`), tapi tetap jalan
  karena browser↔Vercel memakai HTTPS. **Selalu akses lewat URL Vercel**, bukan
  `http://<IP>:8080` langsung di browser.

---

## 0. Prasyarat

- VPS dengan **Ubuntu 20.04 / 22.04 / 24.04** (distro lain oke, panduan pakai apt).
- Docker + Docker Compose v2 terpasang.
- Key yang kamu siapkan:
  - `RESEND_API_KEY` (untuk email verifikasi) — **wajib** di production. Cara
    dapatnya di [bagian Resend](#cara-dapat-resend_api_key).
  - URL frontend Vercel (mis. `https://lumora.vercel.app`).
- **Tidak butuh** Gemini key: frontend sudah memakai provider Atria sendiri
  (`CHAT_AI_*` di Vercel) untuk draf AI & chat, jadi backend cukup `AI_PROVIDER=stub`.

---

## 1. Pasang Docker (sekali saja)

```bash
sudo apt update && sudo apt install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
sudo chmod a+r /etc/apt/keyrings/docker.asc

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
sudo systemctl enable --now docker
sudo usermod -aG docker "$USER"
```

> Setelah `usermod`, **logout lalu login ulang** (atau `newgrp docker`) supaya
> bisa jalanin `docker` tanpa `sudo`.

Cek:

```bash
docker compose version   # harus tampil versi (Compose v2)
```

---

## 2. Ambil kode & siapkan konfigurasi

```bash
git clone https://github.com/abnibsth/lumora.git
cd lumora/backend

cp .env.production.example .env.production
nano .env.production
```

Isi minimal 4 hal di `.env.production`:

| Variabel | Isi |
|---|---|
| `POSTGRES_PASSWORD` | password acak kuat, mis. hasil `openssl rand -hex 16` |
| `RESEND_API_KEY` | key Resend (lihat bagian bawah) |
| `RESEND_FROM` | kosongkan dulu, atau isi `no-reply@<domain-terverifikasi>` |
| `FRONTEND_BASE_URL` | `https://<nama-proyek>.vercel.app` |

---

## 3. Deploy

```bash
cd ~/lumora/backend
bash deploy.sh
```

Script ini build image, menjalankan postgres → migrate → seed → api, lalu
menunggu sampai API sehat (`http://localhost:8080/healthz`).

Cek manual:

```bash
curl http://localhost:8080/healthz
# -> {"status":"ok"}
curl http://localhost:8080/api/v1/businesses
# -> JSON berisi 9 profil demo
```

---

## 4. Buka port di firewall

Port 8080 harus bisa diakses dari internet (Vercel perlu menjangkaunya).

```bash
# Kalau pakai ufw:
sudo ufw allow 8080/tcp
sudo ufw status

# Kalau pakai firewall bawaan cloud provider (DigitalOcean/AWS/Vultr/dll),
# tambahkan inbound rule TCP 8080 di dashboard provider kamu.
```

> Catatan keamanan: backend diekspos tanpa HTTPS pada port ini. Itu keputusan
> "paling simpel" yang kita ambil. Kalau nanti mau aman, tambahkan domain +
> reverse proxy (Caddy/Nginx) — aku bisa bantu.

---

## 5. Buat akun admin

```bash
cd ~/lumora/backend
bash provision-admin.sh "Nama Admin" admin@lumora.id
```

Masukkan password saat diminta. Login admin lewat frontend di `/admin/login`.

---

## 6. Arahkan Vercel ke VPS

1. Buka dashboard Vercel → project frontend → **Settings → Environment Variables**.
2. Tambah (Production + Preview):
   - `BACKEND_URL` = `http://<IP-VPS>:8080`
3. Pastikan key AI frontend (Atria) sudah ada di Vercel (ini bukan bagian dari
   backend): `CHAT_AI_BASE_URL`, `CHAT_AI_MODEL`, `CHAT_AI_API_KEY`. Kalau temen
   kamu sudah jalanin draf AI & chat sebelumnya, biasanya sudah terpasang.
4. Simpan, lalu **Redeploy** (env var ini dibaca saat build untuk rewrite).
5. Setelah deploy selesai, buka URL Vercel dan pastikan daftar bisnis muncul.

---

## 7. Uji alur lengkap

1. Register akun baru di frontend.
2. Cek email verifikasi masuk (butuh `RESEND_FROM` yang benar — lihat catatan Resend).
3. Klik link verifikasi → kembali ke frontend → akun jadi terverifikasi.
4. Buat profil bisnis → **Publish** (harus terverifikasi).
5. Coba **draf AI** (lewat frontend/Atria) — harus mengisi kategori/lokasi/tahun dari narasi.
6. Upload logo/cover → gambar harus tampil (lewat `/uploads`).

---

## 8. Update backend (setelah ada perubahan kode)

```bash
cd ~/lumora/backend
git pull origin main
bash deploy.sh
```

Migrasi dijalankan otomatis sebelum API start, jadi skema DB selalu terbaru.
Data (DB & upload) aman karena tersimpan di volume Docker (`lumora-pgdata`,
`lumora-uploads`).

---

## 9. Lihat log & troubleshooting

```bash
cd ~/lumora/backend
docker compose -f docker-compose.prod.yml --env-file .env.production logs -f api
docker compose -f docker-compose.prod.yml --env-file .env.production ps
```

| Gejala | Sebab umum | Solusi |
|---|---|---|
| API restart terus, log `GEMINI_API_KEY wajib diisi` | `AI_PROVIDER=gemini` tapi key kosong | isi `GEMINI_API_KEY` di `.env.production` |
| API restart terus, log `RESEND_API_KEY wajib diisi` | `EMAIL_PROVIDER=resend` tapi key kosong | isi `RESEND_API_KEY` |
| Log `EMAIL_PROVIDER=stub tidak boleh dipakai saat APP_ENV=production` | masih `stub` | set `EMAIL_PROVIDER=resend` |
| Email verifikasi tidak sampai / `503 email_unavailable` | `RESEND_FROM` masih `onboarding@resend.dev` | verifikasi domain di Resend & isi `RESEND_FROM` |
| Register/login selalu 401 | akses via `http://IP` bukan URL Vercel | akses lewat URL Vercel |
| Profil bisnis tidak muncul di Vercel | `BACKEND_URL` salah / belum redeploy | cek env var & redeploy |

---

## 10. Backup (opsional tapi disarankan)

```bash
# Backup database (file dump .sql)
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T postgres \
  pg_dump -U lumora -d lumora > backup-$(date +%F).sql

# Backup volume upload
docker run --rm -v lumora_lumora-uploads:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads-$(date +%F).tar.gz -C /data .
```

---

## Cara dapat `RESEND_API_KEY`

1. Daftar/login di <https://resend.com>.
2. **API Keys → Create API Key** → salin key-nya ke `RESEND_API_KEY`.
3. Untuk bisa kirim ke email publik (bukan cuma email pemilik akun), tambahkan
   domain di **Domains → Add Domain** lalu verifikasi DNS (MX/TXT) sesuai
   instruksi Resend. Setelah terverifikasi, isi `RESEND_FROM` mis.
   `no-reply@lumora.id`.
4. Selama belum ada domain, Resend hanya bisa mengirim ke alamat email pemilik
   akun — cukup untuk testing, tapi pengguna lain belum bisa verifikasi.
