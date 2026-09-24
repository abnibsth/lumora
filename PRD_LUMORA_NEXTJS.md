# Product Requirements Document (PRD)

# LUMORA --- Digital Pitching & Discovery Platform untuk UMKM

**Versi:** 2.0\
**Status:** Landing Page MVP Specification\
**Platform:** Web\
**Frontend:** Next.js\
**Styling:** Tailwind CSS\
**Bahasa utama:** Bahasa Indonesia\
**Design direction:** Marketplace/discovery-first, terinspirasi pola UX
Contra namun dengan identitas visual LUMORA sendiri

------------------------------------------------------------------------

## 1. Ringkasan Produk

LUMORA adalah platform digital pitching dan discovery untuk membantu
UMKM mikro dan kecil mempresentasikan bisnis mereka secara lebih
profesional dan terhubung dengan calon pemodal atau mitra bisnis.

LUMORA bukan platform crowdfunding dan tidak memproses transaksi
investasi secara langsung. Fokus produk adalah membantu UMKM membangun
profil bisnis yang kredibel, menceritakan perjalanan usaha, menyajikan
data usaha secara lebih terstruktur, serta memudahkan pemodal menemukan
dan memahami UMKM yang relevan.

Landing page merupakan pintu masuk utama LUMORA. Halaman ini harus
mampu:

1.  Menjelaskan LUMORA dalam beberapa detik.
2.  Menunjukkan contoh nyata bagaimana profil UMKM tampil.
3.  Menjelaskan manfaat untuk dua persona: UMKM dan Pemodal/Mitra.
4.  Memperkenalkan fitur AI LUMORA.
5.  Membangun kepercayaan tanpa memberikan kesan bahwa LUMORA adalah
    platform investasi/transaksi.
6.  Mendorong pengguna menuju registrasi atau eksplorasi bisnis.

------------------------------------------------------------------------

## 2. Problem Statement

Banyak UMKM mikro dan kecil memiliki bisnis yang berjalan dan berpotensi
berkembang, tetapi belum memiliki cara yang mudah untuk mempresentasikan
bisnisnya secara profesional kepada calon mitra atau pemodal.

Berdasarkan PRD awal LUMORA, masalah yang ingin diselesaikan meliputi:

-   Banyak pelaku UMKM masih bergantung pada modal pribadi.
-   Usaha mikro sering belum memiliki badan hukum atau laporan keuangan
    profesional.
-   Data bisnis masih tersebar atau dicatat secara sederhana.
-   Pemilik usaha belum terbiasa membuat profil bisnis, pitch, atau
    Business Model Canvas.
-   Calon pemodal sulit menemukan dan melakukan penilaian awal terhadap
    UMKM kecil secara terstruktur.

LUMORA menjembatani kesenjangan tersebut melalui digital business
profile, business journey, data visualization, BMC, discovery hub, dan
bantuan AI.

------------------------------------------------------------------------

## 3. Product Positioning

### Positioning Statement

> **Bisnis kecil juga layak untuk dilihat.**

LUMORA membantu UMKM mengubah cerita, data sederhana, dan perjalanan
bisnis mereka menjadi profil digital yang lebih profesional agar lebih
mudah ditemukan oleh calon mitra dan pemodal.

### Supporting Message

> Bangun profil bisnis, ceritakan perjalanan usahamu, dan temukan
> peluang kolaborasi bersama LUMORA.

### Product Category

LUMORA diposisikan sebagai:

**Digital Pitching + Business Discovery Platform**

Bukan sebagai:

-   Crowdfunding platform
-   Payment gateway
-   Escrow service
-   Marketplace saham
-   Pemberi rekomendasi investasi
-   Pengganti legal due diligence

------------------------------------------------------------------------

## 4. Goals

### 4.1 Business Goals

-   Meningkatkan awareness terhadap LUMORA.
-   Mendapatkan pendaftar awal dari UMKM.
-   Mendapatkan pendaftar awal dari pemodal/mitra.
-   Menguji apakah konsep digital pitching UMKM menarik bagi kedua sisi
    pengguna.
-   Mengarahkan pengguna menuju aplikasi utama LUMORA.

### 4.2 User Goals --- UMKM

Pengguna UMKM harus memahami bahwa mereka dapat:

-   Membuat profil bisnis dengan mudah.
-   Menampilkan cerita dan perjalanan bisnis.
-   Menyajikan informasi usaha secara profesional.
-   Mendapat bantuan AI untuk menyusun profil dan BMC.
-   Menampilkan perkembangan bisnis.
-   Membuka peluang ditemukan calon mitra.

### 4.3 User Goals --- Pemodal/Mitra

Pengguna pemodal harus memahami bahwa mereka dapat:

-   Menjelajahi UMKM berdasarkan kategori.
-   Membaca profil usaha secara terstruktur.
-   Melihat business journey dan indikator perkembangan.
-   Menggunakan AI untuk mendapatkan ringkasan awal.
-   Menemukan usaha yang relevan untuk dipelajari lebih lanjut.

------------------------------------------------------------------------

## 5. Non-Goals

Landing page MVP tidak mencakup:

-   Transaksi investasi.
-   Transfer dana.
-   Escrow.
-   Pembelian saham.
-   Perjanjian investasi digital.
-   Legal verification lengkap.
-   KYC tingkat lembaga keuangan.
-   Rekomendasi investasi otomatis.
-   Sistem scoring yang menyatakan sebuah UMKM "layak investasi".
-   Dashboard aplikasi penuh.
-   Chatbot AI production.
-   BMC generator production.

Fitur aplikasi yang belum tersedia dapat direpresentasikan melalui
product preview/mockup selama jelas merupakan preview fitur LUMORA.

------------------------------------------------------------------------

## 6. Target User

### 6.1 Pelaku UMKM

Contoh:

-   Warung makan
-   Kedai kopi independen
-   Bengkel
-   Toko lokal
-   Jasa rumahan
-   Brand fashion lokal
-   Kerajinan
-   Usaha kreatif
-   Usaha mikro dan kecil lainnya

Kebutuhan:

-   Tidak memahami pitching bisnis.
-   Tidak memiliki desainer.
-   Data keuangan masih sederhana.
-   Membutuhkan profil usaha yang terlihat profesional.
-   Ingin membuka peluang kerja sama atau ekspansi.

### 6.2 Pemodal / Mitra

Contoh:

-   Investor individu
-   Angel investor
-   Pemilik bisnis lain
-   Calon strategic partner
-   Mitra distribusi
-   Mitra ekspansi

Kebutuhan:

-   Menemukan bisnis kecil potensial.
-   Melihat informasi bisnis dengan cepat.
-   Membandingkan profil usaha.
-   Mendapat gambaran awal sebelum menghubungi pemilik usaha.

------------------------------------------------------------------------

## 7. Design Direction

### 7.1 Prinsip Desain

Landing page menggunakan pendekatan **discovery-first marketplace**.

Referensi UX utama adalah pola seperti Contra:

-   Hero yang kuat dan sederhana.
-   Product-first presentation.
-   Profile cards sebagai bagian penting dari visual.
-   Discovery experience ditampilkan langsung di landing page.
-   Banyak whitespace.
-   Typography besar.
-   Grid modern.
-   Card dengan hierarchy yang jelas.
-   CTA sederhana.
-   Interaksi dan animasi ringan.
-   Visual terasa premium tetapi tetap approachable.

Referensi digunakan sebagai inspirasi pola UX, bukan untuk menyalin
layout, copywriting, branding, ilustrasi, atau aset.

### 7.2 Brand Personality

LUMORA harus terasa:

-   Modern
-   Optimistis
-   Profesional
-   Human
-   Accessible
-   Trustworthy
-   Lokal tetapi tidak terlihat tradisional
-   Technology-enabled, bukan technology-dominated

### 7.3 Hindari

-   Tampilan seperti bank konvensional.
-   Tampilan cryptocurrency.
-   Efek neon berlebihan.
-   Glassmorphism berlebihan.
-   Gradient terlalu ramai.
-   Ilustrasi startup generik sebagai visual utama.
-   Stock photo handshake sebagai hero.
-   Klaim keuntungan investasi.
-   UI yang terlalu padat.

------------------------------------------------------------------------

## 8. Visual Identity

### 8.1 Color System

Base palette:

``` css
--lumora-green: #16BB37;
--lumora-forest: #0F3D2E;
--lumora-mint: #A7E3B0;
--lumora-background: #F6F9F6;
--lumora-surface: #FFFFFF;
--lumora-text: #17212B;
--lumora-muted: #667085;
--lumora-border: #E5EAE6;
```

Warna dapat disesuaikan saat implementasi untuk memastikan WCAG AA.

### 8.2 Tailwind Theme Direction

Gunakan semantic tokens melalui CSS variables dan Tailwind utilities.

Contoh:

``` css
:root {
  --background: 120 20% 97%;
  --foreground: 210 23% 13%;
  --primary: 130 79% 41%;
  --primary-foreground: 0 0% 100%;
  --secondary: 154 60% 15%;
  --muted: 210 10% 45%;
  --border: 130 12% 91%;
  --radius: 1rem;
}
```

Hindari hardcode warna berulang di setiap component.

### 8.3 Typography

Pilihan utama:

-   Geist
-   Inter sebagai fallback

Hierarchy:

-   Hero H1: 56--72px desktop.
-   Section heading: 40--52px desktop.
-   Card title: 18--24px.
-   Body: 16--18px.
-   Supporting text: 14--16px.

Mobile menggunakan fluid/responsive typography.

### 8.4 Radius

-   Small UI: `rounded-lg`
-   Button/input: `rounded-xl`
-   Card: `rounded-2xl`
-   Major product showcase: `rounded-3xl`

### 8.5 Shadow

Gunakan shadow lembut.

Contoh:

``` text
shadow-sm
shadow-md
shadow-[0_20px_60px_rgba(15,61,46,0.10)]
```

Hindari shadow hitam tebal.

------------------------------------------------------------------------

## 9. Information Architecture

``` text
/
├── Navbar
├── Hero
├── Trust / Quick Benefits
├── Problem
├── Featured Businesses
├── Value Proposition
├── How It Works
├── AI Features
├── Business Profile Showcase
├── Business Journey
├── For UMKM / For Pemodal
├── Social Proof
├── FAQ
├── Final CTA
└── Footer
```

------------------------------------------------------------------------

# 10. Landing Page Specification

## 10.1 Navbar

### Objective

Memberikan navigasi sederhana dan CTA yang selalu mudah ditemukan.

### Desktop

Left:

-   Logo LUMORA

Center/right:

-   Beranda
-   Jelajahi UMKM
-   Cara Kerja
-   Fitur
-   Tentang
-   FAQ

Actions:

-   Masuk
-   Daftar

### Mobile

-   Logo.
-   Hamburger menu.
-   Drawer/menu.
-   CTA Daftar terlihat jelas.

### Behavior

-   Sticky navbar.
-   Background transparan di posisi awal.
-   Setelah scroll menggunakan white/blur surface.
-   Anchor link smooth scroll.

------------------------------------------------------------------------

## 10.2 Hero Section

### Eyebrow

`Platform Digital Pitching untuk UMKM`

### Primary Headline

> **Bisnis Kecil Juga Layak untuk Dilihat.**

### Supporting Copy

> LUMORA membantu UMKM mempresentasikan bisnisnya secara profesional,
> membangun profil dengan bantuan AI, dan terhubung dengan calon pemodal
> serta mitra bisnis yang tepat.

### Primary CTA

`Daftarkan UMKM`

### Secondary CTA

`Jelajahi Bisnis`

### Micro Trust Indicators

-   Proses mudah
-   Dibantu AI
-   Gratis untuk memulai

### Hero Visual

Jangan menggunakan ilustrasi abstrak sebagai visual utama.

Gunakan layered product UI:

1.  Dashboard/profile preview.
2.  Floating business card.
3.  Revenue mini chart.
4.  AI summary card.
5.  Verification/status badge.

Example business:

**Kopi Ruang Senja**

``` text
F&B · Bandung
3 tahun berjalan
Rp18,4 jt / bulan
+23% dalam 6 bulan
Sedang mencari: Mitra ekspansi
```

Angka merupakan dummy/demo dan harus diberi konteks sebagai contoh jika
ditampilkan pada production landing page.

------------------------------------------------------------------------

## 10.3 Problem Section

### Eyebrow

`Masalah yang Ada`

### Heading

> Banyak UMKM potensial belum mendapatkan kesempatan untuk terlihat.

### Main Statistic

`86,74%`

Supporting copy:

> Berdasarkan sumber yang digunakan dalam PRD awal LUMORA, sebagian
> besar pengusaha UMKM masih bergantung pada modal pribadi.

Tambahkan source label yang jelas.

### Supporting Problem Cards

Card 1:

**Administrasi menjadi hambatan**

Usaha mikro sering belum memiliki dokumentasi bisnis yang dibutuhkan
platform formal.

Card 2:

**Potensi sulit terlihat**

Bisnis yang berkembang secara lokal belum tentu memiliki media untuk
menceritakan perkembangan usahanya.

Card 3:

**Data masih sederhana**

Informasi bisnis sering tersebar dalam catatan manual dan sulit
disajikan kepada calon mitra.

------------------------------------------------------------------------

## 10.4 Featured Businesses / Discovery Preview

Ini adalah salah satu section terpenting.

### Eyebrow

`Temukan Bisnis`

### Heading

> Temukan cerita bisnis yang layak untuk dikenal.

### Supporting Copy

> Jelajahi UMKM dari berbagai kategori dan lihat bagaimana mereka
> tumbuh.

### Filter Pills

-   Semua
-   F&B
-   Retail
-   Jasa
-   Kreatif
-   Fashion

### Business Card Anatomy

Setiap card berisi:

-   Cover image.
-   Logo/avatar.
-   Business name.
-   Category.
-   Location.
-   Short description.
-   Business age.
-   Revenue indicator/demo metric.
-   Growth indicator.
-   Seeking status.
-   Bookmark button.
-   `Lihat Profil →`

Example:

``` text
Kopi Ruang Senja
F&B · Bandung

Kedai kopi independen dengan konsep ruang komunitas.

3 tahun berjalan
Rp18,4 jt/bln
+23% / 6 bulan

Mencari:
Mitra Ekspansi

[Lihat Profil →]
```

### Desktop

3 cards per row.

### Tablet

2 cards.

### Mobile

Horizontal carousel atau 1 card per row.

### CTA

`Jelajahi Semua Bisnis`

------------------------------------------------------------------------

## 10.5 Value Proposition

### Heading

> Dari cerita sederhana menjadi profil bisnis yang lebih meyakinkan.

Tiga value cards:

### 01 --- Ceritakan Bisnismu

Pemilik UMKM memasukkan informasi sederhana tentang usaha dan perjalanan
bisnis.

### 02 --- Susun dengan Bantuan AI

AI membantu membuat draft profil dan Business Model Canvas yang tetap
dapat diedit pengguna.

### 03 --- Ditemukan Mitra

Profil masuk ke discovery hub sehingga calon mitra dapat mempelajari
bisnis tersebut.

------------------------------------------------------------------------

## 10.6 How It Works

Gunakan segmented tabs:

`Untuk UMKM` \| `Untuk Pemodal`

Default: Untuk UMKM.

### UMKM Flow

1.  **Buat akun** Isi informasi dasar.

2.  **Bangun profil** Ceritakan bisnis, produk, perjalanan, dan
    kebutuhan.

3.  **Dibantu AI** Generate draft profile dan BMC.

4.  **Publikasikan** Profil tampil di discovery hub.

5.  **Terhubung** Calon mitra dapat menemukan dan menghubungi UMKM.

### Pemodal Flow

1.  **Jelajahi** Cari bisnis berdasarkan kategori.

2.  **Pelajari** Buka business profile.

3.  **Pahami** Lihat journey dan data perkembangan.

4.  **Gunakan AI** Dapatkan ringkasan informasi yang tersedia.

5.  **Hubungi** Mulai percakapan dengan pemilik bisnis.

------------------------------------------------------------------------

## 10.7 AI Feature Section

### Eyebrow

`Lumora AI`

### Heading

> AI yang membantu, bukan mengambil keputusan.

Ini penting untuk positioning.

### Feature A --- AI Profile & BMC Assistant

Untuk UMKM.

Capabilities:

-   Mengubah jawaban sederhana menjadi draft profil.
-   Membantu menyusun value proposition.
-   Generate draft BMC.
-   Memberikan saran struktur.
-   Semua hasil dapat diedit.

Visual:

Prompt/input di sebelah kiri → generated profile/BMC preview di sebelah
kanan.

### Feature B --- AI Business Discovery Assistant

Untuk pemodal.

Example prompt:

> "Tampilkan UMKM F&B di Bandung dengan pertumbuhan positif."

Response UI:

``` text
Saya menemukan beberapa profil yang sesuai
dengan filter tersebut.

Kopi Ruang Senja
F&B · Bandung
+23% / 6 bulan

[Lihat Profil]
```

AI tidak boleh memberikan klaim:

-   "Pasti menguntungkan"
-   "Investasi terbaik"
-   "Risiko rendah"
-   "Layak dibeli"

AI hanya merangkum informasi yang tersedia.

------------------------------------------------------------------------

## 10.8 Business Profile Showcase

### Heading

> Satu profil. Seluruh cerita bisnis.

Gunakan product screenshot/mockup besar.

Profile terdiri dari:

``` text
Business Header
├── Cover
├── Logo
├── Business Name
├── Category
├── Location
├── Verification/status
└── Contact CTA

Overview
├── About
├── Founder
├── Founded
└── Team

Business Metrics
├── Revenue trend
├── Business age
└── Growth

Business Journey
├── Timeline
└── Milestones

Business Model Canvas

Seeking
├── Partnership type
└── Business objective
```

------------------------------------------------------------------------

## 10.9 Business Journey Section

### Heading

> Bukan hanya angka. Lihat perjalanan di balik bisnisnya.

Timeline visual:

``` text
2023
Kopi Ruang Senja dibuka
        ↓
2024
Mencapai 100 pelanggan pertama
        ↓
2025
Menambah menu & kapasitas
        ↓
2026
Mencari mitra untuk ekspansi
```

Tujuan section ini adalah membuat LUMORA terasa human dan berbeda dari
direktori finansial biasa.

------------------------------------------------------------------------

## 10.10 Dual Persona Section

Dua card besar.

### Card A --- Pelaku UMKM

Heading:

> Buat bisnismu lebih mudah ditemukan.

Benefits:

-   Profil profesional.
-   AI profile assistant.
-   Business journey.
-   BMC builder.
-   Exposure ke calon mitra.

CTA:

`Mulai Buat Profil`

### Card B --- Pemodal / Mitra

Heading:

> Temukan bisnis yang ingin kamu kenal lebih jauh.

Benefits:

-   Discovery hub.
-   Category filtering.
-   Business profile.
-   AI summary.
-   Business journey.

CTA:

`Mulai Menjelajah`

------------------------------------------------------------------------

## 10.11 Social Proof

Jika belum memiliki pengguna/testimoni nyata, jangan membuat testimoni
palsu.

Untuk MVP gunakan salah satu:

### Option A

`Dibangun untuk mendukung pelaku usaha lokal.`

Tampilkan kategori bisnis.

### Option B

Demo testimonial dengan label eksplisit:

`Contoh pengalaman pengguna`

Untuk production, section harus diganti dengan testimoni pengguna nyata.

------------------------------------------------------------------------

## 10.12 FAQ

Gunakan accessible accordion.

Pertanyaan:

### Apa itu LUMORA?

LUMORA adalah platform digital pitching dan discovery yang membantu UMKM
mempresentasikan bisnisnya dan ditemukan calon mitra atau pemodal.

### Apakah LUMORA platform crowdfunding?

Tidak. LUMORA tidak memproses transaksi investasi atau pembayaran.

### Apakah UMKM harus berbadan hukum?

Untuk konsep MVP, profil ditujukan agar bisnis mikro/kecil dapat mulai
mempresentasikan usahanya tanpa proses onboarding seberat platform
pendanaan formal. Persyaratan final harus disesuaikan dengan kebijakan
produk saat aplikasi production.

### Apa fungsi AI di LUMORA?

AI membantu menyusun draft profil, BMC, serta merangkum informasi
bisnis. Pengguna tetap dapat memeriksa dan mengedit hasil AI.

### Apakah LUMORA menentukan bisnis yang layak diinvestasikan?

Tidak. LUMORA menyediakan informasi dan tools untuk membantu proses
discovery awal. Keputusan kerja sama tetap dilakukan oleh masing-masing
pihak.

### Apakah menggunakan LUMORA gratis?

Untuk MVP dapat menggunakan pesan `Gratis untuk memulai`. Detail pricing
final belum menjadi bagian scope landing page ini.

------------------------------------------------------------------------

## 10.13 Final CTA

Background dark forest green.

Headline:

> **Setiap bisnis punya cerita yang layak untuk ditemukan.**

Supporting:

> Mulai bangun profil bisnismu atau temukan UMKM yang menarik untuk kamu
> kenal lebih jauh.

Buttons:

`Daftarkan UMKM`

`Jelajahi Bisnis`

Tambahkan subtle decorative grid/glow.

------------------------------------------------------------------------

## 10.14 Footer

Columns:

### Product

-   Jelajahi UMKM
-   Cara Kerja
-   Fitur
-   Tentang

### Untuk UMKM

-   Buat Profil
-   Business Journey
-   BMC
-   AI Assistant

### Untuk Pemodal

-   Discovery
-   Business Profile
-   AI Discovery

### Company

-   Tentang LUMORA
-   FAQ
-   Kontak

Bottom:

``` text
© 2026 LUMORA
Privacy Policy
Terms of Service
```

Social links hanya ditampilkan jika akun benar-benar tersedia.

------------------------------------------------------------------------

# 11. Responsive Requirements

## Mobile

Target minimum width:

`320px`

Priorities:

-   Hero stack vertically.
-   H1 tetap readable.
-   Product mockup tidak overflow.
-   CTA menjadi full-width bila diperlukan.
-   Discovery card dapat horizontal scroll.
-   Navbar menjadi mobile menu.
-   Section spacing dikurangi.
-   No hover-only functionality.

## Tablet

-   2-column cards.
-   Hero dapat mulai menggunakan split layout.
-   Product visual disederhanakan.

## Desktop

Target content max width:

``` text
max-w-7xl
```

Common container:

``` html
<div class="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
```

------------------------------------------------------------------------

# 12. Technical Stack

## Core

-   Next.js
-   React
-   TypeScript
-   Tailwind CSS

Gunakan versi stable terbaru yang kompatibel saat project dibuat.

## Next.js Architecture

Gunakan:

-   App Router
-   Server Components secara default.
-   Client Components hanya untuk interaksi.
-   `next/image`
-   `next/font`
-   Metadata API.
-   Static rendering untuk marketing content jika memungkinkan.

## Optional Supporting Libraries

Boleh digunakan jika dibutuhkan:

-   Lucide React --- icons.
-   Framer Motion / Motion --- animation.
-   Radix UI --- accessible primitives.
-   clsx.
-   tailwind-merge.
-   class-variance-authority.

Hindari dependency besar jika kebutuhan dapat diselesaikan dengan
React + Tailwind.

------------------------------------------------------------------------

# 13. Recommended Project Structure

``` text
lumora/
│
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   ├── globals.css
│   ├── not-found.tsx
│   │
│   └── (marketing)/
│
├── components/
│   ├── layout/
│   │   ├── navbar.tsx
│   │   ├── mobile-nav.tsx
│   │   ├── footer.tsx
│   │   └── container.tsx
│   │
│   ├── sections/
│   │   ├── hero-section.tsx
│   │   ├── problem-section.tsx
│   │   ├── business-discovery-section.tsx
│   │   ├── value-section.tsx
│   │   ├── how-it-works-section.tsx
│   │   ├── ai-section.tsx
│   │   ├── profile-showcase-section.tsx
│   │   ├── journey-section.tsx
│   │   ├── persona-section.tsx
│   │   ├── social-proof-section.tsx
│   │   ├── faq-section.tsx
│   │   └── final-cta-section.tsx
│   │
│   ├── business/
│   │   ├── business-card.tsx
│   │   ├── business-metric.tsx
│   │   ├── business-profile-preview.tsx
│   │   └── business-journey.tsx
│   │
│   └── ui/
│       ├── button.tsx
│       ├── badge.tsx
│       ├── accordion.tsx
│       ├── tabs.tsx
│       └── section-heading.tsx
│
├── data/
│   ├── businesses.ts
│   ├── faq.ts
│   └── navigation.ts
│
├── lib/
│   ├── utils.ts
│   └── constants.ts
│
├── public/
│   ├── images/
│   ├── businesses/
│   └── logo/
│
├── types/
│   └── business.ts
│
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

Struktur dapat mengikuti kebutuhan versi Next.js yang digunakan; jangan
membuat route group kosong jika tidak diperlukan.

------------------------------------------------------------------------

# 14. Component Rules

Setiap section harus:

-   Berdiri sebagai component terpisah.
-   Tidak memiliki data dummy besar yang hardcoded jika dapat
    dipindahkan ke `/data`.
-   Menggunakan reusable primitives.
-   Responsive.
-   Accessible.
-   Mendukung perubahan copy tanpa mengubah struktur component secara
    besar.

Contoh:

``` tsx
<HeroSection />
<ProblemSection />
<BusinessDiscoverySection />
<ValueSection />
<HowItWorksSection />
<AIFeaturesSection />
<ProfileShowcaseSection />
<BusinessJourneySection />
<PersonaSection />
<FAQSection />
<FinalCTASection />
```

------------------------------------------------------------------------

# 15. Data Model --- Demo Business

``` ts
export interface Business {
  id: string
  slug: string
  name: string
  category: string
  location: string
  description: string
  coverImage: string
  logo?: string
  foundedYear: number
  revenueLabel?: string
  growthLabel?: string
  seeking?: string[]
  verified?: boolean
}
```

Example:

``` ts
{
  id: "kopi-ruang-senja",
  slug: "kopi-ruang-senja",
  name: "Kopi Ruang Senja",
  category: "F&B",
  location: "Bandung",
  description: "Kedai kopi independen dengan konsep ruang komunitas.",
  coverImage: "/businesses/kopi-ruang-senja.webp",
  foundedYear: 2023,
  revenueLabel: "Rp18,4 jt/bln",
  growthLabel: "+23% / 6 bulan",
  seeking: ["Mitra Ekspansi"],
  verified: true
}
```

Semua bisnis dan metrik pada landing page MVP dapat menggunakan dummy
data, tetapi jangan dipresentasikan sebagai data bisnis nyata.

------------------------------------------------------------------------

# 16. Tailwind CSS Guidelines

## Layout

Prefer:

``` text
max-w-7xl
mx-auto
px-4 sm:px-6 lg:px-8
```

Section spacing:

``` text
py-16 md:py-24 lg:py-32
```

Grid:

``` text
grid
md:grid-cols-2
lg:grid-cols-3
gap-6
```

## Buttons

Primary:

``` text
bg-[#0F3D2E]
text-white
hover:bg-[#0B3024]
rounded-xl
```

Accent CTA:

``` text
bg-[#16BB37]
text-white
hover:brightness-95
```

Secondary:

``` text
border
border-slate-200
bg-white
text-slate-900
```

## Card

Typical:

``` text
rounded-2xl
border
border-slate-200/70
bg-white
shadow-sm
transition
```

Hover:

``` text
hover:-translate-y-1
hover:shadow-md
```

Jangan memberikan hover transform pada semua elemen. Gunakan hanya untuk
interactive cards.

------------------------------------------------------------------------

# 17. Animation Guidelines

Animasi harus subtle.

Allowed:

-   Fade in.
-   Translate Y 10--20px.
-   Card hover lift 2--4px.
-   Gentle hero floating cards.
-   Accordion transition.
-   Tab transitions.
-   Image scale maksimal sekitar 1.02--1.04.

Duration:

`200–500ms`

Respect:

``` css
@media (prefers-reduced-motion: reduce) {
  /* disable non-essential animations */
}
```

Hindari:

-   Scroll hijacking.
-   Parallax ekstrem.
-   Continuous large animations.
-   Loading animation yang memperlambat LCP.

------------------------------------------------------------------------

# 18. Accessibility

Target minimum WCAG AA.

Requirements:

-   Semantic HTML.
-   Satu H1 per page.
-   Heading hierarchy benar.
-   Semua image memiliki `alt`.
-   Decorative image menggunakan empty alt.
-   Visible keyboard focus.
-   Buttons menggunakan `<button>`.
-   Links menggunakan `<a>` / Next Link.
-   Accordion keyboard accessible.
-   Mobile navigation keyboard accessible.
-   Color bukan satu-satunya indikator status.
-   Contrast diperiksa sebelum production.
-   Respect reduced motion.

------------------------------------------------------------------------

# 19. SEO

## Title

`LUMORA — Digital Pitching untuk UMKM`

## Description

`Bangun profil bisnis UMKM yang lebih profesional, ceritakan perjalanan usahamu, dan temukan peluang kolaborasi bersama LUMORA.`

## Metadata

Implement:

-   title
-   description
-   canonical
-   Open Graph
-   Twitter/X card bila relevan
-   favicon
-   robots
-   sitemap

Gunakan Next.js Metadata API.

### Structured Data

Pertimbangkan:

-   `Organization`
-   `WebSite`
-   `FAQPage` jika konten dan kebijakan search engine saat implementasi
    mendukung.

------------------------------------------------------------------------

# 20. Performance

Targets:

### Lighthouse

-   Performance ≥ 90
-   Accessibility ≥ 90
-   Best Practices ≥ 90
-   SEO ≥ 90

### Core Web Vitals

Target:

-   LCP \< 2.5s
-   CLS \< 0.1
-   INP \< 200ms

Implementation:

-   `next/image`.
-   WebP/AVIF.
-   Image dimensions ditentukan.
-   Lazy load below-the-fold images.
-   Hero image diprioritaskan hanya jika benar-benar LCP element.
-   Hindari client JS yang tidak diperlukan.
-   Font melalui `next/font`.
-   Avoid unnecessary third-party scripts.

------------------------------------------------------------------------

# 21. Interaction Requirements

Landing page minimal memiliki:

-   Sticky navbar.
-   Mobile navigation.
-   Smooth anchor navigation.
-   UMKM/Pemodal tabs.
-   Business category filters.
-   Business card interaction.
-   FAQ accordion.
-   CTA hover/focus states.
-   Responsive product preview.

Filter pada MVP dapat bekerja terhadap static demo data di client tanpa
backend.

------------------------------------------------------------------------

# 22. CTA Mapping

  CTA                 Destination MVP
  ------------------- ----------------------------------------
  Daftarkan UMKM      `/register?role=umkm`
  Daftar              `/register`
  Masuk               `/login`
  Jelajahi Bisnis     `/explore` atau `#businesses`
  Lihat Profil        `/business/[slug]` jika route tersedia
  Mulai Buat Profil   `/register?role=umkm`
  Mulai Menjelajah    `/explore`

Jika route aplikasi belum tersedia, CTA boleh diarahkan ke placeholder
page yang jelas dan tidak menghasilkan 404.

------------------------------------------------------------------------

# 23. Content Rules

Copywriting harus:

-   Bahasa Indonesia natural.
-   Singkat.
-   Tidak terlalu formal.
-   Tidak memakai jargon finansial tanpa penjelasan.
-   Tidak menjanjikan pendanaan.
-   Tidak menjanjikan keuntungan.
-   Tidak menyebut AI sebagai pengganti keputusan manusia.
-   Fokus pada discovery, storytelling, dan business presentation.

Prefer:

> Temukan bisnis yang ingin kamu kenal lebih jauh.

Avoid:

> Temukan investasi paling menguntungkan.

Prefer:

> AI membantu merangkum informasi bisnis.

Avoid:

> AI menentukan bisnis terbaik untuk investasi.

------------------------------------------------------------------------

# 24. Trust & Transparency

Landing page harus secara eksplisit menjelaskan:

-   LUMORA bukan crowdfunding.
-   LUMORA tidak memproses transaksi investasi.
-   Informasi profil berasal dari data yang diberikan pengguna.
-   AI menghasilkan bantuan/draft dan dapat memiliki kesalahan.
-   Pengguna bertanggung jawab melakukan validasi sebelum kerja sama.

Trust indicators dapat dikembangkan kemudian:

-   Profile completeness.
-   Verified contact.
-   Data updated date.
-   Business documentation status.

Jangan menggunakan badge `Verified` seolah-olah telah melalui legal due
diligence jika proses tersebut belum benar-benar tersedia.

------------------------------------------------------------------------

# 25. Analytics Events

Persiapkan naming event:

``` text
landing_view
hero_umkm_cta_click
hero_explore_click
business_filter_click
business_card_click
how_it_works_tab_change
ai_feature_view
faq_open
final_umkm_cta_click
final_explore_cta_click
register_click
login_click
```

Provider analytics belum ditentukan dalam scope ini.

------------------------------------------------------------------------

# 26. MVP Acceptance Criteria

Landing page dianggap selesai apabila:

-   [ ] Berjalan menggunakan Next.js.
-   [ ] Menggunakan TypeScript.
-   [ ] Styling menggunakan Tailwind CSS.
-   [ ] Tidak ada horizontal overflow pada 320px.
-   [ ] Navbar responsive.
-   [ ] Hero memiliki dual CTA.
-   [ ] Product UI/mockup terlihat pada hero.
-   [ ] Problem section tersedia.
-   [ ] Source statistik ditampilkan.
-   [ ] Discovery section menampilkan minimal 6 demo business.
-   [ ] Category filter bekerja.
-   [ ] UMKM/Pemodal tab bekerja.
-   [ ] AI feature section tersedia.
-   [ ] Business profile showcase tersedia.
-   [ ] Business journey tersedia.
-   [ ] Dual persona section tersedia.
-   [ ] FAQ accordion bekerja.
-   [ ] Final CTA tersedia.
-   [ ] Footer tersedia.
-   [ ] Semua CTA tidak menuju 404.
-   [ ] Keyboard navigation berfungsi.
-   [ ] Reduced motion diperhatikan.
-   [ ] Metadata SEO tersedia.
-   [ ] Images dioptimasi.
-   [ ] Lighthouse target mendekati/menembus 90.
-   [ ] Tidak ada testimonial palsu.
-   [ ] Tidak ada klaim keuntungan investasi.
-   [ ] Tidak ada klaim AI sebagai penentu kelayakan investasi.

------------------------------------------------------------------------

# 27. Development Phases

## Phase 1 --- Foundation

-   Setup Next.js.
-   Setup Tailwind CSS.
-   Font.
-   CSS variables.
-   Container.
-   Button.
-   Badge.
-   Navbar.
-   Footer.

## Phase 2 --- Landing Core

-   Hero.
-   Problem.
-   Value proposition.
-   Discovery cards.
-   How It Works.
-   Final CTA.

## Phase 3 --- Product Storytelling

-   AI feature.
-   Profile showcase.
-   Business journey.
-   Persona cards.
-   FAQ.

## Phase 4 --- Polish

-   Animation.
-   Responsive tuning.
-   Accessibility.
-   Image optimization.
-   SEO.
-   Metadata.
-   Lighthouse optimization.

## Phase 5 --- Integration

Setelah backend/application siap:

-   Auth.
-   Real business data.
-   Search/filter.
-   Business detail.
-   User dashboard.
-   AI services.

------------------------------------------------------------------------

# 28. Future Product Roadmap

PRD landing page harus mendukung ekspansi menuju:

### Phase A

Landing page + registration + basic business profile.

### Phase B

BMC Builder + Business Journey + AI profile generator.

### Phase C

Discovery Hub + business detail + AI discovery assistant.

### Phase D

Transaction-data normalization + revenue visualization.

------------------------------------------------------------------------

# 29. Definition of Done

Landing page LUMORA dinyatakan production-ready jika:

1.  Semua acceptance criteria terpenuhi.
2.  Responsive pada mobile, tablet, dan desktop.
3.  Tidak terdapat critical accessibility issue.
4.  Tidak terdapat broken CTA/link.
5.  Copy telah diperiksa.
6.  Demo data diberi konteks yang tepat.
7.  Statistik memiliki source.
8.  Image assets telah dioptimasi.
9.  Metadata social sharing bekerja.
10. Lighthouse mencapai target yang disepakati.
11. Production build berhasil tanpa error.
12. Tidak terdapat console error pada flow utama.

------------------------------------------------------------------------

# 30. Final Experience Principle

Ketika pengguna membuka LUMORA, dalam 5--10 detik mereka harus memahami
tiga hal:

> **1. LUMORA membantu UMKM menampilkan bisnisnya secara profesional.**

> **2. Calon pemodal atau mitra dapat menemukan dan mempelajari bisnis
> melalui discovery experience.**

> **3. AI membantu menyusun dan memahami informasi, tetapi keputusan
> tetap berada pada pengguna.**

Landing page tidak boleh hanya terlihat seperti website startup yang
menarik secara visual. Interface harus menunjukkan produk LUMORA secara
nyata melalui business cards, business profiles, business journey, AI
previews, dan discovery experience.

**North-star design principle:**

> **Show the product, show the businesses, show the story.**
