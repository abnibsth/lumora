import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { businesses } from "@/data/businesses";
import { Container } from "@/components/ui/container";
import { Badge } from "@/components/ui/badge";
import { buttonStyles } from "@/components/ui/button";
import { BusinessMonogram } from "@/components/business/business-monogram";
import { RevenueChart } from "@/components/business/revenue-chart";
import { ROUTES } from "@/lib/constants";

export function generateStaticParams() {
  return businesses.map((business) => ({ slug: business.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const business = businesses.find((item) => item.slug === slug);
  return { title: business ? business.name : "Profil bisnis", description: business?.description };
}

export default async function BusinessProfilePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = businesses.find((item) => item.slug === slug);
  if (!business) notFound();

  return (
    <article>
      <Container className="py-6">
        <Link href={ROUTES.explore} className="inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-forest hover:text-accent"><span aria-hidden="true">&larr;</span> Jelajahi Bisnis</Link>
      </Container>

      <Container>
        <div className="relative min-h-[320px] overflow-hidden rounded-2xl bg-mint md:min-h-[520px]">
          {business.coverImage ? <Image src={business.coverImage} alt={`Suasana contoh ${business.name}`} fill priority sizes="(min-width: 1280px) 1216px, 100vw" className="object-cover" style={{ objectPosition: business.coverPosition ?? "center" }} /> : null}
          <div className="absolute inset-0 bg-gradient-to-t from-forest/45 via-transparent to-transparent" />
          <Badge tone="demo" className="absolute right-5 top-5">Profil demo</Badge>
        </div>
      </Container>

      <Container className="relative -mt-12 z-10">
        <div className="border-b border-line bg-surface px-6 py-8 md:px-10 md:py-10">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <BusinessMonogram name={business.name} className="h-20 w-20 text-3xl" />
              <div>
                <p className="text-sm font-medium text-accent">{business.category} · {business.location} · Berdiri {business.foundedYear}</p>
                <h1 className="mt-2 font-display text-5xl font-semibold leading-none text-ink md:text-7xl">{business.name}</h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-muted">{business.description}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <button type="button" className={buttonStyles({ variant: "secondary" })}>Simpan</button>
              <a href={`mailto:?subject=Percakapan tentang ${encodeURIComponent(business.name)}`} className={buttonStyles({ variant: "primary" })}>Hubungi Pemilik</a>
            </div>
          </div>
        </div>
      </Container>

      <div className="sticky top-[4.5rem] z-20 mt-10 border-y border-line bg-[#fffdf8]/95 backdrop-blur-sm">
        <Container><nav aria-label="Bagian profil" className="flex gap-6 overflow-x-auto py-1"><a href="#overview" className="inline-flex min-h-12 shrink-0 items-center text-sm font-semibold text-forest">Overview</a><a href="#perjalanan" className="inline-flex min-h-12 shrink-0 items-center text-sm font-semibold text-forest">Perjalanan</a><a href="#model-bisnis" className="inline-flex min-h-12 shrink-0 items-center text-sm font-semibold text-forest">Model Bisnis</a><a href="#perkembangan" className="inline-flex min-h-12 shrink-0 items-center text-sm font-semibold text-forest">Perkembangan</a></nav></Container>
      </div>

      <section id="overview" className="scroll-mt-36 py-16 md:py-24"><Container><div className="grid gap-12 lg:grid-cols-[1.5fr_0.8fr]"><div><p className="text-sm font-medium text-accent">Tentang Bisnis</p><h2 className="mt-3 font-display text-4xl font-semibold text-ink">Cerita di balik {business.name}</h2><p className="mt-6 text-lg leading-8 text-muted">{business.story}</p></div><aside className="rounded-2xl bg-mint/35 p-7"><BusinessMonogram name={business.owner.name} className="h-16 w-16 text-2xl" /><h3 className="mt-5 font-display text-2xl font-semibold text-ink">{business.owner.name}</h3><p className="mt-1 text-sm font-medium text-accent">{business.owner.role}</p><p className="mt-4 leading-7 text-muted">{business.owner.bio}</p></aside></div></Container></section>

      <section id="perjalanan" className="scroll-mt-36 bg-surface py-16 md:py-24"><Container><p className="text-sm font-medium text-accent">Perjalanan Bisnis</p><h2 className="mt-3 font-display text-4xl font-semibold text-ink">Langkah yang membentuk usaha ini</h2><ol className="mt-12 grid gap-0 md:grid-cols-4">{business.milestones.map((item) => <li key={`${item.year}-${item.title}`} className="relative border-l border-forest/25 pb-9 pl-7 md:border-l-0 md:border-t md:px-4 md:pt-7"><span className="absolute -left-2 top-0 h-4 w-4 rounded-full bg-green ring-4 ring-surface md:-top-2 md:left-4" /><p className="text-2xl font-semibold text-forest">{item.year}</p><h3 className="mt-2 font-semibold text-ink">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted">{item.description}</p></li>)}</ol></Container></section>

      <section id="perkembangan" className="scroll-mt-36 py-20 md:py-32"><Container><div className="grid gap-12 lg:grid-cols-[0.65fr_1.35fr]"><div><p className="text-sm font-medium text-accent">Perkembangan Bisnis</p><h2 className="mt-3 font-display text-4xl font-semibold text-ink md:text-5xl">Catatan enam bulan terakhir</h2><Badge tone="demo" className="mt-5">Metrik contoh, bukan data terverifikasi</Badge></div><div><dl className="grid border-y border-line sm:grid-cols-2"><div className="py-6 sm:border-r sm:border-line sm:pr-6"><dt className="text-sm text-muted">Pendapatan bulanan</dt><dd className="mt-2 text-4xl font-semibold text-forest">{business.revenueLabel}</dd></div><div className="border-t border-line py-6 sm:border-t-0 sm:pl-6"><dt className="text-sm text-muted">Pertumbuhan</dt><dd className="mt-2 text-4xl font-semibold text-forest">{business.growthLabel}</dd></div></dl><RevenueChart series={business.revenueSeries ?? []} className="mt-10" /></div></div></Container></section>

      <section id="model-bisnis" className="scroll-mt-36 bg-surface py-16 md:py-24"><Container><p className="text-sm font-medium text-accent">Business Model Canvas</p><h2 className="mt-3 font-display text-4xl font-semibold text-ink">Gambaran cara bisnis bekerja</h2><div className="mt-10 grid gap-px overflow-hidden rounded-2xl bg-line sm:grid-cols-2 lg:grid-cols-3">{business.bmc.map((entry) => <div key={entry.label} className="bg-[#fffdf8] p-6"><h3 className="text-sm font-semibold text-forest">{entry.label}</h3><p className="mt-3 text-sm leading-6 text-muted">{entry.value}</p></div>)}</div></Container></section>

      <section className="py-20 md:py-32"><Container><div className="grid gap-12 border-t border-forest pt-12 lg:grid-cols-[0.6fr_1.4fr]"><div><p className="text-sm font-medium text-accent">Yang Sedang Dicari</p><h2 className="mt-3 font-display text-4xl font-semibold text-ink">{business.seeking?.[0] ?? "Mitra Bisnis"}</h2></div><div><p className="max-w-2xl text-xl leading-9 text-muted">{business.seekingObjective}</p><a href={`mailto:?subject=Percakapan tentang ${encodeURIComponent(business.name)}`} className={buttonStyles({ variant: "primary", size: "lg", className: "mt-8" })}>Hubungi Pemilik</a></div></div><p className="mt-14 border-t border-line pt-6 text-sm text-muted">Data pada profil ini merupakan data contoh.</p></Container></section>
    </article>
  );
}
