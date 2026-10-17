import type { BmcEntry } from "@/types/business";

export interface BmcBlockMeta {
  id: string;
  label: string;
  shortName: string;
  iconName: string;
  order: number;
  category: "feasibility" | "desirability" | "viability";
  description: string;
  guidingQuestions: string[];
  examples: {
    businessType: string;
    text: string;
  }[];
  tips: string;
  placeholder: string;
  gridArea: string;
}

export const BMC_BLOCK_DEFINITIONS: BmcBlockMeta[] = [
  {
    id: "partners",
    label: "Mitra Utama",
    shortName: "Mitra",
    iconName: "Handshake",
    order: 1,
    category: "feasibility",
    description: "Pihak luar, pemasok, atau rekanan kunci yang membantu bisnismu berjalan lancar dan efisien.",
    guidingQuestions: [
      "Siapa pemasok bahan baku atau penyedia jasa utama usahamu?",
      "Siapa mitra logistik, distribusi, atau platform yang krusial?",
      "Kerja sama apa yang membantu menghemat biaya atau memperluas jangkauan?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Kelompok tani kopi lokal, produsen susu segar Jawa Barat, vendor kemasan ramah lingkungan, agen ekspedisi frozen food.",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Pengrajin tenun binaan di Garut, penjahit rumahan mitra, toko bahan kain grosir, jasa kurir same-day.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Payment gateway (Midtrans), penyedia cloud hosting, asosiasi konsultan, freelance desainer grafis.",
      },
    ],
    tips: "Tuliskan nama peran atau mitra nyata, bukan sekadar kata 'pemasok'. Sebutkan apa yang mereka sediakan.",
    placeholder: "Contoh:\n- Pemasok biji kopi lokal (Petani Ciwidey)\n- Produsen susu pasteurisasi harian\n- Mitra kurir instan & ekspedisi",
    gridArea: "partners",
  },
  {
    id: "activities",
    label: "Aktivitas Utama",
    shortName: "Aktivitas",
    iconName: "CheckSquare",
    order: 2,
    category: "feasibility",
    description: "Kegiatan operasional terpenting yang wajib dijalankan setiap hari agar produk dan nilai bisnismu terwujud.",
    guidingQuestions: [
      "Aktivitas harian apa yang mutlak harus dilakukan agar produk/jasa siap dinikmati pelanggan?",
      "Bagaimana proses kontrol kualitas, produksi, atau riset usahamu?",
      "Aktivitas pemasaran dan layanan apa yang rutin berjalan?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Roasting biji kopi mingguan, peracikan pesanan sesuai SOP higienis, manajemen stok bahan segar harian, live baking tiap pagi.",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Pembuatan pola & sampling produk baru, quality control jahitan, kurasi foto katalog produk, packing premium.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Audit teknis berkala, konsultasi tatap muka mingguan bersama klien, penyusunan laporan kemajuan proyek.",
      },
    ],
    tips: "Fokus pada 3-4 aktivitas inti penentu kualitas bisnis, bukan tugas administratif kecil harian.",
    placeholder: "Contoh:\n- Roasting & kalibrasi espresso tiap pagi\n- Quality control bahan baku segar\n- Pembuatan konten tutorial & promosi mingguan",
    gridArea: "activities",
  },
  {
    id: "resources",
    label: "Sumber Daya Utama",
    shortName: "Sumber Daya",
    iconName: "Boxes",
    order: 3,
    category: "feasibility",
    description: "Aset fisik, manusia, resep rahasia, atau modal terpenting yang wajib dimiliki bisnis.",
    guidingQuestions: [
      "Alat, mesin, atau fasilitas fisik apa yang paling krusial?",
      "Keahlian khusus atau tenaga kerja apa yang tidak boleh absen?",
      "Aset merek, resep, sertifikasi (Halal/BPOM), atau hak cipta apa yang dimiliki?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Mesin espresso 2-group komersial, resep saus rahasia ber-HAKI, sertifikat Halal resmi, barista tersertifikasi.",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Workshop produksi mandiri, mesin jahit industri, hak paten motif tenun etnik, desainer in-house.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Sistem aplikasi web berpemilik, tim engineer senior, lisensi software profesional, database portofolio.",
      },
    ],
    tips: "Tuliskan aset spesifik yang sulit digantikan oleh kompetitor.",
    placeholder: "Contoh:\n- Mesin pemanggang kopi & espresso machine\n- Barista terlatih & resep minuman proprietary\n- Sertifikasi Halal MUI & izin edar P-IRT",
    gridArea: "resources",
  },
  {
    id: "value",
    label: "Proposisi Nilai",
    shortName: "Proposisi Nilai",
    iconName: "Sparkles",
    order: 4,
    category: "desirability",
    description: "Keunggulan utama dan solusi nyata yang membuat pelanggan memilih usahamu dibanding alternatif lain.",
    guidingQuestions: [
      "Masalah atau kebutuhan apa yang paling berhasil kamu selesaikan bagi pelanggan?",
      "Apa pembeda utama yang langsung dirasakan dibanding produk sejenis di pasar?",
      "Kenapa pelanggan rela membayar harga yang kamu tetapkan?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Kopi susu rendah kalori berbahan gula aren murni organik, ramah lambung, dengan kemasan ramah lingkungan.",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Sepatu kulit buatan tangan bergaransi tukar sol seumur hidup, ergonomis untuk kaki lebar orang Indonesia.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Jasa foto produk UMKM selesai dalam 48 jam dengan panduan gaya instan siap tayang untuk marketplace.",
      },
    ],
    tips: "Tuliskan manfaat langsung dari sudut pandang pembeli, bukan hanya fitur teknis barang.",
    placeholder: "Contoh:\n- Kopi artisanal dengan harga ramah kantong mahasiswa\n- Ruang kerja hening dilengkapi Wi-Fi super cepat & colokan di tiap meja\n- Sajian tanpa pemanis buatan",
    gridArea: "value",
  },
  {
    id: "relationships",
    label: "Hubungan Pelanggan",
    shortName: "Hubungan",
    iconName: "HeartHandshake",
    order: 5,
    category: "desirability",
    description: "Cara kamu menyapa, melayani, membangun kedekatan emosional, dan mempertahankan pelanggan setia.",
    guidingQuestions: [
      "Bagaimana caramu berkomunikasi saat melayani pelanggan (personal, ramah, santai, atau formal)?",
      "Apakah ada program loyalitas, diskon member, atau layanan purnajual?",
      "Bagaimana kamu menanggapi masukan atau komplain pelanggan dengan cepat?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Kartu stempel digital gratis minuman ke-10, sapaan akrab nama pelanggan oleh barista, respon komplain < 15 menit via WA.",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Kartu ucapan tulisan tangan di tiap kotak paket, panduan perawatan pakaian via broadcast WhatsApp berkala.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Dedicated account manager, sesi konsultasi review bulanan gratis, grup komunitas VIP di Telegram.",
      },
    ],
    tips: "Sebutkan cara mempertahankan pelanggan lama agar terus repeat order.",
    placeholder: "Contoh:\n- Layanan ramah & hangat khas kedai lokal\n- Kartu stamp loyalty (beli 9 gratis 1)\n- Hotline WhatsApp fast-response untuk pemesanan & masukan",
    gridArea: "relationships",
  },
  {
    id: "channels",
    label: "Saluran",
    shortName: "Saluran",
    iconName: "Truck",
    order: 6,
    category: "desirability",
    description: "Jalur komunikasi, promosi, penjualan, dan pengiriman tempat pelanggan menemukan dan membeli produkmu.",
    guidingQuestions: [
      "Di mana pelanggan pertama kali melihat usahamu (Instagram, TikTok, baliho, rekomendasi teman)?",
      "Lewat media apa transaksi berlangsung (kasir offline, website, marketplace, WhatsApp)?",
      "Bagaimana produk diserahkan ke tangan pembeli?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Kedai offline di pusat kota, aplikasi online (GoFood, GrabFood, ShopeeFood), dan WhatsApp Business untuk pesanan katering.",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Official store di Shopee & Tokopedia, katalog link-in-bio Instagram, dan booth bazar akhir pekan reguler.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Website company profile teroptimasi SEO, akun LinkedIn pendiri, sesi webinar edukasi gratis bulanan.",
      },
    ],
    tips: "Pisahkan antara saluran promosi (dikenal) dan saluran distribusi (dibeli & dikirim).",
    placeholder: "Contoh:\n- Gerai offline / dine-in & takeaway\n- Aplikasi pesan antar (GoFood & GrabFood)\n- Akun Instagram & TikTok untuk promosi harian\n- WhatsApp Business untuk pesanan katering",
    gridArea: "channels",
  },
  {
    id: "customers",
    label: "Segmen Pelanggan",
    shortName: "Pelanggan",
    iconName: "Users",
    order: 7,
    category: "desirability",
    description: "Kelompok orang atau bisnis paling spesifik yang menjadi target utama pembeli produk atau layananamu.",
    guidingQuestions: [
      "Siapa orang yang paling membutuhkan solusi dari bisnismu?",
      "Bagaimana rentang usia, profesi, domisili, atau kebiasaan pengeluaran mereka?",
      "Apakah segmenmu retail konsumen individu (B2C) atau sesama pelaku usaha (B2B)?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Mahasiswa usia 19-24 tahun pencari tempat nugas malam hari, serta pekerja kantoran usia 25-35 tahun pencari sarapan cepat.",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Wanita karier muda usia 25-40 tahun yang menyukai busana kantor bergaya modest kontemporer ramah lingkungan.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Owner UMKM makanan rumahan di wilayah Jabodetabek yang baru merintis jualan online.",
      },
    ],
    tips: "Hindari menulis 'semua kalangan'. Semakin spesifik profil pelangganmu, semakin mudah membuat promosi yang tepat sasaran.",
    placeholder: "Contoh:\n- Mahasiswa & pekerja muda WFH usia 20-32 tahun\n- Komunitas pegiat gaya hidup sehat\n- Korporat perkantoran sekitar untuk pesanan coffee break",
    gridArea: "customers",
  },
  {
    id: "costs",
    label: "Struktur Biaya",
    shortName: "Biaya",
    iconName: "Receipt",
    order: 8,
    category: "viability",
    description: "Pengeluaran terbesar dan rutin yang harus dibayar agar operasional bisnismu tetap berjalan lancar.",
    guidingQuestions: [
      "Biaya tetap apa yang harus dibayar tiap bulan (sewa tempat, gaji karyawan, langganan internet/listrik)?",
      "Biaya variabel apa yang bertambah seiring bertambahnya pesanan (bahan baku mentah, kemasan)?",
      "Apakah ada biaya promosi, iklan berbayar, atau komisi platform yang signifikan?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Sewa ruko tahunan, gaji 4 staf barista, pembelian biji kopi & susu harian, biaya kemasan cup bio-degradable, komisi aplikasi pesan antar 20%.",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Pembelian gulungan kain borongan, upah jahit per potong (ongkos jahit), packaging box, anggaran iklan Meta Ads bulanan.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Gaji pokok tim spesialis, sewa software & cloud server, honor narasumber eksternal, biaya pajak usaha.",
      },
    ],
    tips: "Urutkan mulai dari 3 pos pengeluaran terbesar yang paling menentukan kesehatan arus kas usahamu.",
    placeholder: "Contoh:\n- Biaya bahan baku utama (kopi, susu, sirup)\n- Gaji tim & operasional gerai harian\n- Sewa tempat & utilitas (listrik, air, internet)\n- Kemasan take-away & komisi platform online",
    gridArea: "costs",
  },
  {
    id: "revenue",
    label: "Sumber Pendapatan",
    shortName: "Pendapatan",
    iconName: "Wallet",
    order: 9,
    category: "viability",
    description: "Cara bisnismu menghasilkan uang masuk dari produk, layanan, atau skema kerja sama yang dijual.",
    guidingQuestions: [
      "Produk atau jasa apa saja yang menjadi penyumbang omzet terbesar?",
      "Bagaimana model transaksinya (jual putus per unit, paket langganan, katering berkala, bagi hasil)?",
      "Metode pembayaran apa saja yang disediakan (QRIS, transfer, cash, kartu)?",
    ],
    examples: [
      {
        businessType: "Kuliner / F&B",
        text: "Penjualan minuman & pastry di kedai (70%), pesanan katering acara kantor (20%), penjualan biji kopi sangrai kemasan retail (10%).",
      },
      {
        businessType: "Fashion / Kriya",
        text: "Penjualan ritel ready-to-wear di marketplace, pesanan seragam korporat custom, workshop kelas menyulam akhir pekan.",
      },
      {
        businessType: "Jasa / Layanan",
        text: "Retainer bulanan pendampingan bisnis, fee proyek konsultasi terikat, lisensi materi modul pelatihan digital.",
      },
    ],
    tips: "Sebutkan variasi sumber pemasukan dan porsi kontribusinya jika sudah ada.",
    placeholder: "Contoh:\n- Penjualan minuman kopi & non-kopi dine-in & takeaway\n- Penjualan snack pendamping & bakery\n- Paket katering rapat kantor & hampers hari raya\n- Penjualan beans ritel 250gr",
    gridArea: "revenue",
  },
];
