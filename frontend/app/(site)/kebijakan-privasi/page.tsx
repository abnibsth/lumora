import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { buttonStyles } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROUTES } from "@/lib/constants";

const pageMetadata: Record<string, Metadata> = {
  "how-it-works": { title: "Cara Kerja", description: "Pelajari bagaimana LUMORA mengubah informasi bisnis menjadi profil yang mudah ditemukan." },
  "for-business": { title: "Untuk UMKM", description: "Bangun profil, dokumentasikan perjalanan, dan buka kesempatan bisnis melalui LUMORA." },
  "for-partners": { title: "Untuk Mitra", description: "Temukan dan pahami UMKM sebelum memulai percakapan dengan pemiliknya." },
  about: { title: "Tentang LUMORA", description: "Kenali alasan LUMORA dibangun untuk bisnis kecil Indonesia." },
};

export async function generateMetadata({ searchParams }: { searchParams: Promise<{ view?: string }> }): Promise<Metadata> {
  const { view } = await searchParams;
  return pageMetadata[view ?? ""] ?? { title: "Kebijakan Privasi" };
}

const previewClass = "rounded-2xl bg-surface p-6 shadow-lift";

function PageHero({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description: string; actions?: React.ReactNode }) {
  return <section className="bg-forest py-16 text-white md:py-24"><Container><SectionHeading as="h1" eyebrow={eyebrow} title={title} description={description} className="max-w-4xl" titleClassName="font-display whitespace-pre-line text-white" />{actions ? <div className="mt-8 flex flex-wrap gap-3">{actions}</div> : null}</Container></section>;
}

function CTA({ title, label, href }: { title: string; label: string; href: string }) {
  return <section className="py-16 md:py-24"><Container><div className="rounded-2xl bg-forest p-8 text-white md:p-14"><h2 className="max-w-3xl font-display text-4xl font-semibold md:text-5xl">{title}</h2><Link href={href} className={buttonStyles({ variant: "onDark", size: "lg", className: "mt-8" })}>{label}</Link></div></Container></section>;
}

const howSteps = [
  ["01", "Ceritakan Bisnismu", "Mulai dari informasi yang sudah ada: produk, pelanggan, tantangan, dan tujuan usaha."],
  ["02", "Bangun Profil", "Susun informasi menjadi profil yang mudah dibaca tanpa menghilangkan suara pemiliknya."],
  ["03", "Tunjukkan Perjalanan", "Catat perubahan penting agar orang memahami bagaimana usaha berkembang."],
  ["04", "Ditemukan", "Profil muncul dalam pencarian berdasarkan kategori, lokasi, dan kebutuhan."],
  ["05", "Terhubung", "Mitra dapat mengenal konteks bisnis sebelum memulai percakapan langsung."],
];

function HowItWorksPage() {
  return <><PageHero eyebrow="Cara Kerja" title="Dari cerita bisnis menjadi peluang untuk ditemukan." description="LUMORA membantu informasi sederhana tentang bisnis menjadi profil yang lebih mudah dipahami." /><section className="py-16 md:py-24"><Container><ol className="space-y-16">{howSteps.map(([number, title, body], index) => <li key={number} className="grid items-center gap-8 lg:grid-cols-2"><div className={index % 2 ? "lg:order-2" : ""}><p className="text-lg font-semibold text-accent">{number}</p><h2 className="mt-3 font-display text-4xl font-semibold text-ink">{title}</h2><p className="mt-5 max-w-xl text-lg leading-8 text-muted">{body}</p></div><div className={`${previewClass} ${index % 2 ? "lg:order-1" : ""}`}><p className="text-xs font-medium text-accent">Contoh tampilan</p><div className="mt-5 space-y-3"><div className="h-3 w-2/3 rounded bg-mint" /><div className="h-3 w-full rounded bg-line" /><div className="h-3 w-5/6 rounded bg-line" /><div className="mt-6 flex gap-3"><span className="h-12 flex-1 rounded-xl bg-forest" /><span className="h-12 w-24 rounded-xl bg-mint" /></div></div></div></li>)}</ol></Container></section><CTA title="Siap menceritakan perjalanan bisnismu?" label="Buat Profil" href={ROUTES.registerUmkm} /></>;
}

function ForBusinessPage() {
  const features = [["Profil Bisnis", "Satukan cerita, produk, lokasi, dan kebutuhan usaha dalam satu halaman."], ["Business Journey", "Dokumentasikan langkah penting dan perubahan yang membentuk bisnis."], ["Business Model Canvas", "Lihat cara bisnis bekerja dalam sembilan bagian yang mudah diperbarui."], ["Data & Perkembangan", "Catat angka usaha sebagai konteks, bukan sebagai satu-satunya cerita."], ["LUMORA AI", "Gunakan asisten untuk membantu menyusun draf yang tetap bisa ditinjau dan diedit."]];
  return <><PageHero eyebrow="Untuk UMKM" title={"Bisnismu lebih dari sekadar angka.\nCeritakan semuanya."} description="Bangun profil usaha, dokumentasikan perjalanan, dan buka kesempatan untuk ditemukan mitra yang tepat." actions={<><Link href={ROUTES.registerUmkm} className={buttonStyles({ variant: "onDark", size: "lg" })}>Buat Profil Bisnis</Link><Link href={ROUTES.howItWorks} className={buttonStyles({ variant: "onDarkOutline", size: "lg" })}>Lihat Cara Kerja</Link></>} /><section className="py-16 md:py-24"><Container><div className="grid gap-x-14 gap-y-10 md:grid-cols-2">{features.map(([title, body], index) => <article key={title} className={index === 4 ? "rounded-2xl bg-mint/40 p-7 md:col-span-2" : "border-t border-line pt-6"}><p className="text-sm font-semibold text-accent">0{index + 1}</p><h2 className="mt-3 font-display text-3xl font-semibold text-ink">{title}</h2><p className="mt-4 max-w-xl leading-7 text-muted">{body}</p>{index === 4 ? <div className="mt-7 grid gap-3 md:grid-cols-2"><div className="rounded-xl bg-surface p-5"><p className="text-xs font-semibold text-muted">Kamu</p><p className="mt-2 text-ink">Saya punya kedai kopi yang sudah berjalan 3 tahun...</p></div><div className="rounded-xl bg-forest p-5 text-white"><p className="text-xs font-semibold text-green">LUMORA AI</p><p className="mt-2">Mari kita bantu susun cerita bisnis Kopi Ruang Senja.</p></div><p className="text-sm text-muted md:col-span-2">Setiap draf AI dapat ditinjau, diubah, atau dihapus oleh pemilik bisnis.</p></div> : null}</article>)}</div><div className="mt-20 overflow-hidden rounded-2xl bg-surface shadow-panel"><div className="border-b border-line p-6"><Badge tone="demo">Preview dashboard UMKM</Badge></div><div className="grid gap-6 p-6 md:grid-cols-[0.7fr_1.3fr]"><div className="space-y-3"><div className="h-12 rounded-xl bg-forest" /><div className="h-12 rounded-xl bg-mint" /><div className="h-12 rounded-xl bg-background" /></div><div className="min-h-64 rounded-2xl bg-background p-6"><div className="h-5 w-1/2 rounded bg-forest" /><div className="mt-8 grid grid-cols-2 gap-4"><div className="h-28 rounded-xl bg-surface" /><div className="h-28 rounded-xl bg-surface" /></div></div></div></div></Container></section><CTA title="Mulai ceritakan bisnismu." label="Buat Profil Bisnis" href={ROUTES.registerUmkm} /></>;
}

function ForPartnersPage() {
  const steps = [["01", "Temukan bisnis", "Cari berdasarkan kategori, kota, atau kebutuhan bisnis."], ["02", "Pahami bisnisnya", "Baca cerita, perjalanan, model bisnis, dan data yang diberikan pemilik."], ["03", "Simpan yang menarik", "Tandai profil untuk dibaca kembali di perangkat yang sama."], ["04", "Gunakan LUMORA AI", "Minta ringkasan informasi atau temukan profil yang sesuai dengan kriteria."], ["05", "Hubungi Pemilik", "Mulai komunikasi langsung setelah memahami konteks usahanya."]];
  return <><PageHero eyebrow="Untuk Mitra" title={"Temukan bisnis.\nKenali ceritanya.\nMulai percakapan."} description="Jelajahi UMKM dan pahami perjalanan bisnis mereka sebelum memulai percakapan." actions={<Link href={ROUTES.explore} className={buttonStyles({ variant: "onDark", size: "lg" })}>Jelajahi Bisnis</Link>} /><section className="py-16 md:py-24"><Container><div className="space-y-6">{steps.map(([number, title, body], index) => <article key={number} className="grid gap-5 border-t border-line py-7 md:grid-cols-[5rem_0.8fr_1.2fr]"><p className="text-2xl font-semibold text-accent">{number}</p><h2 className="font-display text-3xl font-semibold text-ink">{title}</h2><div><p className="leading-7 text-muted">{body}</p>{index === 3 ? <div className="mt-5 rounded-2xl bg-surface p-5 shadow-lift"><p className="text-xs font-semibold text-accent">Contoh permintaan</p><p className="mt-2 text-ink">Temukan UMKM F&amp;B di Bandung yang sedang mencari mitra ekspansi.</p><p className="mt-4 text-xs text-muted">LUMORA AI hanya membantu pencarian dan merangkum informasi profil. Keputusan tetap dibuat oleh manusia.</p></div> : null}</div></article>)}</div></Container></section><CTA title="Mulai menjelajah bisnis." label="Jelajahi Bisnis" href={ROUTES.explore} /></>;
}

function AboutPage() {
  const principles = [["01", "Bisnis sebelum angka."], ["02", "Teknologi harus mempermudah."], ["03", "AI membantu, manusia memutuskan."], ["04", "Kesempatan harus lebih mudah ditemukan."]];
  return <><PageHero title={"Bisnis kecil layak mendapatkan\npanggung yang lebih besar."} description="LUMORA membantu pemilik UMKM menyusun cerita bisnis yang dapat dipahami, lalu membuatnya lebih mudah ditemukan oleh calon mitra." /><section className="py-16 md:py-24"><Container><div className="grid gap-10 lg:grid-cols-2"><div><p className="text-sm font-medium text-accent">Kenapa LUMORA ada?</p><h2 className="mt-3 font-display text-4xl font-semibold text-ink">Banyak usaha dimulai jauh dari ruang presentasi.</h2></div><div className="space-y-5 text-lg leading-8 text-muted"><p>Mereka tumbuh dari dapur rumah, bengkel kecil, kios, kedai kopi, dan toko di lingkungan sekitar.</p><p>Informasi tentang bisnis sering tersebar di percakapan, catatan, dan ingatan pemiliknya. LUMORA memberi tempat untuk menyusunnya menjadi profil yang utuh.</p></div></div></Container></section><section className="bg-surface py-16 md:py-24"><Container><h2 className="font-display text-4xl font-semibold text-ink">Yang kami percaya</h2><div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-line md:grid-cols-2">{principles.map(([number, text]) => <div key={number} className="bg-[#fffdf8] p-7"><p className="text-sm font-semibold text-accent">{number}</p><h3 className="mt-3 font-display text-2xl font-semibold text-ink">{text}</h3></div>)}</div></Container></section><section className="py-16 md:py-24"><Container><div className="grid gap-6 lg:grid-cols-2"><div className="rounded-2xl bg-forest p-8 text-white"><p className="text-sm font-medium text-green">LUMORA adalah</p><h2 className="mt-4 font-display text-4xl font-semibold">Digital Pitching + Business Discovery Platform.</h2></div><div className="rounded-2xl bg-mint/35 p-8"><p className="text-sm font-medium text-accent">LUMORA bukan</p><ul className="mt-5 space-y-3 text-ink"><li>Crowdfunding</li><li>Payment gateway</li><li>Platform transaksi investasi</li><li>Layanan rekomendasi investasi</li></ul></div></div></Container></section><CTA title="Temukan cerita bisnis di LUMORA." label="Jelajahi Bisnis" href={ROUTES.explore} /></>;
}

export default async function EditorialPage({ searchParams }: { searchParams: Promise<{ view?: string }> }) {
  const { view } = await searchParams;
  if (view === "how-it-works") return <HowItWorksPage />;
  if (view === "for-business") return <ForBusinessPage />;
  if (view === "for-partners") return <ForPartnersPage />;
  if (view === "about") return <AboutPage />;
  return <PageHero eyebrow="Kebijakan Privasi" title="Kebijakan privasi sedang disusun." description="Dokumen final akan tersedia sebelum penyimpanan akun dan data bisnis diaktifkan." />;
}
