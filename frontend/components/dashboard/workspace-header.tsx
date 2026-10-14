"use client";

import type { WorkspaceView } from "@/lib/dashboard";

const content = {
  profiles: ["Profil Bisnis", "Kelola identitas, lokasi, foto, dan detail utama usaha. Draft tetap privat sampai diterbitkan."],
  story: ["Cerita Usaha", "Ceritakan latar belakang usaha dan catat perjalanan serta pencapaian bisnis."],
  canvas: ["Business Model Canvas", "Susun sembilan blok model bisnis untuk profil yang dipilih."],
  saved: ["Peluang & Mitra", "Kelola kebutuhan kerja sama usaha dan profil bisnis yang kamu simpan."],
  ai: ["Lumora AI", "Susun draft dari fakta usahamu, lalu tinjau hasilnya di setiap bagian workspace."],
} as const;
export function WorkspacePageHeader({ view }: { view: WorkspaceView }) {
  if (!(view in content)) return null;
  const [title, description] = content[view as keyof typeof content];
  return <header className="mb-6"><h1 className="text-2xl font-semibold tracking-tight text-forest">{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">{description}</p></header>;
}
