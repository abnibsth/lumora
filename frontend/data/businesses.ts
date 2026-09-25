import type { BmcEntry, Business } from "@/types/business";

const defaultCanvas: BmcEntry[] = [
  { label: "Mitra Utama", value: "Pemasok lokal dan mitra logistik" },
  { label: "Aktivitas Utama", value: "Produksi, layanan pelanggan, dan pengembangan produk" },
  { label: "Sumber Daya Utama", value: "Tim, keterampilan, tempat usaha, dan peralatan" },
  { label: "Proposisi Nilai", value: "Produk lokal dengan layanan yang dekat dan personal" },
  { label: "Hubungan Pelanggan", value: "Pelayanan langsung dan komunikasi melalui media sosial" },
  { label: "Saluran", value: "Toko, pesan langsung, dan marketplace" },
  { label: "Segmen Pelanggan", value: "Pelanggan lokal dan pembeli daring" },
  { label: "Struktur Biaya", value: "Bahan baku, operasional, tenaga kerja, dan distribusi" },
  { label: "Sumber Pendapatan", value: "Penjualan produk dan pesanan khusus" },
];

const milestones = (start: number) => [
  { year: start, title: "Usaha mulai berjalan", description: "Produk pertama diperkenalkan kepada pelanggan sekitar." },
  { year: start + 1, title: "Mencapai 100 pelanggan", description: "Pesanan berulang mulai membentuk basis pelanggan tetap." },
  { year: 2025, title: "Menambah kapasitas", description: "Pilihan produk dan kemampuan produksi diperluas." },
  { year: 2026, title: "Mencari mitra", description: "Pemilik membuka percakapan untuk tahap pertumbuhan berikutnya." },
];

export const businesses: Business[] = [
  {
    id: "kopi-ruang-senja", slug: "kopi-ruang-senja", name: "Kopi Ruang Senja", category: "F&B", location: "Bandung",
    description: "Kedai kopi independen yang tumbuh bersama komunitas di sekitarnya.",
    story: "Kopi Ruang Senja bermula dari kedai kecil yang ingin memberi ruang bagi warga sekitar untuk bertemu. Pemiliknya mengembangkan menu secara bertahap dari tanggapan pelanggan dan kini sedang menyiapkan kapasitas untuk lokasi kedua.",
    coverImage: "/img/benner.png", coverPosition: "70% center", foundedYear: 2023, revenueLabel: "Rp18,4 jt/bln", growthLabel: "+23% / 6 bulan", revenueSeries: [12.1, 13.4, 14.2, 15.8, 16.9, 18.4],
    seeking: ["Mitra Ekspansi"], seekingObjective: "Membuka cabang kedua di Bandung dengan tetap menjaga karakter kedai komunitas.",
    owner: { name: "Raka Pradana", role: "Pendiri & pengelola", bio: "Raka menangani pengembangan menu, operasional kedai, dan kegiatan komunitas." }, milestones: milestones(2023), bmc: defaultCanvas,
  },
  {
    id: "arunika-bakery", slug: "arunika-bakery", name: "Arunika Bakery", category: "F&B", location: "Bogor",
    description: "Roti rumahan yang dipanggang dalam jumlah kecil setiap pagi.", story: "Arunika Bakery tumbuh dari dapur rumah dan pesanan tetangga. Produksi dilakukan dalam batch kecil agar mutu roti terjaga sambil pemilik menyusun sistem pesanan yang lebih rapi.",
    coverImage: "/img/image.png", coverPosition: "72% center", foundedYear: 2021, revenueLabel: "Rp14,8 jt/bln", growthLabel: "+16% / 6 bulan", revenueSeries: [10.2, 10.8, 11.7, 12.6, 13.4, 14.8], seeking: ["Mitra Distribusi"], seekingObjective: "Menjangkau pelanggan di luar Bogor melalui titik titip jual yang terkurasi.", owner: { name: "Nadia Permata", role: "Pemilik & baker", bio: "Nadia meracik produk, mengatur produksi, dan membangun hubungan dengan pelanggan." }, milestones: milestones(2021), bmc: defaultCanvas,
  },
  {
    id: "nara-studio", slug: "nara-studio", name: "Nara Studio", category: "Fashion", location: "Jakarta",
    description: "Studio busana dengan produksi terbatas dan pendekatan made-to-order.", story: "Nara Studio membuat pakaian dalam jumlah terbatas untuk mengurangi sisa bahan. Setiap koleksi dibangun dari percakapan dengan pelanggan dan kemampuan penjahit lokal.", coverImage: "/img/benner.png", foundedYear: 2020, revenueLabel: "Rp22,7 jt/bln", growthLabel: "+12% / 6 bulan", revenueSeries: [18.1, 18.7, 19.6, 20.4, 21.2, 22.7], seeking: ["Mitra Produksi"], seekingObjective: "Meningkatkan kapasitas pesanan tanpa beralih ke produksi massal.", owner: { name: "Nara Ayuningtyas", role: "Pendiri & desainer", bio: "Nara memimpin desain, pemilihan bahan, dan kerja sama dengan penjahit." }, milestones: milestones(2020), bmc: defaultCanvas,
  },
  {
    id: "kayu-rupa", slug: "kayu-rupa", name: "Kayu Rupa", category: "Kreatif", location: "Yogyakarta",
    description: "Perabot kecil dan benda rumah dari kayu sisa produksi.", story: "Kayu Rupa mengolah potongan kayu yang kerap terbuang menjadi benda rumah berumur panjang. Bengkel kecilnya mengerjakan setiap pesanan secara manual.", coverImage: "/img/image.png", foundedYear: 2019, revenueLabel: "Rp17,2 jt/bln", growthLabel: "+19% / 6 bulan", revenueSeries: [12.9, 13.7, 14.5, 15.2, 16.1, 17.2], seeking: ["Mitra Retail"], seekingObjective: "Menempatkan koleksi di toko rumah dan gaya hidup di kota besar.", owner: { name: "Bagas Wicaksono", role: "Perajin & pemilik", bio: "Bagas merancang produk dan mengelola bengkel bersama dua perajin." }, milestones: milestones(2019), bmc: defaultCanvas,
  },
  {
    id: "dapur-nusa", slug: "dapur-nusa", name: "Dapur Nusa", category: "F&B", location: "Surabaya",
    description: "Masakan rumahan Nusantara untuk makan siang kantor dan keluarga.", story: "Dapur Nusa dimulai dari pesanan makan siang di lingkungan sekitar. Menu berganti mengikuti bahan yang tersedia dan resep keluarga yang telah lama digunakan.", coverImage: "/img/benner.png", foundedYear: 2022, revenueLabel: "Rp20,5 jt/bln", growthLabel: "+21% / 6 bulan", revenueSeries: [14.3, 15.1, 16.4, 17.6, 18.9, 20.5], seeking: ["Mitra Operasional"], seekingObjective: "Menata dapur produksi agar mampu melayani lebih banyak pesanan rutin.", owner: { name: "Yuni Kartika", role: "Pemilik & kepala dapur", bio: "Yuni menyusun menu dan memastikan proses dapur berjalan setiap hari." }, milestones: milestones(2022), bmc: defaultCanvas,
  },
  {
    id: "sora-craft", slug: "sora-craft", name: "Sora Craft", category: "Kreatif", location: "Bali",
    description: "Kerajinan serat alam yang dibuat bersama perajin lokal.", story: "Sora Craft mengembangkan benda pakai dari serat alam dengan proses manual. Usaha ini menghubungkan pesanan desain kecil dengan kemampuan perajin di sekitar studio.", coverImage: "/img/image.png", foundedYear: 2018, revenueLabel: "Rp16,1 jt/bln", growthLabel: "+14% / 6 bulan", revenueSeries: [12.8, 13.2, 13.8, 14.6, 15.3, 16.1], seeking: ["Mitra Distribusi"], seekingObjective: "Membangun jalur penjualan yang stabil di luar Bali.", owner: { name: "Putu Sari", role: "Pendiri & kurator produk", bio: "Sari mengembangkan desain dan berkoordinasi dengan kelompok perajin." }, milestones: milestones(2018), bmc: defaultCanvas,
  },
  {
    id: "tumbuh-toko", slug: "tumbuh-toko", name: "Tumbuh Toko", category: "Retail", location: "Semarang",
    description: "Toko kebutuhan isi ulang untuk rumah tangga sekitar.", story: "Tumbuh Toko membantu pelanggan membeli kebutuhan rumah tangga sesuai jumlah yang diperlukan. Pemiliknya sedang memperbaiki pencatatan stok dan layanan pesan antar.", coverImage: "/img/benner.png", foundedYear: 2021, revenueLabel: "Rp13,6 jt/bln", growthLabel: "+10% / 6 bulan", revenueSeries: [11.2, 11.5, 12, 12.4, 13, 13.6], seeking: ["Mitra Teknologi"], seekingObjective: "Merapikan inventori dan pesanan agar operasional harian lebih ringan.", owner: { name: "Dita Maharani", role: "Pemilik toko", bio: "Dita mengelola pemasok, stok, dan pelayanan pelanggan." }, milestones: milestones(2021), bmc: defaultCanvas,
  },
  {
    id: "bengkel-sahabat", slug: "bengkel-sahabat", name: "Bengkel Sahabat", category: "Jasa", location: "Bekasi",
    description: "Servis motor harian dengan pencatatan perawatan pelanggan.", story: "Bengkel Sahabat melayani kendaraan warga sekitar dan menyimpan riwayat servis sederhana. Pemilik ingin menambah peralatan untuk mempercepat antrean pada akhir pekan.", coverImage: "/img/image.png", foundedYear: 2017, revenueLabel: "Rp25,4 jt/bln", growthLabel: "+8% / 6 bulan", revenueSeries: [22, 22.8, 23.1, 23.9, 24.6, 25.4], seeking: ["Mitra Peralatan"], seekingObjective: "Menambah dua titik servis dan alat diagnostik dasar.", owner: { name: "Agus Setiawan", role: "Pemilik & mekanik", bio: "Agus menangani servis sekaligus melatih mekanik muda di bengkelnya." }, milestones: milestones(2017), bmc: defaultCanvas,
  },
  {
    id: "aksara-lokal", slug: "aksara-lokal", name: "Aksara Lokal", category: "Kreatif", location: "Malang",
    description: "Studio desain kemasan untuk produk pangan skala kecil.", story: "Aksara Lokal membantu pemilik usaha merapikan kemasan tanpa kehilangan cerita asal produknya. Studio bekerja dalam tim kecil dan menangani proyek secara bergiliran.", coverImage: "/img/benner.png", foundedYear: 2020, revenueLabel: "Rp19,3 jt/bln", growthLabel: "+17% / 6 bulan", revenueSeries: [14.9, 15.5, 16.2, 17.4, 18.1, 19.3], seeking: ["Mitra Proyek"], seekingObjective: "Bekerja dengan pendamping UMKM untuk menangani kelompok usaha secara berkala.", owner: { name: "Mira Anindya", role: "Direktur kreatif", bio: "Mira memimpin riset, desain, dan komunikasi dengan pemilik usaha." }, milestones: milestones(2020), bmc: defaultCanvas,
  },
];
