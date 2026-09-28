package main

// Seed catalogue. This is a direct transcription of
// frontend/data/businesses.ts so the API serves exactly what the frontend
// prototype already renders. If that file changes, this one changes with it.
// Labels stay verbatim (including "Rp18,4 jt/bln") because they are display
// strings, not numbers to calculate with.

type seedOwner struct {
	Name string
	Role string
	Bio  string
}

type seedMilestone struct {
	Year        int
	Title       string
	Description string
}

type seedBmcEntry struct {
	Label string
	Value string
}

type seedBusiness struct {
	Slug             string
	Name             string
	Category         string
	Location         string
	Description      string
	Story            string
	CoverImage       string
	CoverPosition    string
	FoundedYear      int
	RevenueLabel     string
	GrowthLabel      string
	RevenueSeries    []float64
	Seeking          []string
	SeekingObjective string
	Owner            seedOwner
	Milestones       []seedMilestone
	BMC              []seedBmcEntry
}

var defaultCanvas = []seedBmcEntry{
	{Label: "Mitra Utama", Value: "Pemasok lokal dan mitra logistik"},
	{Label: "Aktivitas Utama", Value: "Produksi, layanan pelanggan, dan pengembangan produk"},
	{Label: "Sumber Daya Utama", Value: "Tim, keterampilan, tempat usaha, dan peralatan"},
	{Label: "Proposisi Nilai", Value: "Produk lokal dengan layanan yang dekat dan personal"},
	{Label: "Hubungan Pelanggan", Value: "Pelayanan langsung dan komunikasi melalui media sosial"},
	{Label: "Saluran", Value: "Toko, pesan langsung, dan marketplace"},
	{Label: "Segmen Pelanggan", Value: "Pelanggan lokal dan pembeli daring"},
	{Label: "Struktur Biaya", Value: "Bahan baku, operasional, tenaga kerja, dan distribusi"},
	{Label: "Sumber Pendapatan", Value: "Penjualan produk dan pesanan khusus"},
}

func seedMilestones(start int) []seedMilestone {
	return []seedMilestone{
		{Year: start, Title: "Usaha mulai berjalan", Description: "Produk pertama diperkenalkan kepada pelanggan sekitar."},
		{Year: start + 1, Title: "Mencapai 100 pelanggan", Description: "Pesanan berulang mulai membentuk basis pelanggan tetap."},
		{Year: 2025, Title: "Menambah kapasitas", Description: "Pilihan produk dan kemampuan produksi diperluas."},
		{Year: 2026, Title: "Mencari mitra", Description: "Pemilik membuka percakapan untuk tahap pertumbuhan berikutnya."},
	}
}

var seedBusinesses = []seedBusiness{
	{
		Slug: "kopi-ruang-senja", Name: "Kopi Ruang Senja", Category: "F&B", Location: "Bandung",
		Description: "Kedai kopi independen yang tumbuh bersama komunitas di sekitarnya.",
		Story:       "Kopi Ruang Senja bermula dari kedai kecil yang ingin memberi ruang bagi warga sekitar untuk bertemu. Pemiliknya mengembangkan menu secara bertahap dari tanggapan pelanggan dan kini sedang menyiapkan kapasitas untuk lokasi kedua.",
		CoverImage:  "/img/benner.png", CoverPosition: "70% center", FoundedYear: 2023,
		RevenueLabel: "Rp18,4 jt/bln", GrowthLabel: "+23% / 6 bulan",
		RevenueSeries:    []float64{12.1, 13.4, 14.2, 15.8, 16.9, 18.4},
		Seeking:          []string{"Mitra Ekspansi"},
		SeekingObjective: "Membuka cabang kedua di Bandung dengan tetap menjaga karakter kedai komunitas.",
		Owner:            seedOwner{Name: "Raka Pradana", Role: "Pendiri & pengelola", Bio: "Raka menangani pengembangan menu, operasional kedai, dan kegiatan komunitas."},
		Milestones:       seedMilestones(2023), BMC: defaultCanvas,
	},
	{
		Slug: "arunika-bakery", Name: "Arunika Bakery", Category: "F&B", Location: "Bogor",
		Description: "Roti rumahan yang dipanggang dalam jumlah kecil setiap pagi.",
		Story:       "Arunika Bakery tumbuh dari dapur rumah dan pesanan tetangga. Produksi dilakukan dalam batch kecil agar mutu roti terjaga sambil pemilik menyusun sistem pesanan yang lebih rapi.",
		CoverImage:  "/img/image.png", CoverPosition: "72% center", FoundedYear: 2021,
		RevenueLabel: "Rp14,8 jt/bln", GrowthLabel: "+16% / 6 bulan",
		RevenueSeries:    []float64{10.2, 10.8, 11.7, 12.6, 13.4, 14.8},
		Seeking:          []string{"Mitra Distribusi"},
		SeekingObjective: "Menjangkau pelanggan di luar Bogor melalui titik titip jual yang terkurasi.",
		Owner:            seedOwner{Name: "Nadia Permata", Role: "Pemilik & baker", Bio: "Nadia meracik produk, mengatur produksi, dan membangun hubungan dengan pelanggan."},
		Milestones:       seedMilestones(2021), BMC: defaultCanvas,
	},
	{
		Slug: "nara-studio", Name: "Nara Studio", Category: "Fashion", Location: "Jakarta",
		Description: "Studio busana dengan produksi terbatas dan pendekatan made-to-order.",
		Story:       "Nara Studio membuat pakaian dalam jumlah terbatas untuk mengurangi sisa bahan. Setiap koleksi dibangun dari percakapan dengan pelanggan dan kemampuan penjahit lokal.",
		CoverImage:  "/img/benner.png", FoundedYear: 2020,
		RevenueLabel: "Rp22,7 jt/bln", GrowthLabel: "+12% / 6 bulan",
		RevenueSeries:    []float64{18.1, 18.7, 19.6, 20.4, 21.2, 22.7},
		Seeking:          []string{"Mitra Produksi"},
		SeekingObjective: "Meningkatkan kapasitas pesanan tanpa beralih ke produksi massal.",
		Owner:            seedOwner{Name: "Nara Ayuningtyas", Role: "Pendiri & desainer", Bio: "Nara memimpin desain, pemilihan bahan, dan kerja sama dengan penjahit."},
		Milestones:       seedMilestones(2020), BMC: defaultCanvas,
	},
	{
		Slug: "kayu-rupa", Name: "Kayu Rupa", Category: "Kreatif", Location: "Yogyakarta",
		Description: "Perabot kecil dan benda rumah dari kayu sisa produksi.",
		Story:       "Kayu Rupa mengolah potongan kayu yang kerap terbuang menjadi benda rumah berumur panjang. Bengkel kecilnya mengerjakan setiap pesanan secara manual.",
		CoverImage:  "/img/image.png", FoundedYear: 2019,
		RevenueLabel: "Rp17,2 jt/bln", GrowthLabel: "+19% / 6 bulan",
		RevenueSeries:    []float64{12.9, 13.7, 14.5, 15.2, 16.1, 17.2},
		Seeking:          []string{"Mitra Retail"},
		SeekingObjective: "Menempatkan koleksi di toko rumah dan gaya hidup di kota besar.",
		Owner:            seedOwner{Name: "Bagas Wicaksono", Role: "Perajin & pemilik", Bio: "Bagas merancang produk dan mengelola bengkel bersama dua perajin."},
		Milestones:       seedMilestones(2019), BMC: defaultCanvas,
	},
	{
		Slug: "dapur-nusa", Name: "Dapur Nusa", Category: "F&B", Location: "Surabaya",
		Description: "Masakan rumahan Nusantara untuk makan siang kantor dan keluarga.",
		Story:       "Dapur Nusa dimulai dari pesanan makan siang di lingkungan sekitar. Menu berganti mengikuti bahan yang tersedia dan resep keluarga yang telah lama digunakan.",
		CoverImage:  "/img/benner.png", FoundedYear: 2022,
		RevenueLabel: "Rp20,5 jt/bln", GrowthLabel: "+21% / 6 bulan",
		RevenueSeries:    []float64{14.3, 15.1, 16.4, 17.6, 18.9, 20.5},
		Seeking:          []string{"Mitra Operasional"},
		SeekingObjective: "Menata dapur produksi agar mampu melayani lebih banyak pesanan rutin.",
		Owner:            seedOwner{Name: "Yuni Kartika", Role: "Pemilik & kepala dapur", Bio: "Yuni menyusun menu dan memastikan proses dapur berjalan setiap hari."},
		Milestones:       seedMilestones(2022), BMC: defaultCanvas,
	},
	{
		Slug: "sora-craft", Name: "Sora Craft", Category: "Kreatif", Location: "Bali",
		Description: "Kerajinan serat alam yang dibuat bersama perajin lokal.",
		Story:       "Sora Craft mengembangkan benda pakai dari serat alam dengan proses manual. Usaha ini menghubungkan pesanan desain kecil dengan kemampuan perajin di sekitar studio.",
		CoverImage:  "/img/image.png", FoundedYear: 2018,
		RevenueLabel: "Rp16,1 jt/bln", GrowthLabel: "+14% / 6 bulan",
		RevenueSeries:    []float64{12.8, 13.2, 13.8, 14.6, 15.3, 16.1},
		Seeking:          []string{"Mitra Distribusi"},
		SeekingObjective: "Membangun jalur penjualan yang stabil di luar Bali.",
		Owner:            seedOwner{Name: "Putu Sari", Role: "Pendiri & kurator produk", Bio: "Sari mengembangkan desain dan berkoordinasi dengan kelompok perajin."},
		Milestones:       seedMilestones(2018), BMC: defaultCanvas,
	},
	{
		Slug: "tumbuh-toko", Name: "Tumbuh Toko", Category: "Retail", Location: "Semarang",
		Description: "Toko kebutuhan isi ulang untuk rumah tangga sekitar.",
		Story:       "Tumbuh Toko membantu pelanggan membeli kebutuhan rumah tangga sesuai jumlah yang diperlukan. Pemiliknya sedang memperbaiki pencatatan stok dan layanan pesan antar.",
		CoverImage:  "/img/benner.png", FoundedYear: 2021,
		RevenueLabel: "Rp13,6 jt/bln", GrowthLabel: "+10% / 6 bulan",
		RevenueSeries:    []float64{11.2, 11.5, 12, 12.4, 13, 13.6},
		Seeking:          []string{"Mitra Teknologi"},
		SeekingObjective: "Merapikan inventori dan pesanan agar operasional harian lebih ringan.",
		Owner:            seedOwner{Name: "Dita Maharani", Role: "Pemilik toko", Bio: "Dita mengelola pemasok, stok, dan pelayanan pelanggan."},
		Milestones:       seedMilestones(2021), BMC: defaultCanvas,
	},
	{
		Slug: "bengkel-sahabat", Name: "Bengkel Sahabat", Category: "Jasa", Location: "Bekasi",
		Description: "Servis motor harian dengan pencatatan perawatan pelanggan.",
		Story:       "Bengkel Sahabat melayani kendaraan warga sekitar dan menyimpan riwayat servis sederhana. Pemilik ingin menambah peralatan untuk mempercepat antrean pada akhir pekan.",
		CoverImage:  "/img/image.png", FoundedYear: 2017,
		RevenueLabel: "Rp25,4 jt/bln", GrowthLabel: "+8% / 6 bulan",
		RevenueSeries:    []float64{22, 22.8, 23.1, 23.9, 24.6, 25.4},
		Seeking:          []string{"Mitra Peralatan"},
		SeekingObjective: "Menambah dua titik servis dan alat diagnostik dasar.",
		Owner:            seedOwner{Name: "Agus Setiawan", Role: "Pemilik & mekanik", Bio: "Agus menangani servis sekaligus melatih mekanik muda di bengkelnya."},
		Milestones:       seedMilestones(2017), BMC: defaultCanvas,
	},
	{
		Slug: "aksara-lokal", Name: "Aksara Lokal", Category: "Kreatif", Location: "Malang",
		Description: "Studio desain kemasan untuk produk pangan skala kecil.",
		Story:       "Aksara Lokal membantu pemilik usaha merapikan kemasan tanpa kehilangan cerita asal produknya. Studio bekerja dalam tim kecil dan menangani proyek secara bergiliran.",
		CoverImage:  "/img/benner.png", FoundedYear: 2020,
		RevenueLabel: "Rp19,3 jt/bln", GrowthLabel: "+17% / 6 bulan",
		RevenueSeries:    []float64{14.9, 15.5, 16.2, 17.4, 18.1, 19.3},
		Seeking:          []string{"Mitra Proyek"},
		SeekingObjective: "Bekerja dengan pendamping UMKM untuk menangani kelompok usaha secara berkala.",
		Owner:            seedOwner{Name: "Mira Anindya", Role: "Direktur kreatif", Bio: "Mira memimpin riset, desain, dan komunikasi dengan pemilik usaha."},
		Milestones:       seedMilestones(2020), BMC: defaultCanvas,
	},
}
