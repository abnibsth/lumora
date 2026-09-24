import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PlaceholderPage } from "@/components/layout/placeholder-page";
import { businesses } from "@/data/businesses";

export function generateStaticParams() {
  return businesses.map((business) => ({ slug: business.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = businesses.find((item) => item.slug === slug);
  return { title: business ? business.name : "Profil bisnis" };
}

export default async function BusinessProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = businesses.find((item) => item.slug === slug);

  // A slug that matches nothing is a missing page, not a placeholder page. It
  // has to 404 now so that behaviour does not change once real profiles ship.
  if (!business) notFound();

  return (
    <PlaceholderPage
      title={`Profil ${business.name} belum dibuka`}
      description={`${business.name} adalah salah satu contoh bisnis yang dipakai di halaman utama. Halaman profil lengkapnya belum dibuat.`}
      detail="Profil lengkap akan memuat cerita usaha, indikator perkembangan, perjalanan bisnis, dan Business Model Canvas. Isi halaman ini nanti berasal dari data yang diberikan pemilik usaha."
    />
  );
}
