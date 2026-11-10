export interface TeamMember {
  id: string;
  /** Nama lengkap anggota tim (otomatis diambil dari nama file di `public/imgteam` atau dari konfigurasi) */
  name: string;
  /** Jabatan atau posisi di LUMORA */
  role: string;
  /** Deskripsi singkat mengenai kontribusi atau tanggung jawab */
  bio: string;
  /** Path foto di dalam folder `frontend/public/imgteam/` */
  photo: string;
  /** Teks alternatif untuk aksesibilitas foto */
  alt?: string;
  /** Posisi fokus crop foto (default: "center top") */
  objectPosition?: string;
}

export const teamSection = {
  eyebrow: "THE PEOPLE BEHIND LUMORA",
  heading: "Kenali Tim di Balik LUMORA",
  subtitle:
    "Bersama membangun ekosistem kolaborasi yang lebih terbuka dan berkelanjutan bagi UMKM Indonesia.",
} as const;

/**
 * Pemetaan spesifik berdasarkan nama anggota tim di `frontend/public/imgteam/`.
 */
export const TEAM_ROLE_BY_NAME: Record<
  string,
  { role: string; bio: string }
> = {
  abni: {
    role: "Frontend & Interactive Systems Engineer",
    bio: "Membangun pengalaman antarmuka web yang responsif, interaktif, dan aksesibel pada katalog profil maupun workspace UMKM.",
  },
  alfian: {
    role: "Lead Backend & AI Engineer",
    bio: "Merancang arsitektur layanan backend, integrasi kecerdasan buatan (AI), serta keandalan infrastruktur dan keamanan data platform.",
  },
  farhan: {
    role: "Project Lead & Product Strategy",
    bio: "Mengarahkan visi produk dan strategi ekosistem kolaborasi agar solusi LUMORA relevan bagi pertumbuhan UMKM Indonesia.",
  },
  lutpi: {
    role: "UI/UX & Product Designer",
    bio: "Merancang sistem identitas visual dan alur pengalaman pengguna yang hangat, intuitif, serta berfokus pada cerita usaha lokal.",
  },
  salman: {
    role: "Business Analyst & Quality Assurance",
    bio: "Memetakan kebutuhan model bisnis UMKM dan mitra kolaborasi sekaligus memastikan standar kualitas di setiap fitur LUMORA.",
  },
};

/**
 * Daftar peran (jobs) dan deskripsi kontribusi berdasarkan urutan alfabet nama file:
 * 1. Abni -> Frontend & Interactive Systems Engineer
 * 2. Alfian -> Lead Backend & AI Engineer
 * 3. Farhan -> Project Lead & Product Strategy
 * 4. Lutpi -> UI/UX & Product Designer
 * 5. Salman -> Business Analyst & Quality Assurance
 */
export const DEFAULT_TEAM_ROLES: ReadonlyArray<{
  role: string;
  bio: string;
}> = [
  TEAM_ROLE_BY_NAME.abni,
  TEAM_ROLE_BY_NAME.alfian,
  TEAM_ROLE_BY_NAME.farhan,
  TEAM_ROLE_BY_NAME.lutpi,
  TEAM_ROLE_BY_NAME.salman,
  {
    role: "Partnership & Ecosystem Development",
    bio: "Mengembangkan jembatan kolaborasi antara pelaku usaha lokal dengan jaringan mitra strategis dan ekosistem pendukung UMKM.",
  },
];

/**
 * Fallback apabila folder `public/imgteam` kosong.
 */
export const teamMembers: TeamMember[] = DEFAULT_TEAM_ROLES.slice(0, 5).map(
  (item, index) => ({
    id: `team-member-${index + 1}`,
    name: `Anggota Tim ${index + 1}`,
    role: item.role,
    bio: item.bio,
    photo: "",
    alt: `Potret Anggota Tim ${index + 1}`,
  })
);
