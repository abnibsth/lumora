export const SITE = {
  name: "LUMORA",
  positioning: "Bisnis kecil juga layak untuk dilihat.",
  category: "Digital Pitching + Business Discovery Platform",
} as const;

export const ROUTES = {
  home: "/",
  explore: "/explore",
  login: "/login",
  register: "/register",
  registerUmkm: "/register?role=umkm",
  privacy: "/kebijakan-privasi",
  terms: "/syarat-ketentuan",
  business: (slug: string) => `/business/${slug}`,
} as const;

/**
 * Every id here has a matching section rendered on the landing page. A nav item
 * pointing at an id that no section owns is a dead link, so this map is the
 * single place both the navigation and the page sections read from.
 */
export const SECTION_IDS = {
  hero: "beranda",
  problem: "masalah",
  businesses: "jelajahi-umkm",
  value: "nilai",
  howItWorks: "cara-kerja",
  ai: "fitur",
  showcase: "profil",
  journey: "perjalanan",
  persona: "untuk-siapa",
  about: "tentang",
  faq: "faq",
} as const;
