import Image from "next/image";
import { Sparkles, TrendingUp, Store, Handshake, ShieldCheck, CheckCircle } from "lucide-react";

export function AuthBrandPanel() {
  const benefits = [
    {
      icon: Store,
      title: "Kenali peluang bisnis",
      description: "Pelajari model bisnis (BMC), pencapaian, dan cerita perjalanan usaha secara transparan.",
    },
    {
      icon: Sparkles,
      title: "Temukan UMKM potensial",
      description: "Kurasi pelaku usaha lokal dari sektor F&B, retail, jasa, kreatif, hingga fashion di seluruh Indonesia.",
    },
    {
      icon: Handshake,
      title: "Bangun koneksi kemitraan",
      description: "Jembatan kolaborasi langsung antara pemilik usaha, distributor, investor, dan mitra strategis.",
    },
  ];

  return (
    <div className="relative flex h-full flex-col justify-between overflow-hidden bg-forest p-8 sm:p-10 lg:p-12 xl:p-14 text-white">
      {/* Background authentic business imagery with editorial gradient overlay */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/asset%20lumora/kopi%20ruang%20senja.jpg"
          alt="Suasana UMKM Indonesia"
          fill
          priority
          sizes="(min-width: 1024px) 50vw, 100vw"
          className="object-cover object-center opacity-25 mix-blend-luminosity filter brightness-75 contrast-125 scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-deep-forest via-forest/90 to-forest/80" />
      </div>

      {/* Top: Brand Badge & Headline */}
      <div className="relative z-10 space-y-4 xl:space-y-5">
        <div className="inline-flex items-center gap-2 rounded-full border border-lime/30 bg-lime/10 px-3.5 py-1.5 text-xs font-semibold text-lime backdrop-blur-xs">
          <ShieldCheck className="size-3.5 text-lime" />
          <span>Platform Bisnis & Kemitraan UMKM</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl lg:text-3xl xl:text-4xl font-semibold leading-[1.2] text-white tracking-tight">
          Setiap peluang dimulai dari sebuah cerita.
        </h1>
        <p className="max-w-md text-sm sm:text-base leading-relaxed text-white/80">
          LUMORA mempertemukan potensi usaha mikro, kecil, dan menengah dengan mitra bisnis untuk
          mendorong pertumbuhan ekonomi yang nyata dan berkelanjutan.
        </p>
      </div>

      {/* Middle: 3 Core Benefits */}
      <div className="relative z-10 my-8 space-y-6">
        {benefits.map((b) => (
          <div key={b.title} className="flex items-start gap-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-lime/15 text-lime border border-lime/25">
              <b.icon className="size-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-semibold text-white">{b.title}</h2>
              <p className="mt-1 text-xs sm:text-sm text-white/75 leading-relaxed max-w-md">
                {b.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: Curated Snapshot Card */}
      <div className="relative z-10 rounded-2xl border border-white/15 bg-white/10 p-5 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between text-xs text-white/80">
          <div className="flex items-center gap-1.5 font-medium">
            <CheckCircle className="size-3.5 text-lime" />
            <span>Sorotan Ekosistem LUMORA</span>
          </div>
          <span className="inline-flex items-center gap-1 font-semibold text-lime">
            <TrendingUp className="size-3" />
            Terhubung Nyata
          </span>
        </div>
        <p className="text-xs sm:text-sm italic text-white/95 leading-relaxed">
          &ldquo;Pitching digital membantu kami membagikan visi kedai kepada mitra strategis secara lebih terstruktur.&rdquo;
        </p>
        <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px] text-lime font-medium">
          <span>Kopi Ruang Senja</span>
          <span className="text-white/60">Bandung, Jawa Barat</span>
        </div>
      </div>
    </div>
  );
}
