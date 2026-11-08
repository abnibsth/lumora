-- +goose Up
-- LUMORA UMKM Data Seeding for abni@gmail.com
-- Idempotently links and creates full-featured UMKM businesses, milestones, BMC,
-- live analytics history, partner collaboration requests, and active inbox conversations.

-- 1. Ensure abni@gmail.com user exists
INSERT INTO users (name, email, password_hash, role, created_at, email_verified_at)
VALUES (
    'Abni Bastari',
    'abni@gmail.com',
    '$argon2id$v=19$m=65536,t=1,p=4$vSpb3JqE9v9N2L5k7M1oPw$pQ1w2e3r4t5y6u7i8o9p0a1b2c3d4e5f6g7h8i9j0k1',
    'umkm',
    now(),
    now()
)
ON CONFLICT (email) DO UPDATE SET
    role = 'umkm',
    email_verified_at = COALESCE(users.email_verified_at, now());

-- 2. Ensure partner user exists for real collaboration & analytics interplay
INSERT INTO users (name, email, password_hash, role, created_at, email_verified_at)
VALUES (
    'Bina Usaha Nusantara',
    'mitra.bina@lumora.id',
    '$argon2id$v=19$m=65536,t=1,p=4$vSpb3JqE9v9N2L5k7M1oPw$pQ1w2e3r4t5y6u7i8o9p0a1b2c3d4e5f6g7h8i9j0k1',
    'mitra',
    now(),
    now()
)
ON CONFLICT (email) DO NOTHING;

INSERT INTO partner_profiles (
    user_id, company_name, partner_type, logo, location, operational_coverage,
    description, offered_collaborations, contact_email, share_contact, created_at, updated_at
)
SELECT 
    id,
    'PT Bina Usaha Nusantara',
    'Distributor',
    '',
    'Bandung',
    'Jawa Barat & Nasional',
    'Jaringan distribusi ritel modern dan rantai pasok F&B terkemuka di Jawa Barat.',
    ARRAY['PRODUCT_DISTRIBUTION', 'RETAIL_CONSIGNMENT', 'BUSINESS_EXPANSION'],
    'kemitraan@binausaha.co.id',
    true,
    now(),
    now()
FROM users WHERE email = 'mitra.bina@lumora.id'
ON CONFLICT (user_id) DO NOTHING;

-- +goose StatementBegin
DO $$
DECLARE
    abni_id uuid;
    mitra_id uuid;
    partner_prof_id uuid;
    biz1_id uuid;
    biz2_id uuid;
    req1_id uuid;
    req2_id uuid;
    conv1_id uuid;
    i integer;
    t_stamp timestamptz;
BEGIN
    SELECT id INTO abni_id FROM users WHERE lower(email) LIKE 'abni%' OR lower(name) LIKE '%abni%' ORDER BY created_at DESC LIMIT 1;
    IF abni_id IS NULL THEN
        SELECT id INTO abni_id FROM users WHERE email = 'abni@gmail.com';
    END IF;
    SELECT id INTO mitra_id FROM users WHERE lower(email) = 'mitra.bina@lumora.id';
    SELECT id INTO partner_prof_id FROM partner_profiles WHERE user_id = mitra_id;

    -- 3. Upsert Business 1: Kopi Ruang Senja (F&B / Bandung)
    SELECT id INTO biz1_id FROM businesses WHERE slug = 'kopi-ruang-senja';
    IF biz1_id IS NULL THEN
        INSERT INTO businesses (
            slug, owner_user_id, name, category, location, description, story,
            cover_image, cover_position, logo, founded_year,
            revenue_label, growth_label, revenue_series,
            seeking, seeking_objective,
            owner_name, owner_role, owner_bio,
            status, verified, created_at, updated_at
        )
        VALUES (
            'kopi-ruang-senja', abni_id, 'Kopi Ruang Senja', 'F&B', 'Bandung',
            'Kedai kopi independen dan micro-roastery yang tumbuh bersama komunitas kreatif di Bandung.',
            'Kopi Ruang Senja bermula dari kedai kecil dengan empat meja yang ingin memberi ruang bagi warga sekitar dan pegiat kreatif untuk bertemu. Berawal dari biji kopi lokal Jawa Barat pilihan, kami menyajikan kopi berkualitas dengan harga terjangkau. Kini kami sedang menyiapkan kapasitas produksi dan pembukaan cabang kedua.',
            '/asset%20lumora/kopi%20ruang%20senja.jpg', 'center', '', 2023,
            'Rp24,8 jt/bln', '+28% / 6 bulan', ARRAY[14.2, 16.5, 18.1, 20.4, 22.8, 24.8],
            ARRAY['BUSINESS_EXPANSION', 'PRODUCT_DISTRIBUTION', 'EQUIPMENT_TOOL_SUPPLY'],
            'Membuka cabang kedua di kawasan strategis Bandung dan menjalin kemitraan pengadaan mesin espresso komersial.',
            'Abni Bastari', 'Pendiri & Pengelola Utama', 'Berpengalaman 6 tahun dalam industri kopi spesialti dan manajemen rantai pasok F&B lokal.',
            'published', true, now() - interval '60 days', now()
        )
        RETURNING id INTO biz1_id;
    ELSE
        UPDATE businesses SET
            owner_user_id     = abni_id,
            owner_name        = 'Abni Bastari',
            owner_role        = 'Pendiri & Pengelola Utama',
            revenue_label     = 'Rp24,8 jt/bln',
            growth_label      = '+28% / 6 bulan',
            revenue_series    = ARRAY[14.2, 16.5, 18.1, 20.4, 22.8, 24.8],
            seeking           = ARRAY['BUSINESS_EXPANSION', 'PRODUCT_DISTRIBUTION', 'EQUIPMENT_TOOL_SUPPLY'],
            seeking_objective = 'Membuka cabang kedua di kawasan strategis Bandung dan menjalin kemitraan pengadaan mesin espresso komersial.',
            status            = 'published',
            updated_at        = now()
        WHERE id = biz1_id;
    END IF;

    -- Ensure Milestones for Business 1
    DELETE FROM business_milestones WHERE business_id = biz1_id;
    INSERT INTO business_milestones (business_id, year, title, description, position) VALUES
        (biz1_id, 2023, 'Usaha Mulai Berjalan', 'Produk kopi seduh manual pertama diperkenalkan ke komunitas sekitar.', 0),
        (biz1_id, 2024, '100 Pelanggan Tetap', 'Pesanan berulang harian membentuk basis pelanggan loyal dan komunitas tetap.', 1),
        (biz1_id, 2025, 'Penambahan Mesin Roasting', 'Kapasitas sangrai biji kopi ditingkatkan menjadi 200 kg per bulan.', 2),
        (biz1_id, 2026, 'Rencana Ekspansi & Kemitraan', 'Membuka peluang kerja sama pembukaan gerai baru dan distribusi kemasan B2B.', 3);

    -- Ensure 9-Block BMC for Business 1
    DELETE FROM bmc_entries WHERE business_id = biz1_id;
    INSERT INTO bmc_entries (business_id, label, value, position) VALUES
        (biz1_id, 'Mitra Utama', 'Petani kopi lokal Ciwidey & Pangalengan, pemasok susu pasteurisasi, mitra kurir logistik', 0),
        (biz1_id, 'Aktivitas Utama', 'Roasting biji kopi segar, peracikan minuman kopi, pengelolaan kedai, community gathering', 1),
        (biz1_id, 'Sumber Daya Utama', 'Mesin sangrai kapasitas 3kg, barista terlatih, ruang kedai bernuansa tenang, biji kopi arabika single origin', 2),
        (biz1_id, 'Proposisi Nilai', 'Kopi spesialti lokal berkualitas kurasi tinggi dengan atmosfer singgah hangat dan harga bersahabat', 3),
        (biz1_id, 'Hubungan Pelanggan', 'Komunikasi personal ramah, program keanggotaan loyalty kartu seduh, aktivasi media sosial', 4),
        (biz1_id, 'Saluran', 'Gerai kedai fisik, pesan antar daring, marketplace kemasan biji kopi sangrai', 5),
        (biz1_id, 'Segmen Pelanggan', 'Pekerja kreatif, mahasiswa, penikmat kopi lokal, dan warga sekitar perumahan', 6),
        (biz1_id, 'Struktur Biaya', 'Pembelian green beans dari petani, biaya listrik dan sewa tempat, upah tim barista, kemasan ramah lingkungan', 7),
        (biz1_id, 'Sumber Pendapatan', 'Penjualan kopi siap minum di kedai, penjualan biji kopi kemasan (whole beans/ground), menu kudapan pendamping', 8);

    -- 4. Upsert Business 2: Nara Studio Kriya (Fashion / Bandung)
    SELECT id INTO biz2_id FROM businesses WHERE slug = 'nara-studio-abni';
    IF biz2_id IS NULL THEN
        INSERT INTO businesses (
            slug, owner_user_id, name, category, location, description, story,
            cover_image, cover_position, logo, founded_year,
            revenue_label, growth_label, revenue_series,
            seeking, seeking_objective,
            owner_name, owner_role, owner_bio,
            status, verified, created_at, updated_at
        )
        VALUES (
            'nara-studio-abni', abni_id, 'Nara Studio Kriya', 'Fashion', 'Bandung',
            'Studio busana dan kriya tekstil ramah lingkungan dengan produksi terbatas bermutu tinggi.',
            'Didirikan dengan semangat mengurangi limbah tekstil melalui konsep upcycling kain sisa berkualitas dan pewarnaan alami. Setiap rancangan dikerjakan bersama kelompok penjahit lokal dengan standar jahit butik.',
            '/asset%20lumora/nara%20studio.jpg', 'center', '', 2024,
            'Rp19,5 jt/bln', '+18% / 6 bulan', ARRAY[12.0, 13.8, 15.2, 16.9, 18.0, 19.5],
            ARRAY['RETAIL_CONSIGNMENT', 'MARKETING_CO_BRANDING'],
            'Menempatkan koleksi pakaian kapsul di butik gaya hidup terkurasi dan kolaborasi merek tematik.',
            'Abni Bastari', 'Creative Director & Founder', 'Fokus pada pengembangan produk fesyen sirkular dan kemitraan perajin lokal Jawa Barat.',
            'published', true, now() - interval '45 days', now()
        )
        RETURNING id INTO biz2_id;
    END IF;

    -- Ensure Milestones for Business 2
    DELETE FROM business_milestones WHERE business_id = biz2_id;
    INSERT INTO business_milestones (business_id, year, title, description, position) VALUES
        (biz2_id, 2024, 'Peluncuran Koleksi Perdana', 'Merilis 50 potong busana kapsul bahan serat alam pertama.', 0),
        (biz2_id, 2025, 'Kemitraan Komunitas Jahit', 'Membina 8 penjahit lokal rumahan untuk produksi berkelanjutan.', 1),
        (biz2_id, 2026, 'Persiapan Masuk Retail Offline', 'Menyiapkan display koleksi untuk toko terkurasi di kota besar.', 2);

    -- Ensure BMC for Business 2
    DELETE FROM bmc_entries WHERE business_id = biz2_id;
    INSERT INTO bmc_entries (business_id, label, value, position) VALUES
        (biz2_id, 'Mitra Utama', 'Pengrajin tenun lokal, pemasok pewarna alam indigo, desainer kolaborator', 0),
        (biz2_id, 'Aktivitas Utama', 'Riset desain busana, pemotongan pola hemat bahan, produksi terkurasi, kurasi konten visual', 1),
        (biz2_id, 'Sumber Daya Utama', 'Workshop jahit studio, stok kain serat alam terverifikasi, tim desain kreatif', 2),
        (biz2_id, 'Proposisi Nilai', 'Pakaian berestetika abadi, nyaman dipakai harian, dan ramah lingkungan tanpa limbah berlebih', 3),
        (biz2_id, 'Hubungan Pelanggan', 'Konsultasi ukuran personal, layanan purnajual perbaikan pakaian, newsletter gaya hidup', 4),
        (biz2_id, 'Saluran', 'Penjualan daring langsung via website, pameran kurasi kreatif, display galeri seni', 5),
        (biz2_id, 'Segmen Pelanggan', 'Profesional muda, pegiat lingkungan hidup, dan konsumen berkesadaran etis', 6),
        (biz2_id, 'Struktur Biaya', 'Pembelian material ramah lingkungan, upah layak penjahit, biaya operasional studio', 7),
        (biz2_id, 'Sumber Pendapatan', 'Penjualan busana siap pakai, pesanan khusus (made-to-order), lokakarya tekstil alami', 8);

    -- 5. Seed Live Analytics Events for Kopi Ruang Senja (Last 30 Days)
    DELETE FROM business_analytics_events WHERE business_id = biz1_id;

    FOR i IN 0..29 LOOP
        t_stamp := now() - (i || ' days')::interval;

        -- Profile views (various sources)
        INSERT INTO business_analytics_events (business_id, event_type, source, visitor_hash, created_at)
        VALUES 
            (biz1_id, 'view', 'explore', 'vis-exp-' || i, t_stamp + interval '2 hours'),
            (biz1_id, 'view', 'explore', 'vis-exp2-' || i, t_stamp + interval '4 hours'),
            (biz1_id, 'view', 'search', 'vis-src-' || i, t_stamp + interval '6 hours'),
            (biz1_id, 'view', 'matching', 'vis-mat-' || i, t_stamp + interval '8 hours'),
            (biz1_id, 'view', 'direct', 'vis-dir-' || i, t_stamp + interval '10 hours');

        -- Catalog impressions
        INSERT INTO business_analytics_events (business_id, event_type, source, visitor_hash, created_at)
        VALUES 
            (biz1_id, 'catalog_impression', 'explore', 'cat-1-' || i, t_stamp + interval '1 hour'),
            (biz1_id, 'catalog_impression', 'explore', 'cat-2-' || i, t_stamp + interval '3 hours'),
            (biz1_id, 'catalog_impression', 'search', 'cat-3-' || i, t_stamp + interval '5 hours'),
            (biz1_id, 'catalog_impression', 'matching', 'cat-4-' || i, t_stamp + interval '7 hours');

        -- Contact clicks on select days
        IF i % 3 = 0 THEN
            INSERT INTO business_analytics_events (business_id, event_type, source, visitor_hash, created_at)
            VALUES (biz1_id, 'contact_click', 'direct', 'cc-' || i, t_stamp + interval '9 hours');
        END IF;
    END LOOP;

    -- 6. Seed Bookmark from Partner
    IF mitra_id IS NOT NULL THEN
        INSERT INTO bookmarks (user_id, business_id, created_at)
        VALUES (mitra_id, biz1_id, now() - interval '5 days')
        ON CONFLICT DO NOTHING;
    END IF;

    -- 7. Seed Collaboration Requests & Inbox
    IF mitra_id IS NOT NULL AND partner_prof_id IS NOT NULL THEN
        SELECT id INTO req1_id FROM collaboration_requests 
        WHERE sender_user_id = mitra_id AND business_id = biz1_id AND collaboration_type = 'PRODUCT_DISTRIBUTION';

        IF req1_id IS NULL THEN
            INSERT INTO collaboration_requests (
                sender_user_id, sender_role, receiver_user_id, receiver_role,
                business_id, partner_profile_id, direction, collaboration_type,
                title, message, proposal_detail, status, responded_at, created_at, updated_at
            )
            VALUES (
                mitra_id, 'mitra', abni_id, 'umkm',
                biz1_id, partner_prof_id, 'partner_to_umkm', 'PRODUCT_DISTRIBUTION',
                'Kemitraan Distribusi Biji Kopi Sangrai ke 15 Kafe Mitra',
                'Halo Mas Abni, kami dari PT Bina Usaha Nusantara sangat tertarik dengan karakter biji kopi arabika Kopi Ruang Senja. Kami ingin mendistribusikan produk whole bean kemasan 250gr ke jaringan kedai kopi binaan kami di Jawa Barat.',
                'Estimasi kuota awal: 80 kg/bulan dengan skema pembayaran tempo 14 hari. Mohon info jadwal untuk coffee cupping dan diskusi lanjutan.',
                'accepted', now() - interval '2 days', now() - interval '3 days', now()
            )
            RETURNING id INTO req1_id;

            INSERT INTO conversations (collaboration_request_id, created_at, updated_at)
            VALUES (req1_id, now() - interval '2 days', now())
            RETURNING id INTO conv1_id;

            INSERT INTO conversation_participants (conversation_id, user_id)
            VALUES (conv1_id, mitra_id), (conv1_id, abni_id)
            ON CONFLICT DO NOTHING;

            INSERT INTO messages (conversation_id, sender_id, content, created_at)
            VALUES 
                (conv1_id, abni_id, 'Halo tim Bina Usaha Nusantara, terima kasih banyak atas tawarannya. Kami menyambut baik rencana distribusi ini.', now() - interval '2 days'),
                (conv1_id, mitra_id, 'Sama-sama Mas Abni! Apakah bisa dijadwalkan pertemuan di kedai Ruang Senja pada hari Kamis pukul 14.00 WIB untuk sampel cupping?', now() - interval '1 day'),
                (conv1_id, abni_id, 'Kamis jam 14.00 cocok sekali. Kami siapkan 3 varian roast profile terbaik kami ya.', now() - interval '10 hours');
        END IF;

        SELECT id INTO req2_id FROM collaboration_requests 
        WHERE sender_user_id = mitra_id AND business_id = biz1_id AND collaboration_type = 'BUSINESS_EXPANSION';

        IF req2_id IS NULL THEN
            INSERT INTO collaboration_requests (
                sender_user_id, sender_role, receiver_user_id, receiver_role,
                business_id, partner_profile_id, direction, collaboration_type,
                title, message, proposal_detail, status, created_at, updated_at
            )
            VALUES (
                mitra_id, 'mitra', abni_id, 'umkm',
                biz1_id, partner_prof_id, 'partner_to_umkm', 'BUSINESS_EXPANSION',
                'Penawaran Co-location Outlet di Ruang Kreatif Dago',
                'Kami memiliki space lantai dasar di creative hub Dago Bandung yang sangat cocok untuk branch outlet Kopi Ruang Senja.',
                'Skema profit sharing murni tanpa beban sewa tetap di tahun pertama. Traffic harian rata-rata 300+ pengunjung terverifikasi.',
                'pending', now() - interval '1 day', now()
            )
            RETURNING id INTO req2_id;
        END IF;

        INSERT INTO notifications (recipient_user_id, actor_user_id, type, title, body, target_type, target_id, created_at)
        VALUES 
            (abni_id, mitra_id, 'collab_request_created', 'Pengajuan Kemitraan Baru', 'PT Bina Usaha Nusantara mengajukan: Penawaran Co-location Outlet di Ruang Kreatif Dago', 'collaboration', req2_id::text, now() - interval '1 day'),
            (abni_id, mitra_id, 'new_message', 'Pesan Baru dari Mitra', 'PT Bina Usaha Nusantara mengirim pesan di ruang percakapan Kemitraan Distribusi Biji Kopi Sangrai', 'conversation', conv1_id::text, now() - interval '10 hours');
    END IF;

END $$;
-- +goose StatementEnd

