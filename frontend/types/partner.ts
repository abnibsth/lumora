import { BusinessCategory } from "./business";

export const PARTNER_TYPES = [
  "Distributor",
  "Supplier",
  "Retailer / Reseller",
  "Investor potensial",
  "Mentor / Konsultan",
  "Institusi / Organisasi",
  "Strategic Business Partner",
] as const;

export type PartnerType = (typeof PARTNER_TYPES)[number];

export const COLLABORATION_TYPES = [
  "Distribusi Produk",
  "Pemasok Bahan Baku",
  "Reseller / Agen Penjualan",
  "Pendanaan & Investasi",
  "Mentoring & Pelatihan",
  "Co-branding / Kolaborasi Pemasaran",
  "Kemitraan Lisensi & Waralaba",
  "Pengembangan Produk Bersama",
] as const;

export type CollaborationType = (typeof COLLABORATION_TYPES)[number];

export interface PartnerProfile {
  id: string;
  userId: string;
  companyName: string;
  partnerType: PartnerType | "";
  location: string;
  operationalCoverage: string;
  interestedCategories: BusinessCategory[];
  partnershipTypes: string[];
  description: string;
  shareContact: boolean;
  contactEmail: string;
  contactPhone: string;
  contactSocial: string;
  searchRegion: string;
  collaborationTypes: string[];
  partnershipNeeds: string;
  businessCriteria: string;
  completeness: number;
  createdAt: string;
  updatedAt: string;
}

export type UpsertPartnerProfileInput = Partial<
  Omit<PartnerProfile, "id" | "userId" | "completeness" | "createdAt" | "updatedAt">
>;

export type PartnerDashboardView =
  | "dashboard"
  | "explore"
  | "saved"
  | "profile"
  | "preferences"
  | "settings";

