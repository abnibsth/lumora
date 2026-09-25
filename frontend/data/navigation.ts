import { ROUTES, SECTION_IDS } from "@/lib/constants";

export interface NavItem {
  label: string;
  href: string;
}

export const primaryNav: NavItem[] = [
  { label: "Jelajahi Bisnis", href: ROUTES.explore },
  { label: "Cara Kerja", href: ROUTES.howItWorks },
  { label: "Untuk UMKM", href: ROUTES.forBusiness },
  { label: "Untuk Mitra", href: ROUTES.forPartners },
  { label: "Tentang", href: ROUTES.about },
];

export interface FooterColumn {
  title: string;
  items: NavItem[];
}

/**
 * Four columns because the product genuinely has four link groups: the general
 * product surface, and one column per audience it serves. The two audience
 * columns are the product's core structure, not the generic
 * Product/Company/Resources/Legal template.
 *
 * "Kontak" from PRD 10.14 is absent on purpose: no contact address exists yet,
 * and a link to a mailbox nobody reads is worse than no link (R-38).
 */
export const footerColumns: FooterColumn[] = [
  {
    title: "Produk",
    items: [
      { label: "Jelajahi UMKM", href: `#${SECTION_IDS.businesses}` },
      { label: "Cara Kerja", href: `#${SECTION_IDS.howItWorks}` },
      { label: "Fitur", href: `#${SECTION_IDS.ai}` },
      { label: "Tentang", href: `#${SECTION_IDS.about}` },
    ],
  },
  {
    title: "Untuk UMKM",
    items: [
      { label: "Buat Profil", href: ROUTES.registerUmkm },
      { label: "Perjalanan Bisnis", href: `#${SECTION_IDS.journey}` },
      { label: "Business Model Canvas", href: `#${SECTION_IDS.ai}` },
      { label: "Asisten AI", href: `#${SECTION_IDS.ai}` },
    ],
  },
  {
    title: "Untuk Pemodal",
    items: [
      { label: "Discovery", href: ROUTES.explore },
      { label: "Profil Bisnis", href: `#${SECTION_IDS.showcase}` },
      { label: "AI Discovery", href: `#${SECTION_IDS.ai}` },
    ],
  },
  {
    title: "Perusahaan",
    items: [
      { label: "Tentang LUMORA", href: `#${SECTION_IDS.about}` },
      { label: "FAQ", href: `#${SECTION_IDS.faq}` },
    ],
  },
];

export const legalNav: NavItem[] = [
  { label: "Kebijakan Privasi", href: ROUTES.privacy },
  { label: "Syarat dan Ketentuan", href: ROUTES.terms },
];
