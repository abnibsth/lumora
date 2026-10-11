# Progres Pengembangan LUMORA

Dokumen ini mencatat pekerjaan integrasi autentikasi, autorisasi, dan frontend-backend secara bertahap. Kontrak endpoint tetap mengacu ke `docs/api.md`; riwayat dan backlog backend tetap mengacu ke `docs/fases.md`.

## Status Tahapan

| Tahap | Ruang lingkup | Status |
|---|---|---|
| 0 | Menetapkan batas akses, sumber otoritas, dependensi, dan urutan pengerjaan | Selesai |
| 1 | Fondasi autentikasi frontend dan state sesi | Selesai |
| 2 | Verifikasi email dan konfigurasi pengiriman | Selesai untuk kode; konfigurasi production perlu verifikasi operator |
| 3 | Dashboard pemilik dan CRUD profil | Selesai |
| 4 | Upload media dan AI draft profil | Selesai |
| 5 | Bookmark server-side dan pengaturan akun | Selesai |
| 6 | Menghapus mock dan sumber data ganda | Selesai |
| 7 | Autentikasi dan API admin sebagai jalur terpisah | Selesai |
| 8 | Backlog backend, dokumentasi, CI, dan test | Selesai untuk scope aman; backlog keamanan dicatat |

## Tahap 0 - Batas Akses

### Sumber Otoritas

- Backend adalah satu-satunya sumber kebenaran autentikasi dan autorisasi.
- Sesi menggunakan cookie `lumora_session` yang `HttpOnly`, `SameSite=Lax`, dan `Secure` di production.
- Frontend tidak menyimpan token autentikasi di `localStorage` dan tidak membuat token sendiri.
- Keberadaan cookie hanya dapat dipakai untuk redirect awal. Validitas sesi tetap diperiksa melalui `GET /api/v1/auth/me`.
- Kepemilikan profil, status verifikasi email, dan izin operasi selalu diperiksa kembali oleh backend.

### Role yang Tersedia

Backend dan database saat ini hanya mendukung:

- `umkm`
- `mitra`

Role `admin` belum tersedia. Route admin tidak boleh dianggap aman hanya karena disembunyikan di UI atau dilindungi oleh sesi user biasa.

### Matriks Akses Target

| Area | Route | Akses target | Pemeriksaan utama |
|---|---|---|---|
| Situs publik | `/`, `/explore`, `/business/[slug]` | Publik | Tidak memerlukan sesi |
| Informasi publik | `/how-it-works`, `/for-business`, `/for-partners`, `/about` | Publik | Tidak memerlukan sesi |
| Legal | `/kebijakan-privasi`, `/syarat-ketentuan` | Publik | Tidak memerlukan sesi |
| Auth | `/login`, `/register` | Publik | User dengan sesi aktif nantinya diarahkan ke dashboard |
| Verifikasi email | `/verify-email` | Publik dengan token | Token diverifikasi backend melalui POST |
| Dashboard pemilik | `/dashboard` | User terautentikasi | Sesi valid melalui `/auth/me` |
| Fitur pemilik | buat/edit/publish/arsip profil | User terautentikasi | Sesi, ownership, dan verifikasi email sesuai endpoint |
| Bookmark akun | daftar/tambah/hapus bookmark | User terautentikasi | Sesi valid |
| Pengaturan akun | profil, ganti sandi, hapus akun | User terautentikasi | Sesi valid dan re-autentikasi bila diwajibkan backend |
| Login admin | `/admin/login` | Publik | Mekanisme admin belum tersedia |
| CMS admin | `/admin` | Admin | Role/permission dan endpoint admin harus dibuat lebih dahulu |

### Kondisi Saat Ini

- Register dan login frontend sudah memanggil backend.
- `getMeApi` dan `logoutApi` sudah tersedia, tetapi belum dipakai komponen mana pun.
- Navbar belum menampilkan state sesi.
- `/dashboard` masih data contoh dan dapat dibuka publik.
- `/admin` masih prototype dan dapat dibuka publik.
- `/admin/login` hanya memvalidasi input lokal dan tidak mengirim kredensial.
- Belum ada route guard frontend.
- Backend sudah melindungi endpoint privat dengan sesi, verifikasi email, dan ownership.

### Keputusan Tahap 0

1. Fitur user biasa dan admin dipisahkan.
2. Tahap 1 hanya menghubungkan sesi user `umkm`/`mitra`; tidak membuat admin palsu.
3. `/dashboard` menjadi area user terautentikasi pada Tahap 1 dan memakai data backend pada Tahap 3.
4. `/admin` tetap berstatus prototype sampai role, middleware, dan endpoint admin tersedia pada Tahap 7.
5. Semua pemanggilan API frontend mengikuti prefix `/api/v1` melalui rewrite same-origin Vercel ke Railway.
6. Error frontend mengikuti envelope `{ "error": { "code", "message" } }` dari `docs/api.md`.

### Kriteria Selesai Tahap 0

- Batas route publik, user, dan admin terdokumentasi.
- Backend ditetapkan sebagai sumber otoritas sesi dan izin.
- Ketergantungan admin yang belum tersedia dicatat agar tidak dibuat sebagai proteksi semu.
- Urutan tahap integrasi disepakati dan dicatat.
- Baseline lint/build frontend dan test backend dijalankan.

## Rencana Tahap 1

- Memperbaiki parsing error API frontend sesuai envelope backend.
- Mengambil user aktif melalui `GET /api/v1/auth/me`.
- Menampilkan state user dan aksi logout di navbar.
- Melindungi `/dashboard` dengan redirect awal dan validasi sesi backend.
- Mendukung redirect kembali melalui parameter `next` setelah login.
- Menambah pengujian/verifikasi sesuai fasilitas project, lalu mencatat hasilnya di dokumen ini.

## Tahap 1 - Autentikasi Frontend

### Implementasi

- Kontrak `ApiErrorResponse` disamakan dengan envelope backend: `{ error: { code, message } }`.
- Login dan register sekarang menampilkan `error.message` dari backend, bukan mencari field yang tidak ada di root respons.
- `getMeApi` mendukung dua jalur:
  - browser melalui proxy same-origin agar cookie ikut otomatis;
  - Server Component dengan cookie request yang diteruskan ke backend.
- Navbar memanggil `GET /api/v1/auth/me` saat hydration.
- Navbar desktop dan mobile menampilkan nama user, tautan dashboard, dan tombol keluar saat sesi valid.
- Logout memanggil `POST /api/v1/auth/logout`, menghapus state user, menutup menu mobile, lalu kembali ke homepage.
- `/dashboard` memvalidasi sesi ke backend sebelum render. Sesi tidak valid diarahkan ke `/login?next=%2Fdashboard`.
- `/login` menerima parameter `next` lokal, menolak tujuan eksternal, dan mengarahkan user yang sudah login ke tujuan tersebut.
- Login dan register yang berhasil sekarang membuka `/dashboard`.
- Route `/dashboard` ditambahkan ke sumber route frontend di `frontend/lib/constants.ts`.

### Keputusan

- Route publik tidak dibuat dinamis hanya untuk membaca sesi. Navbar melakukan hydration di browser sesuai checklist `docs/api.md`.
- Proteksi `/dashboard` tidak hanya mengecek keberadaan cookie. Halaman meneruskan cookie ke `/auth/me`, sehingga backend tetap menentukan apakah sesi valid atau kedaluwarsa.
- `/admin` tidak diubah pada tahap ini karena backend belum memiliki role atau permission admin.
- Isi dashboard masih data contoh. Penggantian dengan `GET /businesses/mine` tetap menjadi ruang lingkup Tahap 3.

### File yang Diubah

- `frontend/types/user.ts`
- `frontend/lib/api.ts`
- `frontend/lib/constants.ts`
- `frontend/components/layout/navbar.tsx`
- `frontend/components/layout/mobile-nav.tsx`
- `frontend/components/auth/login-form.tsx`
- `frontend/components/auth/register-form.tsx`
- `frontend/app/(site)/login/page.tsx`
- `frontend/app/dashboard/page.tsx`

### Hasil Pengujian

- `frontend: npx tsc --noEmit` - lulus.
- `frontend: npm run build` - lulus.
- Smoke test build production lokal:
  - `GET /dashboard` tanpa sesi - `307` ke `/login?next=%2Fdashboard`.
  - `GET /login?next=%2Fdashboard` - `200`.
  - `GET /` - `200`.
- `backend: go test ./... -count=1` - lulus.
- `backend: gofmt -l .` - lulus.
- `backend: go vet ./...` - lulus.
- `frontend: npm run lint` - masih gagal pada baseline Tahap 0 yang tidak disentuh Tahap 1:
  - `components/chart-area-interactive.tsx:149` memanggil `setState` langsung di effect.
  - `hooks/use-mobile.ts:14` memanggil `setState` langsung di effect.
  - Enam warning unused di `components/sections/ai-section.tsx` dan `components/site-header.tsx`.
- Tidak ada error lint baru pada file autentikasi yang diubah.

## Rencana Tahap 2

- Membuat halaman `/verify-email` yang membaca token query dan melakukan POST ke backend.
- Menampilkan status berhasil, token tidak valid/kedaluwarsa, rate limit, dan gangguan layanan.
- Menampilkan ajakan verifikasi email untuk user yang belum terverifikasi.
- Menambahkan aksi kirim ulang melalui `POST /auth/resend-verification`.
- Memastikan `FRONTEND_BASE_URL` Railway menunjuk ke `https://lumora.bai01.my.id` dan mencatat kebutuhan verifikasi domain Resend.

## Tahap 2 - Verifikasi Email

### Implementasi

- Route publik `/verify-email` ditambahkan dengan metadata `noindex`.
- Halaman membaca token dari query lalu melakukan `POST /api/v1/auth/verify-email` di browser.
- Membuka URL lewat GET tidak mengonsumsi token; token baru dikirim setelah halaman berjalan di browser.
- Halaman menangani state:
  - token tidak ada;
  - sedang diverifikasi;
  - verifikasi berhasil;
  - token tidak valid atau kedaluwarsa;
  - rate limit;
  - gangguan backend.
- Aksi kirim ulang menggunakan `POST /api/v1/auth/resend-verification` dengan cookie sesi.
- Respons API frontend sekarang mempertahankan `error.code` dan `error.message`, sehingga UI dapat membedakan `invalid_token`, `rate_limited`, `email_already_verified`, `email_unavailable`, dan `unauthenticated`.
- User dengan `emailVerified: false` melihat notice verifikasi di situs publik setelah hydration navbar.
- Dashboard menampilkan notice yang sama dari user hasil validasi server-side.
- Notice menjelaskan bahwa verifikasi diperlukan untuk publish dan draf AI, menampilkan alamat tujuan, dan menyediakan aksi kirim ulang.
- `ROUTES.verifyEmail` ditambahkan ke sumber route frontend.

### Keputusan

- Verifikasi tetap dilakukan melalui POST sesuai kontrak backend. Pemindai email yang hanya membuka URL GET tidak dapat menghabiskan token.
- Notice tidak memblokir browsing, bookmark, upload, atau edit draft karena backend hanya mewajibkan email terverifikasi untuk publish dan AI draft.
- `email_already_verified` diperlakukan sebagai kondisi selesai, bukan error yang harus ditampilkan ke user.
- Kirim ulang tanpa sesi tetap ditolak backend. UI menampilkan pesan backend dan menyediakan tautan masuk.
- Tidak ada API key, token, atau alamat penerima yang ditulis ke log frontend.

### File yang Ditambahkan

- `frontend/app/(site)/verify-email/page.tsx`
- `frontend/components/auth/verify-email-panel.tsx`
- `frontend/components/auth/email-verification-notice.tsx`

### File yang Diubah

- `frontend/lib/api.ts`
- `frontend/lib/constants.ts`
- `frontend/components/layout/navbar.tsx`
- `frontend/app/dashboard/page.tsx`
- `farhan.md`

### Konfigurasi Production

- Target yang diperlukan: `FRONTEND_BASE_URL=https://lumora.bai01.my.id` pada service backend Railway.
- Domain pengirim perlu diverifikasi di Resend, lalu `RESEND_FROM` diarahkan ke alamat pada domain tersebut.
- Kedua nilai tidak tersimpan di repo.
- Verifikasi dashboard belum dapat dilakukan dari workspace karena perintah `railway` tidak tersedia di mesin ini.
- Sampai domain Resend diverifikasi, `onboarding@resend.dev` hanya dapat mengirim ke pemilik akun Resend.

### Hasil Pengujian

- `frontend: npx tsc --noEmit` - lulus.
- Lint terarah seluruh file Tahap 2 - lulus.
- `frontend: npm run build` - lulus.
- Smoke test build production lokal:
  - `GET /verify-email` - `200`, menampilkan kondisi token tidak ditemukan.
  - `GET /verify-email?token=invalid-smoke-token` - `200`, menampilkan proses verifikasi client-side.
  - `GET /dashboard` tanpa sesi - tetap `307` ke `/login?next=%2Fdashboard`.
- Smoke test backend production:
  - `POST /api/v1/auth/verify-email` dengan token uji - `400 invalid_token` sesuai kontrak.
- `backend: go test ./... -count=1` - lulus.
- `backend: gofmt -l .` - lulus.
- `backend: go vet ./...` - lulus.
- `git diff --check` - lulus.
- `frontend: npm run lint` - masih gagal hanya pada baseline yang sudah dicatat sejak Tahap 0:
  - `components/chart-area-interactive.tsx:149` memanggil `setState` langsung di effect.
  - `hooks/use-mobile.ts:14` memanggil `setState` langsung di effect.
  - Enam warning unused di `components/sections/ai-section.tsx` dan `components/site-header.tsx`.

## Rencana Tahap 3

- Mengganti isi `/dashboard` yang masih berupa contoh dengan `GET /api/v1/businesses/mine`.
- Menampilkan status `draft` dan `published` dari backend.
- Menambahkan form pembuatan profil melalui `POST /api/v1/businesses`.
- Menambahkan edit profil melalui `PATCH /api/v1/businesses/:id`.
- Menambahkan publish dengan penanganan `email_not_verified`.
- Menambahkan arsip dengan konfirmasi karena belum ada endpoint pemulihan.

## Tahap 3 - Dashboard Pemilik dan CRUD Profil

### Implementasi

- `/dashboard` tidak lagi merender template shadcn dengan data `Acme Inc.`, user `shadcn`, chart pengunjung, dan dokumen contoh.
- Server Component dashboard meneruskan cookie ke:
  - `GET /api/v1/auth/me` untuk validasi sesi;
  - `GET /api/v1/businesses/mine?limit=50` untuk memuat profil milik user.
- Dashboard menampilkan empty state saat user belum memiliki profil.
- Profil menampilkan nama, kategori, lokasi, tahun berdiri, deskripsi, serta status `draft` atau `published`.
- Form create terhubung ke `POST /api/v1/businesses`.
- Form edit terhubung ke `PATCH /api/v1/businesses/:id`.
- Publish terhubung ke `POST /api/v1/businesses/:id/publish`.
- Arsip terhubung ke `DELETE /api/v1/businesses/:id`.
- User dapat membuka profil published melalui `/business/:slug`.
- Form mencakup seluruh field inti yang diwajibkan backend:
  - nama, kategori, lokasi, deskripsi, cerita, tahun berdiri;
  - nama, peran, dan bio pemilik;
  - URL cover opsional;
  - kebutuhan mitra dan tujuan pencarian mitra.
- Edit mempertahankan `milestones` dan `bmc` yang sudah tersimpan agar field yang belum memiliki editor visual tidak terhapus.
- Mengosongkan URL cover atau tujuan mitra saat edit mengirim string kosong agar backend menghapus nilai lama.
- Publish menangani `email_not_verified` dengan arahan ke notice verifikasi.
- Sesi kedaluwarsa saat create, update, publish, atau arsip mengarahkan user kembali ke login.
- Arsip memakai konfirmasi dua langkah dan menjelaskan bahwa belum ada endpoint pemulihan.

### Keputusan

- Dashboard dibuat sebagai halaman kerja LUMORA, bukan mempertahankan shell dashboard generik yang tidak terkait kebutuhan pemilik UMKM.
- Milestone dan BMC belum mendapat editor pada tahap ini. Data lama dipertahankan saat edit, sedangkan profil baru mulai dengan array kosong sesuai kontrak backend.
- Upload media belum dimasukkan karena menjadi ruang lingkup Tahap 4. Tahap ini menerima URL cover yang sudah tersedia.
- AI draft belum dimasukkan karena output-nya akan menjadi prefill form pada Tahap 4.
- Profil archived langsung dihapus dari state dashboard setelah backend mengonfirmasi sukses, sama dengan perilaku `GET /businesses/mine` yang memang tidak mengembalikan arsip.

### File yang Ditambahkan

- `frontend/components/dashboard/owner-dashboard.tsx`

### File yang Diubah

- `frontend/app/dashboard/page.tsx`
- `frontend/lib/api.ts`
- `frontend/types/business.ts`
- `farhan.md`

### Hasil Pengujian

- `frontend: npx tsc --noEmit` - lulus.
- Lint terarah seluruh file Tahap 3 - lulus.
- `frontend: npm run build` - lulus.
- Smoke test build production lokal:
  - `GET /dashboard` tanpa sesi - `307` ke `/login?next=%2Fdashboard`.
  - `GET /login?next=%2Fdashboard` - `200`.
  - `GET /verify-email` - `200`.
  - `GET /` - `200`.
- Smoke test backend production tanpa sesi:
  - `GET /api/v1/businesses/mine?limit=50` - `401 unauthenticated`.
  - `POST /api/v1/businesses` - `401 unauthenticated`.
- CRUD authenticated tidak dijalankan terhadap production karena pengujian itu akan membuat, menerbitkan, atau mengarsipkan data akun nyata tanpa izin.
- `backend: go test ./... -count=1` - lulus.
- `backend: gofmt -l .` - lulus.
- `backend: go vet ./...` - lulus.
- `git diff --check` - lulus.
- `frontend: npm run lint` - masih gagal hanya pada baseline yang sudah ada sebelum Tahap 3:
  - `components/chart-area-interactive.tsx:149` memanggil `setState` langsung di effect.
  - `hooks/use-mobile.ts:14` memanggil `setState` langsung di effect.
  - Enam warning unused di `components/sections/ai-section.tsx` dan `components/site-header.tsx`.

## Rencana Tahap 4

- Menambahkan upload cover/logo melalui `POST /api/v1/media`.
- Menambahkan AI draft profil melalui `POST /api/v1/ai/draft-profile`.
- Memakai output AI sebagai prefill form, bukan menyimpan otomatis.
- Menampilkan suggestions dari AI sebagai daftar field yang perlu dilengkapi user.
- Menangani `email_not_verified`, `rate_limited`, dan `ai_unavailable` sesuai kontrak.

## Tahap 4 - Upload Media dan AI Draft

### Implementasi Upload Media

- API client `uploadMediaApi` ditambahkan untuk `POST /api/v1/media` menggunakan `multipart/form-data` dengan field `file`.
- Form dashboard menerima upload cover dan logo.
- Input file membatasi pilihan browser ke JPEG, PNG, WebP, dan GIF; backend tetap memeriksa isi byte dan batas 5 MB sebagai sumber validasi utama.
- URL relatif `/uploads/...` hasil backend dimasukkan ke field `coverImage` atau `logo`.
- User dapat menghapus cover/logo dari form sebelum menyimpan profil.
- Upload tidak otomatis menyimpan profil. URL baru masuk ke payload saat user menekan simpan.
- Rewrite `/uploads/:path*` ditambahkan agar file Railway dapat dibuka melalui domain frontend Vercel.
- Sesi kedaluwarsa saat upload mengarahkan user kembali ke login.

### Implementasi AI Draft

- API client `draftProfileApi` ditambahkan untuk `POST /api/v1/ai/draft-profile`.
- Form menyediakan input narasi 20–5000 karakter.
- Fitur dinonaktifkan untuk user yang emailnya belum terverifikasi.
- Hasil AI hanya mengisi form; tidak ada profil yang disimpan otomatis.
- Field kosong dari AI tidak menimpa nilai yang sudah diketik user.
- Milestone dan BMC hasil AI ikut dibawa ke payload simpan walaupun editor visualnya belum tersedia.
- Hasil AI dengan milestone/BMC kosong tidak menghapus data lama saat edit.
- `suggestions` ditampilkan sebagai daftar informasi yang masih perlu dilengkapi user.
- UI menampilkan jumlah milestone dan blok BMC yang akan ikut disimpan.
- Error ditangani sesuai kontrak:
  - `email_not_verified` - meminta user memverifikasi email;
  - `rate_limited` - meminta user menunggu;
  - `ai_unavailable` - menjelaskan layanan AI sedang tidak tersedia;
  - `unauthenticated` - kembali ke login;
  - validasi dan error lain - menampilkan pesan backend.

### Keputusan

- AI tidak pernah melakukan submit otomatis. User tetap harus memeriksa seluruh field dan menekan simpan.
- Data yang tidak dapat disimpulkan AI tidak dibuat-buat. Nilai kosong dipertahankan untuk dilengkapi user.
- Upload dilakukan sebelum save agar URL dapat dimasukkan ke payload create/update yang sudah ada.
- Backend belum menyediakan endpoint hapus media. Membatalkan form setelah upload dapat meninggalkan file tanpa referensi di storage; pembersihan media menjadi backlog backend/operasional.
- Pengujian AI dan upload dengan sesi nyata tidak dijalankan ke production karena AI memakai kuota berbayar dan upload akan membuat file permanen.

### File yang Diubah

- `frontend/components/dashboard/owner-dashboard.tsx`
- `frontend/lib/api.ts`
- `frontend/types/business.ts`
- `frontend/next.config.ts`
- `farhan.md`

### Hasil Pengujian

- `frontend: npx tsc --noEmit` - lulus.
- Lint terarah seluruh file Tahap 4 - lulus.
- `frontend: npm run build` - lulus.
- Smoke test build production lokal:
  - `GET /dashboard` tanpa sesi - `307` ke `/login?next=%2Fdashboard`.
  - `GET /verify-email` - `200`.
  - `GET /uploads/nonexistent-stage4.png` - mencapai Railway dan mengembalikan `404` dengan header `server: railway-hikari`; rewrite uploads aktif.
- Smoke test backend production tanpa sesi:
  - `POST /api/v1/ai/draft-profile` - `401 unauthenticated`.
  - `POST /api/v1/media` - `401 unauthenticated`.
- `backend: go test ./... -count=1` - lulus.
- `backend: gofmt -l .` - lulus.
- `backend: go vet ./...` - lulus.
- `git diff --check` - lulus.
- `frontend: npm run lint` - masih gagal hanya pada baseline lama:
  - `components/chart-area-interactive.tsx:149` memanggil `setState` langsung di effect.
  - `hooks/use-mobile.ts:14` memanggil `setState` langsung di effect.
  - Enam warning unused di `components/sections/ai-section.tsx` dan `components/site-header.tsx`.

## Rencana Tahap 5

- Mengganti bookmark `localStorage` dengan `GET /api/v1/bookmarks`.
- Menambahkan bookmark melalui `POST /api/v1/bookmarks/:slug`.
- Menghapus bookmark melalui `DELETE /api/v1/bookmarks/:slug`.
- Menambahkan halaman atau bagian pengaturan akun untuk ubah nama, ganti kata sandi, dan hapus akun.
- Menangani sesi kedaluwarsa dan error backend pada seluruh aksi akun.

## Tahap 5 - Bookmark dan Pengaturan Akun

### Bookmark Server-side

- Penyimpanan bookmark `localStorage` dihapus.
- `frontend/lib/bookmarks.ts` dihapus karena backend sekarang menjadi satu-satunya sumber data bookmark.
- API client ditambahkan untuk:
  - `GET /api/v1/bookmarks`;
  - `POST /api/v1/bookmarks/:slug`;
  - `DELETE /api/v1/bookmarks/:slug`.
- Hook `useBookmarks` memeriksa sesi sebelum memuat bookmark akun.
- Tombol bookmark dinonaktifkan selama status sesi masih diperiksa atau mutasi sedang berjalan.
- User anonim yang memilih simpan diarahkan ke `/login?next=<halaman-asal>`.
- Explore menampilkan jumlah profil yang tersimpan di akun, bukan di perangkat.
- Tombol simpan pada halaman detail bisnis sekarang berfungsi dan memakai endpoint backend.
- Error memuat atau mengubah bookmark ditampilkan, bukan diam-diam dianggap daftar kosong.
- Dashboard memuat bookmark secara server-side dan menampilkan bagian `Profil tersimpan`.
- Bookmark dapat dihapus dari dashboard tanpa menghapus profil bisnisnya.

### Pengaturan Akun

- Dashboard memiliki bagian pengaturan akun dengan email login sebagai informasi non-editable.
- Nama tampilan dapat diperbarui melalui `PATCH /api/v1/auth/me`.
- Nama yang berhasil diperbarui langsung mengganti nama pada header dashboard dan data user lokal.
- Kata sandi dapat diperbarui melalui `POST /api/v1/auth/change-password`.
- Form mengikuti batas 8–128 karakter dan memakai autocomplete password yang sesuai.
- Setelah ganti kata sandi, UI menjelaskan bahwa sesi perangkat lain dihentikan sesuai perilaku backend.
- `rate_limited`, `invalid_credentials`, validasi, dan sesi kedaluwarsa ditangani sesuai kode backend.

### Hapus Akun

- Hapus akun memakai `DELETE /api/v1/auth/me` dengan kata sandi.
- Aksi memakai konfirmasi dua langkah.
- UI menjelaskan sebelum konfirmasi bahwa penghapusan mencakup:
  - akun dan seluruh sesi;
  - token verifikasi;
  - bookmark;
  - semua profil bisnis draft maupun published;
  - milestone dan BMC terkait;
  - hilangnya profil published dari halaman publik.
- Setelah sukses, user kembali ke homepage dan sesi dibersihkan backend.
- Kata sandi salah tidak menghapus sesi dan pesan backend ditampilkan.

### Keputusan

- Tidak ada fallback bookmark lokal. Menyimpan profil membutuhkan akun agar hasil konsisten antarperangkat.
- Explore dan detail tetap publik; login hanya diwajibkan saat user melakukan aksi bookmark.
- Email dan role tidak dibuat editable karena backend sengaja tidak mengizinkannya.
- Penghapusan akun tidak memakai dialog konfirmasi generik; dampak pada profil bisnis disebutkan secara eksplisit sebelum meminta kata sandi.
- Mutasi akun dan bookmark dengan sesi nyata tidak diuji pada production karena dapat mengubah password, nama, bookmark, atau menghapus akun sungguhan.

### File yang Ditambahkan

- `frontend/hooks/use-bookmarks.ts`
- `frontend/components/business/business-bookmark-action.tsx`
- `frontend/components/dashboard/saved-businesses.tsx`
- `frontend/components/dashboard/account-settings.tsx`

### File yang Dihapus

- `frontend/lib/bookmarks.ts`

### File yang Diubah

- `frontend/lib/api.ts`
- `frontend/components/business/business-discovery-explorer.tsx`
- `frontend/components/business/business-card.tsx`
- `frontend/components/business/bookmark-button.tsx`
- `frontend/app/(site)/business/[slug]/page.tsx`
- `frontend/app/dashboard/page.tsx`
- `frontend/components/dashboard/owner-dashboard.tsx`
- `farhan.md`

### Hasil Pengujian

- `frontend: npx tsc --noEmit` - lulus.
- Lint terarah seluruh file Tahap 5 - lulus.
- `frontend: npm run build` - lulus.
- Tidak ada lagi referensi `localStorage`, `lumora:saved-businesses`, atau `@/lib/bookmarks` di source frontend.
- Smoke test build production lokal:
  - `GET /dashboard` tanpa sesi - `307` ke `/login?next=%2Fdashboard`.
  - `GET /explore` - `200`.
  - `GET /business/kopi-ruang-senja` - `200`.
  - `GET /verify-email` - `200`.
- Smoke test backend production tanpa sesi:
  - `GET /api/v1/bookmarks` - `401 unauthenticated`.
  - `POST /api/v1/bookmarks/kopi-ruang-senja` - `401 unauthenticated`.
  - `PATCH /api/v1/auth/me` - `401 unauthenticated`.
  - `POST /api/v1/auth/change-password` - `401 unauthenticated`.
  - `DELETE /api/v1/auth/me` - `401 unauthenticated`.
- `backend: go test ./... -count=1` - lulus.
- `backend: gofmt -l .` - lulus.
- `backend: go vet ./...` - lulus.
- `git diff --check` - lulus.
- `frontend: npm run lint` - masih gagal hanya pada baseline lama:
  - `components/chart-area-interactive.tsx:149` memanggil `setState` langsung di effect.
  - `hooks/use-mobile.ts:14` memanggil `setState` langsung di effect.
  - Enam warning unused di `components/sections/ai-section.tsx` dan `components/site-header.tsx`.

## Rencana Tahap 6

- Menghapus fallback data bisnis lokal dari fetch production.
- Menghapus `generateStaticParams` yang masih berasal dari data dummy.
- Mengganti featured businesses homepage dengan respons API live.
- Menghapus label dan copy yang masih menyebut seluruh profil sebagai data contoh.
- Menghapus file data bisnis lokal setelah tidak ada pemakaian runtime.
- Memastikan kegagalan backend tampil sebagai error/empty state yang jujur, bukan menyajikan mock seolah data live.

## Tahap 6 - Menghapus Mock dan Sumber Data Ganda

### Implementasi

- `frontend/lib/api.ts` tidak lagi mengimpor atau memakai data contoh. `fetchBusinesses` melempar error saat HTTP gagal, JSON rusak, atau bentuk respons tidak valid; `fetchBusinessBySlug` hanya mengembalikan `null` pada `404` dan melempar error untuk kegagalan lain (500/network) agar gangguan backend tidak menyamar sebagai not-found.
- Homepage (`app/(site)/page.tsx`) menjadi Server Component async: satu kali `GET /businesses?limit=6`, hasilnya diteruskan ke `BusinessDiscoverySection`, `ProfileShowcaseSection`, dan `JourneySection`. Kegagalan fetch menampilkan pesan eksplisit, bukan mock.
- `/explore` mengambil daftar awal server-side; filter `q`/`category` dikirim ke API (bukan filter lokal). Ada state loading, error, dan empty terpisah.
- Detail bisnis menghapus `generateStaticParams` lokal, memakai `next: { revalidate: 60 }`, dan menambah `error.tsx` untuk kegagalan backend.
- Halaman editorial "Untuk Mitra" memakai `GET /businesses?limit=3`; ilustrasi statis (form/timeline/mockup) tetap diberi label contoh.
- Semua copy "data contoh" pada listing/detail live diganti dengan label faktual ("informasi dikirim pemilik, belum diverifikasi LUMORA"). Label contoh tetap dipertahankan pada mockup AI/editorial/admin yang memang statis.
- `frontend/data/businesses.ts` dihapus. Tidak ada lagi import runtime ke file itu.

### Keputusan

- Kegagalan backend tidak lagi ditutupi mock. Ini membuat error dan empty state jujur, dan membuat smoke test/E2E tidak bisa lulus palsu saat backend mati.
- Tampilan contoh pada AI/editorial/admin tetap ada karena itu demonstrasi produk, bukan listing live.

### File yang Ditambahkan

- `frontend/app/(site)/business/[slug]/error.tsx`

### File yang Dihapus

- `frontend/data/businesses.ts`

### File yang Diubah

- `frontend/lib/api.ts`
- `frontend/app/(site)/page.tsx`
- `frontend/app/(site)/explore/page.tsx`
- `frontend/app/(site)/business/[slug]/page.tsx`
- `frontend/app/(site)/kebijakan-privasi/page.tsx`
- `frontend/components/business/business-discovery-explorer.tsx`
- `frontend/components/business/business-card.tsx`
- `frontend/components/business/revenue-chart.tsx`
- `frontend/components/sections/business-discovery-section.tsx`
- `frontend/components/sections/profile-showcase-section.tsx`
- `frontend/components/sections/journey-section.tsx`

### Hasil Pengujian

- `frontend: npx tsc --noEmit` - lulus.
- `frontend: npm run build` - lulus.
- Pencarian `@/data/businesses` - tidak ada lagi referensi.
- `frontend: npm run test` - lulus (unit test `lib/api.ts` membuktikan perilaku tanpa fallback).

## Tahap 7 - Autentikasi dan API Admin

### Implementasi Backend

- Migration `0006_admin_role.sql`: constraint `users.role` menerima `umkm`, `mitra`, `admin`.
- `domain.ValidRole` menerima `admin` (role internal), sedangkan `domain.ValidRegistrationRole` menolak `admin`. `RegisterParams.Validate` memakai validator registrasi, jadi registrasi publik tidak bisa membuat akun admin.
- Middleware `RequireAdmin`: `401 unauthenticated` tanpa sesi, `403 forbidden` untuk non-admin, lolos untuk `admin`.
- Endpoint read-only `GET /api/v1/admin/overview` (di grup `/admin` dengan `RequireSession` + `RequireAdmin`). Mengembalikan metrik user/profil, pertumbuhan enam bulan, dan 10 profil terbaru. Tidak mengekspos password/hash.
- `cmd/provision-admin`: registrasi akun admin di luar HTTP. Password dibaca dari stdin (bukan argumen/seed), memakai `auth.HashPassword`, menandai email terverifikasi, gagal jika email sudah ada, tidak membuat sesi, dan tidak mencetak kredensial. Binary ditambahkan ke Dockerfile.

### Implementasi Frontend

- `UserRole` menjadi `"umkm" | "mitra" | "admin"`.
- `lib/api.ts`: `AdminOverview` + `fetchAdminOverview` (tanpa fallback mock).
- `/admin` menjadi Server Component: validasi sesi lewat `/auth/me`, redirect ke `/admin/login` bila belum login, dan ke `/` bila bukan admin; lalu memuat overview. Angka/aktivitas demo yang tidak didukung schema dihapus.
- `/admin/login` memakai `POST /auth/login` sungguhan; jika user bukan admin, langsung logout dan menampilkan akses ditolak.
- `admin-shell.tsx` menampilkan nama admin dan aksi logout nyata; badge "Prototype Mode" dan link demo dihapus.
- Modul lain di sidebar tetap ditandai belum memiliki kontrak API (tidak ada endpoint mutasi yang dibuat sebelum ada aturannya).

### Keputusan

- Tidak ada endpoint admin mutasi (approve/reject/delete/promote) karena belum ada aturan produk dan audit-nya. Endpoint tanpa konsumen hanya memperluas attack surface.
- Akun admin tidak dibuat lewat registrasi, seed, atau `PATCH /auth/me`; hanya lewat `cmd/provision-admin` yang dijalankan operator.
- Model "menunggu review" pada UI lama tidak dipaksakan ke schema; `verified` tetap badge boolean tanpa alur moderasi.

### File yang Ditambahkan (Backend)

- `backend/migrations/0006_admin_role.sql`
- `backend/internal/domain/admin.go`
- `backend/internal/service/admin.go`
- `backend/internal/http/handler/admin.go`
- `backend/cmd/provision-admin/main.go`
- `backend/internal/http/middleware/admin_test.go`

### File yang Diubah (Backend)

- `backend/internal/domain/user.go`
- `backend/internal/domain/user_test.go`
- `backend/internal/http/middleware/session.go`
- `backend/cmd/api/main.go`
- `backend/Dockerfile`

### File yang Diubah (Frontend)

- `frontend/types/user.ts`
- `frontend/lib/api.ts`
- `frontend/app/admin/page.tsx`
- `frontend/app/admin/login/page.tsx`
- `frontend/app/admin/admin-shell.tsx`

### Hasil Pengujian

- `backend: go test ./... -count=1` - lulus (termasuk `TestAdminRoleIsInternalOnly` dan `TestRequireAdmin`).
- `backend: go vet ./...` dan `gofmt -l .` - lulus.
- `frontend: npx tsc --noEmit` dan `npm run lint` - lulus.
- Smoke test build lokal: `/admin` tanpa sesi - `307` ke `/admin/login`; `/admin/login` - `200`.
- Endpoint admin production belum diuji karena migration dan route belum di-deploy.

## Tahap 8 - Backlog, Dokumentasi, CI, dan Test

### Implementasi

- Lint frontend dijadikan hijau dengan memperbaiki akar masalah, bukan menekan aturan:
  - `hooks/use-mobile.ts` memakai `useSyncExternalStore` (tanpa setState sinkron di effect).
  - `components/chart-area-interactive.tsx` dan `components/site-header.tsx` dihapus karena tidak direferensikan.
  - Fungsi percakapan mati di `components/sections/ai-section.tsx` dihapus; import tak terpakai dibersihkan.
- CI frontend baru `.github/workflows/frontend.yml`: `npm ci` → lint → typecheck → test → build.
- Vitest ditambahkan (`npm run test`) dengan 9 test: `lib/redirect.test.ts` (guard open redirect) dan `lib/api.test.ts` (tanpa fallback mock; `404` vs `500` detail).
- Logika sanitasi redirect login dipindah ke `frontend/lib/redirect.ts` agar bisa diuji.
- Dokumentasi disinkronkan: `README.md`, `CODEBUDDY.md`, `docs/api.md` (checklist dicentang + bagian endpoint admin), `docs/fases.md` (backlog diperbarui).

### Backlog yang sengaja dibiarkan (keputusan keamanan)

- **Reset kata sandi**: butuh tabel token sekali-pakai, transaksi atomik, dan rate limit khusus. Tidak dikerjakan setengah jalan.
- **Unarchive profil**: butuh kontrak status tujuan (`draft`) dan daftar arsip untuk pemilik.
- **Klaim pemilik profil seed**: butuh kebijakan bukti kepemilikan, bukan sekadar `owner_user_id IS NULL`.
- **Rotasi/refresh sesi**: butuh definisi rolling vs absolute lifetime dan penanganan race. Sesi opaque 30 hari tetap dipakai.
- **E2E (Playwright)**: belum dikerjakan; unit test menjadi fondasi.
- **Verifikasi domain Resend**: pekerjaan dashboard operator, bukan kode.

### File yang Ditambahkan

- `.github/workflows/frontend.yml`
- `frontend/vitest.config.ts`
- `frontend/lib/redirect.ts`
- `frontend/lib/redirect.test.ts`
- `frontend/lib/api.test.ts`

### File yang Dihapus

- `frontend/components/chart-area-interactive.tsx`
- `frontend/components/site-header.tsx`

### File yang Diubah

- `frontend/hooks/use-mobile.ts`
- `frontend/components/sections/ai-section.tsx`
- `frontend/app/(site)/login/page.tsx`
- `frontend/package.json`
- `README.md`, `CODEBUDDY.md`, `docs/api.md`, `docs/fases.md`, `farhan.md`

### Hasil Pengujian

- `backend: go test ./... -count=1`, `go vet ./...`, `gofmt -l .` - lulus.
- `frontend: npm run lint` - **hijau** (baseline lama sudah dibereskan).
- `frontend: npx tsc --noEmit` - lulus.
- `frontend: npm run test` - 9 test lulus.
- `frontend: npm run build` - lulus.

## Catatan Production

- Backend belum di-deploy dari perubahan Tahap 7. Setelah `railway up` dari `backend/`, migration `0006` akan jalan otomatis. Prosedur membuat akun admin ada di bagian "Runbook: Membuat Akun Admin".
- Konfigurasi yang tetap perlu diverifikasi operator: `FRONTEND_BASE_URL=https://lumora.bai01.my.id` di Railway dan domain terverifikasi di Resend.

## Runbook: Membuat Akun Admin

Admin tidak bisa dibuat lewat registrasi publik (register menolak role `admin`), seed, atau `PATCH /auth/me`. Hanya lewat `cmd/provision-admin`. Password dibaca dari stdin, akun langsung ditandai email terverifikasi, dan email duplikat akan ditolak.

### Lokal (Docker)

1. Jalankan stack dan pastikan API hidup.

   ```bash
   cd backend
   docker compose up -d
   curl http://localhost:8080/healthz   # {"status":"ok"}
   ```

2. Buat admin. Pilih salah satu:

   Opsi A - di dalam container `api` (DATABASE_URL sudah benar ke `postgres:5432` internal):

   ```bash
   printf 'AdminPassword123!\n' | docker compose run --rm --no-deps -T api /app/provision-admin -name "Admin Utama" -email "admin@lumora.local"
   ```

   Opsi B - `go run` di host (port host Postgres = `5433` karena bentrok 5432):

   ```bash
   printf 'AdminPassword123!\n' | env DATABASE_URL="postgres://lumora:lumora@localhost:5433/lumora?sslmode=disable" go run ./cmd/provision-admin -name "Admin Utama" -email "admin@lumora.local"
   ```

3. Verifikasi baris admin benar-benar masuk:

   ```bash
   docker compose exec -T postgres psql -U lumora -d lumora -c "select email, role, email_verified_at from users;"
   ```

4. Login di `http://localhost:3000/admin/login`.

**Gotcha env var:** prefix `DATABASE_URL=...` hanya menempel pada perintah pertama sebelum pipe. Untuk `go run`, bungkus dengan `env DATABASE_URL=... go run`; kalau tidak, `provision-admin` memakai default port `5432` (Postgres lain / DB kosong) sehingga akun tidak dibuat di database LUMORA.

### Production (Railway)

- Deploy backend dulu: `railway up -c --service lumora-backend` (migration `0006` jalan otomatis). Selama ini belum dijalankan, endpoint `GET /api/v1/admin/overview` di produksi masih `404`.
- DB produksi tidak bisa diakses dari internet, jadi `provision-admin` harus dijalankan di dalam network Railway (shell/ssh pada service backend) memakai `DATABASE_URL` internal service.
- Set `FRONTEND_BASE_URL=https://lumora.bai01.my.id`.
- Akun admin lokal **tidak ikut** ke production.

### Kenapa akun lokal tidak bisa dipakai di production

- Akun tersimpan di volume Docker lokal (`backend_lumora-pgdata`), bukan di git.
- Push ke GitHub hanya mengirim kode. Frontend Vercel auto-deploy dari repo, tetapi backend Railway deploy manual (`railway up`). Jadi data tidak pindah, dan akun admin harus dibuat ulang di database produksi.

## Referensi Wajib

1. `docs/api.md` - kontrak endpoint dan checklist integrasi frontend.
2. `docs/fases.md` - keputusan backend dan backlog terbuka.
3. `docs/manual-test.md` - pengujian endpoint lokal dan production.
4. `README.md` - gambaran produk dan arsitektur; status integrasi frontend di dokumen ini masih perlu diperbarui.
5. `CODEBUDDY.md` - aturan arsitektur backend dan deploy Railway; status frontend di dokumen ini juga masih perlu diperbarui.

## Catatan Perubahan

### Tahap 0

Ditambahkan:

- `farhan.md` sebagai catatan progres lintas tahap.
- Matriks akses publik, user, dan admin.
- Keputusan sumber otoritas autentikasi dan autorisasi.
- Kriteria selesai dan rencana Tahap 1.

Diubah:

- Tidak ada kode aplikasi yang diubah pada Tahap 0.

Alasan:

- Tahap ini membekukan batas keamanan sebelum implementasi. Memasang guard admin sekarang akan keliru karena backend belum mempunyai role atau permission admin.

Hasil pengujian:

- `backend: go test ./... -count=1` - lulus.
- `backend: gofmt -l .` - lulus, tidak ada file yang perlu diformat.
- `backend: go vet ./...` - lulus.
- `frontend: npm run build` - lulus.
- `frontend: npm run lint` - gagal karena masalah baseline yang sudah ada:
  - `components/chart-area-interactive.tsx:149` memanggil `setState` langsung di effect.
  - `hooks/use-mobile.ts:14` memanggil `setState` langsung di effect.
  - Enam warning unused di `components/sections/ai-section.tsx` dan `components/site-header.tsx`.
- Dependensi frontend dipasang dengan `npm ci` agar lint/build lokal dapat dijalankan. Tidak ada source aplikasi yang berubah dari proses instalasi ini.
