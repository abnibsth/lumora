import type { Metadata } from "next";
import Link from "next/link";
import {
  Scale,
  AlertTriangle,
  Building2,
  Handshake,
  Sparkles,
  ShieldAlert,
  UserCheck,
  ArrowRight,
  ShieldCheck,
  Gavel,
  HelpCircle,
  Store,
} from "lucide-react";
import { Container } from "@/components/ui/container";
import { buttonStyles } from "@/components/ui/button";
import { ROUTES } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Syarat dan Ketentuan",
  description:
    "Syarat dan Ketentuan resmi penggunaan platform LUMORA bagi Pelaku UMKM dan Mitra Bisnis. Pahami hak, kewajiban, dan batasan layanan kami.",
};

function Hero({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
}) {
  return (
    <section className="marketing-banner-wave bg-forest py-20 text-white md:py-28">
      <Container>
        <div className="max-w-5xl">
          {eyebrow ? <p className="text-sm font-medium text-green">{eyebrow}</p> : null}
          <h1 className="mt-5 whitespace-pre-line text-balance font-display text-[clamp(2.625rem,11vw,4.5rem)] font-semibold leading-[1.02] tracking-[-0.035em] sm:text-6xl lg:text-7xl">
            {title}
          </h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-mint">{description}</p>
          {actions ? <div className="mt-9 flex flex-wrap gap-3">{actions}</div> : null}
        </div>
      </Container>
      <svg
        className="marketing-banner-wave-edge"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        <path d="M0 44C160 4 320 4 480 44S800 96 960 52S1280 4 1440 36V100H0Z" />
      </svg>
    </section>
  );
}

export default function TermsPage() {
  const sections = [
    {
      id: "definisi",
      title: "1. Definisi & Ruang Lingkup Layanan",
      icon: Scale,
      content: (
        <div className="space-y-4 text-sm text-muted leading-relaxed">
          <p>
            Selamat datang di <strong>LUMORA</strong>. Syarat dan Ketentuan Penggunaan ini (“Ketentuan”) mengatur akses
            dan penggunaan Anda atas situs web, platform perangkat lunak, serta layanan digital yang disediakan oleh LUMORA.
          </p>
          <p>
            Dalam dokumen ini, istilah-istilah berikut memiliki arti:
          </p>
          <ul className="space-y-2 pl-4 border-l-2 border-forest/20 text-xs sm:text-sm">
            <li>
              <strong className="text-forest">“LUMORA”</strong> berarti platform teknologi <em>Digital Pitching &amp; Business Discovery</em>
              yang menghubungkan usaha kecil dan menengah (UMKM) dengan mitra bisnis strategis di seluruh Indonesia.
            </li>
            <li>
              <strong className="text-forest">“Pelaku UMKM”</strong> adalah pengguna terdaftar yang memiliki, mengelola, atau mewakili usaha mikro, kecil, atau menengah dan membangun profil publik usahanya di platform.
            </li>
            <li>
              <strong className="text-forest">“Mitra Bisnis”</strong> adalah pengguna terdaftar dari kalangan korporasi, distributor, pemasok, peritel, institusi, mentor, atau investor yang mencari peluang kemitraan dengan UMKM.
            </li>
            <li>
              <strong className="text-forest">“Profil Usaha”</strong> adalah representasi digital bisnis UMKM yang mencakup cerita perjalanan, model bisnis (BMC), pencapaian (milestone), dan kebutuhan kolaborasi.
            </li>
            <li>
              <strong className="text-forest">“Permintaan Kolaborasi”</strong> adalah fitur pengajuan proposal inisiasi hubungan kemitraan formal secara dua arah antara Mitra dan UMKM.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "batasan-layanan",
      title: "2. Batasan Layanan Penting (Pernyataan Non-Finansial)",
      icon: AlertTriangle,
      content: (
        <div className="space-y-4 text-sm text-muted leading-relaxed">
          <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-4 text-amber-950 text-xs sm:text-sm space-y-2">
            <p className="font-bold uppercase tracking-wider text-amber-900">
              PERHATIAN KHUSUS MENGENAI SIFAT PLATFORM:
            </p>
            <p>
              LUMORA didirikan sebagai media presentasi digital (<em>pitching showcase</em>) dan mesin penemu bisnis (<em>discovery engine</em>).
              LUMORA secara tegas menyatakan bahwa:
            </p>
          </div>
          <ul className="space-y-2.5 text-xs sm:text-sm">
            <li className="flex items-start gap-2.5">
              <span className="font-bold text-red-600">✕</span>
              <span><strong>Bukan Platform Crowdfunding:</strong> LUMORA bukan penyelenggara Layanan Urun Dana (Securities Crowdfunding / SCF) dan tidak memfasilitasi penawaran efek atau penghimpunan dana publik.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-bold text-red-600">✕</span>
              <span><strong>Bukan Payment Gateway:</strong> LUMORA tidak menyediakan dompet elektronik (e-wallet), tidak mengelola rekening penampung (escrow), dan tidak memproses transaksi pembayaran atau bagi hasil antar-pengguna.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="font-bold text-red-600">✕</span>
              <span><strong>Bukan Penasihat Investasi:</strong> Tidak ada konten, data statistik, indikator performa, atau rekomendasi di dalam LUMORA yang dapat ditafsirkan sebagai nasihat keuangan, anjuran investasi, atau jaminan keuntungan komersial.</span>
            </li>
          </ul>
          <p className="text-xs text-muted">
            Setiap perjanjian bisnis nyata, transaksi komersial, atau perjanjian investasi yang mungkin terjalin di masa depan wajib disepakati dan dieksekusi secara independen di luar sistem LUMORA dengan uji tuntas (<em>due diligence</em>) mandiri dari masing-masing pihak.
          </p>
        </div>
      ),
    },
    {
      id: "pendaftaran-akun",
      title: "3. Pendaftaran Akun & Verifikasi Identitas",
      icon: UserCheck,
      content: (
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            Untuk menggunakan fitur penuh platform, Anda wajib membuat akun dengan ketentuan:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Kecakapan Hukum:</strong> Anda menyatakan berusia sekurang-kurangnya 18 tahun atau telah cakap melakukan perbuatan hukum menurut hukum Republik Indonesia.
            </li>
            <li>
              <strong>Kebenaran Data:</strong> Anda wajib memberikan nama asli, alamat email yang valid dan aktif, serta informasi yang benar saat registrasi.
            </li>
            <li>
              <strong>Kerahasiaan Kredensial:</strong> Anda bertanggung jawab penuh atas keamanan kata sandi akun Anda. Segala aktivitas yang terjadi di bawah akun Anda menjadi tanggung jawab Anda pribadi.
            </li>
            <li>
              <strong>Verifikasi Email:</strong> Penerbitan profil bisnis ke publik (status <em>Published</em>) memerlukan verifikasi kepemilikan email guna menjamin akuntabilitas ekosistem.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "konten-umkm",
      title: "4. Hak Kekayaan Intelektual & Tanggung Jawab Konten",
      icon: Store,
      content: (
        <div className="space-y-4 text-sm text-muted leading-relaxed">
          <p>
            Kami sangat menghormati hak cipta dan kepemilikan usaha para pelaku bisnis kecil Indonesia:
          </p>
          <ul className="space-y-2.5 text-xs sm:text-sm pl-4 border-l-2 border-forest/20">
            <li>
              <strong className="text-forest">Kepemilikan Tetap Milik Anda:</strong> Seluruh hak kekayaan intelektual atas merek dagang, logo, foto produk, narasi cerita, dan dokumen model bisnis (BMC) yang Anda unggah tetap sepenuhnya milik Anda.
            </li>
            <li>
              <strong className="text-forest">Lisensi Penayangan Terbatas:</strong> Dengan menerbitkan profil (status <em>Published</em>), Anda memberikan lisensi non-eksklusif, bebas royalti, dan berlaku terbatas kepada LUMORA untuk menampilkan, menyusun tata letak, dan mendistribusikan materi profil tersebut di dalam antarmuka LUMORA agar dapat ditemukan oleh mitra yang relevan.
            </li>
            <li>
              <strong className="text-forest">Keaslian &amp; Legalitas:</strong> Anda menjamin bahwa bisnis yang Anda daftarkan beroperasi secara sah di Indonesia, dan informasi yang dicantumkan tidak melanggar hak cipta pihak ketiga, tidak mengandung kepalsuan, tidak mempromosikan barang terlarang, perjudian, pornografi, atau konten yang melanggar hukum.
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "etika-mitra",
      title: "5. Kode Etik & Ketentuan Penggunaan bagi Mitra Bisnis",
      icon: Building2,
      content: (
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            Akun Mitra Bisnis diberikan akses ke fitur kurasi, bookmark, preferensi kemitraan, dan rekomendasi pencocokan cerdas. Sebagai Mitra, Anda menyetujui:
          </p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>Menggunakan platform untuk tujuan membangun hubungan bisnis profesional yang adil, saling menguntungkan, dan memberdayakan UMKM.</li>
            <li>Dilarang melakukan <em>scraping</em> data massal, pengumpulan kontak secara otomatis, atau penggunaan data UMKM untuk keperluan spam dan penawaran pinjaman berbunga tinggi.</li>
            <li>Menghormati kerahasiaan komunikasi di ruang pesan Inbox dan proposal kerja sama yang dikirimkan oleh pemilik UMKM.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "kolaborasi-inbox",
      title: "6. Mekanisme Permintaan Kolaborasi & Ruang Pesan",
      icon: Handshake,
      content: (
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            LUMORA menyediakan alur pengajuan kemitraan formal dua arah (Mitra ke UMKM dan UMKM ke Mitra):
          </p>
          <ol className="list-decimal pl-5 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Sifat Penjajakan Awal:</strong> Pengajuan Permintaan Kolaborasi bersifat sebagai inisiasi pembuka komunikasi (<em>preliminary discussion</em>).
            </li>
            <li>
              <strong>Persetujuan Bukan Kontrak Hukum:</strong> Status persetujuan (<em>Accepted</em>) atas pengajuan kolaborasi semata-mata mengaktifkan jalur percakapan resmi (Inbox) di dalam platform. Persetujuan ini <strong>bukan</strong> merupakan kontrak perikatan kerja sama yang mengikat secara perdata.
            </li>
            <li>
              <strong>Kemandirian Perjanjian:</strong> Nota Kesepahaman (MoU), Surat Perjanjian Kerjasama (SPK), atau akta notariil resmi harus dirumuskan, ditandatangani, dan dijalankan oleh para pihak sendiri di luar ekosistem LUMORA.
            </li>
            <li>
              <strong>Dokumentasi Riwayat:</strong> Sistem mencatat setiap tahapan status (<em>Pending, Accepted, In Progress, Completed, Rejected, Withdrawn, Cancelled</em>) sebagai riwayat internal bagi pengguna yang berpartisipasi.
            </li>
          </ol>
        </div>
      ),
    },
    {
      id: "asisten-ai",
      title: "7. Pemanfaatan Asisten Kecerdasan Buatan (Lumora AI)",
      icon: Sparkles,
      content: (
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            Fitur <strong>Lumora AI</strong> disediakan sebagai alat bantu penyusunan draf editorial teks:
          </p>
          <ul className="space-y-2 pl-4 border-l-2 border-forest/20 text-xs sm:text-sm">
            <li>Fitur AI disediakan “sebagaimana adanya” (<em>as-is</em>). LUMORA tidak menjamin bahwa saran teks atau kategorisasi yang dihasilkan bebas dari kekeliruan interpretasi bahasa.</li>
            <li>Pengguna memegang tanggung jawab akhir atas kebenaran faktual dari setiap narasi, deskripsi, atau model bisnis yang disimpan dan diterbitkan ke profil publik.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "larangan",
      title: "8. Perilaku yang Dilarang (Prohibited Activities)",
      icon: ShieldAlert,
      content: (
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>Dalam menggunakan layanan LUMORA, Anda dilarang keras untuk:</p>
          <ul className="list-disc pl-5 space-y-2 text-xs sm:text-sm">
            <li>Meniru identitas orang lain, mencatut nama bisnis/merek dagang terdaftar tanpa izin, atau membuat akun fiktif.</li>
            <li>Mengunggah materi yang memuat virus, perangkat perusak (malware), atau kode berbahaya lainnya.</li>
            <li>Melakukan tindakan yang membebani infrastruktur server secara tidak wajar, serangan DDoS, atau upaya menembus mekanisme autentikasi.</li>
            <li>Menyalahgunakan fitur Inbox untuk pelecehan, ancaman, konten pornografi, penipuan finansial, atau aktivitas ilegal menurut hukum Indonesia.</li>
          </ul>
        </div>
      ),
    },
    {
      id: "penolakan-jaminan",
      title: "9. Batasan Tanggung Jawab & Penolakan Jaminan",
      icon: Gavel,
      content: (
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            LUMORA berupaya keras menyediakan platform yang stabil, andal, dan bermanfaat bagi ekosistem UMKM. Namun demikian,
            sepanjang diizinkan oleh hukum yang berlaku:
          </p>
          <ul className="space-y-2 text-xs sm:text-sm">
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span>LUMORA tidak menjamin bahwa setiap profil UMKM yang terdaftar akan mendapatkan mitra, pembiayaan, atau peningkatan penjualan.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span>LUMORA tidak bertanggung jawab atas kerugian finansial, sengketa wanprestasi, atau kerugian immaterial yang timbul dari kesepakatan mandiri antara UMKM dan Mitra di luar platform.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold text-forest">•</span>
              <span>LUMORA tidak bertanggung jawab atas kegagalan teknis di luar kendali wajar kami (<em>force majeure</em>), termasuk gangguan jaringan internet nasional atau bencana alam.</span>
            </li>
          </ul>
        </div>
      ),
    },
    {
      id: "penyelesaian-sengketa",
      title: "10. Hukum yang Berlaku & Penyelesaian Sengketa",
      icon: HelpCircle,
      content: (
        <div className="space-y-3 text-sm text-muted leading-relaxed">
          <p>
            Syarat dan Ketentuan ini diatur, ditafsirkan, dan tunduk pada hukum <strong>Negara Kesatuan Republik Indonesia</strong>.
          </p>
          <p>
            Apabila terjadi perselisihan atau sengketa yang timbul dari atau berkaitan dengan penggunaan layanan platform LUMORA, para pihak sepakat untuk menyelesaikan sengketa tersebut terlebih dahulu melalui jalur musyawarah untuk mufakat dalam jangka waktu 30 (tiga puluh) hari kalender.
          </p>
          <p>
            Apabila musyawarah tidak mencapai mufakat, sengketa akan diselesaikan melalui yurisdiksi Pengadilan Negeri yang berwenang di wilayah hukum domisili operasional LUMORA.
          </p>
        </div>
      ),
    },
  ];

  return (
    <>
      <Hero
        eyebrow="Syarat dan Ketentuan Layanan"
        title={"Aturan main bersama untuk\nekosistem kemitraan yang sehat."}
        description="Pelajari hak, kewajiban, tata cara berkolaborasi, dan batasan layanan resmi platform LUMORA demi keamanan dan keadilan seluruh pihak."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-semibold text-lime">
              Edisi 2.0 · Berlaku Efektif
            </span>
            <span className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs text-mint">
              Yurisdiksi Republik Indonesia
            </span>
          </div>
        }
      />

      <section className="py-14 sm:py-20 md:py-28 bg-ivory">
        <Container>
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-[280px_1fr]">
            {/* Table of Contents / Sidebar Navigator */}
            <aside className="hidden lg:block sticky top-28 self-start space-y-4">
              <div className="rounded-2xl border border-line bg-surface p-5 shadow-xs">
                <p className="text-xs font-bold uppercase tracking-wider text-accent mb-3">
                  Daftar Pasal Ketentuan
                </p>
                <nav className="space-y-1.5 text-xs text-muted">
                  {sections.map((sec) => (
                    <a
                      key={sec.id}
                      href={`#${sec.id}`}
                      className="block py-1 hover:text-forest transition-colors leading-snug"
                    >
                      {sec.title}
                    </a>
                  ))}
                </nav>
                <div className="mt-6 pt-4 border-t border-line/60">
                  <Link
                    href={ROUTES.privacy}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-forest hover:underline"
                  >
                    <ShieldCheck className="size-3.5 text-accent" />
                    <span>Baca Kebijakan Privasi</span>
                  </Link>
                </div>
              </div>
            </aside>

            {/* Main Terms Content */}
            <div className="space-y-10 sm:space-y-12">
              {sections.map((sec) => (
                <article
                  key={sec.id}
                  id={sec.id}
                  className="rounded-2xl border border-line bg-surface p-6 sm:p-8 shadow-xs scroll-mt-28"
                >
                  <div className="flex items-center gap-3 border-b border-line/60 pb-4">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-soft-green text-forest">
                      <sec.icon className="size-5" />
                    </div>
                    <h2 className="font-display text-xl sm:text-2xl font-semibold text-forest">
                      {sec.title}
                    </h2>
                  </div>
                  <div className="mt-5">{sec.content}</div>
                </article>
              ))}

              {/* Bottom Navigation CTA */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-forest/20 bg-forest p-6 sm:p-8 text-white">
                <div>
                  <h3 className="font-display text-xl font-semibold text-white">
                    Siap memulai langkah kemitraan baru?
                  </h3>
                  <p className="mt-1 text-sm text-mint">
                    Jelajahi potensi UMKM Indonesia atau daftarkan profil bisnis Anda di LUMORA.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <Link
                    href={ROUTES.explore}
                    className={buttonStyles({
                      variant: "onDark",
                      size: "sm",
                      className: "gap-1.5 shadow-xs font-semibold",
                    })}
                  >
                    <span>Jelajahi UMKM</span>
                    <ArrowRight className="size-4" />
                  </Link>
                  <Link
                    href={ROUTES.register}
                    className={buttonStyles({
                      variant: "onDarkOutline",
                      size: "sm",
                      className: "gap-1.5",
                    })}
                  >
                    <span>Daftar Sekarang</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
