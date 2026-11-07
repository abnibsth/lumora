import { BusinessCategory, Business } from "./business";

// -----------------------------------------------------------------------------
// PARTNER CLASSIFICATION
// -----------------------------------------------------------------------------

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

// -----------------------------------------------------------------------------
// MASTER TAXONOMY IDENTIFIERS
// -----------------------------------------------------------------------------

export const MASTER_TAXONOMY = {
  PRODUCT_DISTRIBUTION: "PRODUCT_DISTRIBUTION",
  RETAIL_CONSIGNMENT: "RETAIL_CONSIGNMENT",
  RESELLER_NETWORK: "RESELLER_NETWORK",
  LICENSING_FRANCHISE: "LICENSING_FRANCHISE",
  PRODUCTION_PARTNERSHIP: "PRODUCTION_PARTNERSHIP",
  RAW_MATERIAL_SUPPLY: "RAW_MATERIAL_SUPPLY",
  EQUIPMENT_TOOL_SUPPLY: "EQUIPMENT_TOOL_SUPPLY",
  BUSINESS_EXPANSION: "BUSINESS_EXPANSION",
  FUNDING_INTRODUCTION: "FUNDING_INTRODUCTION",
  OPERATIONAL_MENTORING: "OPERATIONAL_MENTORING",
  TECHNOLOGY_INTEGRATION: "TECHNOLOGY_INTEGRATION",
  MARKETING_CO_BRANDING: "MARKETING_CO_BRANDING",
} as const;

export type MasterTaxonomyID = (typeof MASTER_TAXONOMY)[keyof typeof MASTER_TAXONOMY];

export interface TaxonomyMeta {
  id: MasterTaxonomyID;
  cluster: string;
  partnerOfferLabel: string; // Vektor 1: Ditawarkan Mitra ke UMKM
  partnerSeekLabel: string;  // Vektor 2: Dicari Mitra dari UMKM
  umkmSeekLabel: string;     // Vektor 3: Kebutuhan yang Dicari UMKM
  description: string;
}

export const MASTER_TAXONOMY_REGISTRY: Record<MasterTaxonomyID, TaxonomyMeta> = {
  PRODUCT_DISTRIBUTION: {
    id: "PRODUCT_DISTRIBUTION",
    cluster: "Distribusi & Penjualan",
    partnerOfferLabel: "Distribusi Produk & Jaringan Penjualan",
    partnerSeekLabel: "Distribusi Produk",
    umkmSeekLabel: "Mitra Distribusi",
    description: "Jalur distribusi toko, minimarket, atau logistik skala regional/nasional.",
  },
  RETAIL_CONSIGNMENT: {
    id: "RETAIL_CONSIGNMENT",
    cluster: "Distribusi & Penjualan",
    partnerOfferLabel: "Konsinyasi & Display Retail Fisik",
    partnerSeekLabel: "Konsinyasi / Titip Jual",
    umkmSeekLabel: "Penjualan Retail / Titip Jual",
    description: "Penempatan barang titip jual pada display toko, butik, atau gerai offline.",
  },
  RESELLER_NETWORK: {
    id: "RESELLER_NETWORK",
    cluster: "Distribusi & Penjualan",
    partnerOfferLabel: "Jaringan Reseller, Agen & Dropship",
    partnerSeekLabel: "Reseller & Keagenan",
    umkmSeekLabel: "Jaringan Reseller & Agen",
    description: "Penyediaan komunitas atau jalur tenaga penjual independen.",
  },
  LICENSING_FRANCHISE: {
    id: "LICENSING_FRANCHISE",
    cluster: "Distribusi & Penjualan",
    partnerOfferLabel: "Lisensi Merek, Waralaba & Hak Usaha",
    partnerSeekLabel: "Kemitraan Lisensi & Waralaba",
    umkmSeekLabel: "Kemitraan Lisensi / Waralaba",
    description: "Model pengembangan usaha melalui sistem waralaba atau lisensi hak cipta/merek.",
  },
  PRODUCTION_PARTNERSHIP: {
    id: "PRODUCTION_PARTNERSHIP",
    cluster: "Produksi & Manufaktur",
    partnerOfferLabel: "Kapasitas Produksi Bersama & Maklon",
    partnerSeekLabel: "Kemitraan Produksi / Maklon",
    umkmSeekLabel: "Mitra Produksi",
    description: "Fasilitas produksi maklon, bengkel bersama, atau kelompok jahit/pengrajin.",
  },
  RAW_MATERIAL_SUPPLY: {
    id: "RAW_MATERIAL_SUPPLY",
    cluster: "Produksi & Manufaktur",
    partnerOfferLabel: "Pasokan Bahan Baku & Komoditas Hulu",
    partnerSeekLabel: "Pasokan Bahan Mentah/Baku",
    umkmSeekLabel: "Pasokan Bahan Baku",
    description: "Penyediaan bahan mentah, rempah, kain, biji kopi, atau material produksi reguler.",
  },
  EQUIPMENT_TOOL_SUPPLY: {
    id: "EQUIPMENT_TOOL_SUPPLY",
    cluster: "Produksi & Manufaktur",
    partnerOfferLabel: "Pengadaan Alat, Mesin & Kemasan B2B",
    partnerSeekLabel: "Pengadaan Alat & Kemasan Usaha",
    umkmSeekLabel: "Peralatan & Kemasan Usaha",
    description: "Peralatan operasional, mesin produksi, kemasan standing pouch, atau perlengkapan B2B.",
  },
  BUSINESS_EXPANSION: {
    id: "BUSINESS_EXPANSION",
    cluster: "Pertumbuhan & Skala",
    partnerOfferLabel: "Ekspansi Gerai & Pembukaan Cabang",
    partnerSeekLabel: "Ekspansi & Pembukaan Cabang",
    umkmSeekLabel: "Mitra Ekspansi",
    description: "Kerjasama membuka titik cabang baru, co-ownership outlet, atau ekspansi kota.",
  },
  FUNDING_INTRODUCTION: {
    id: "FUNDING_INTRODUCTION",
    cluster: "Pertumbuhan & Skala",
    partnerOfferLabel: "Akses Permodalan & Pembiayaan Kolaboratif",
    partnerSeekLabel: "Pendanaan & Modal Kolaboratif",
    umkmSeekLabel: "Akses Permodalan",
    description: "Dukungan modal kerja, pembiayaan alat, atau bagi hasil non-perbankan.",
  },
  OPERATIONAL_MENTORING: {
    id: "OPERATIONAL_MENTORING",
    cluster: "Pendampingan & Inovasi",
    partnerOfferLabel: "Mentoring Operasional, SOP & Sertifikasi",
    partnerSeekLabel: "Mentoring & Standarisasi SOP",
    umkmSeekLabel: "Mitra Operasional",
    description: "Pendampingan legalitas (BPOM/Halal), tata kelola dapur/bengkel, dan efisiensi SOP.",
  },
  TECHNOLOGY_INTEGRATION: {
    id: "TECHNOLOGY_INTEGRATION",
    cluster: "Pendampingan & Inovasi",
    partnerOfferLabel: "Solusi Teknologi, POS & Otomasi Operasional",
    partnerSeekLabel: "Integrasi Sistem & Teknologi",
    umkmSeekLabel: "Mitra Teknologi",
    description: "Sistem pencatatan kasir/inventori digital, perangkat lunak, dan otomatisasi pesanan.",
  },
  MARKETING_CO_BRANDING: {
    id: "MARKETING_CO_BRANDING",
    cluster: "Pendampingan & Inovasi",
    partnerOfferLabel: "Co-Branding, Event & Pemasaran Bersama",
    partnerSeekLabel: "Kolaborasi Pemasaran & Co-Branding",
    umkmSeekLabel: "Mitra Proyek",
    description: "Kampanye kolaboratif dua brand, kolaborasi kemasan tematik, dan aktivasi pasar bersama.",
  },
};

export const MASTER_TAXONOMY_LIST = Object.values(MASTER_TAXONOMY);

// Legacy backward-compatibility alias
export const COLLABORATION_TYPES = MASTER_TAXONOMY_LIST;
export type CollaborationType = MasterTaxonomyID;

// -----------------------------------------------------------------------------
// DOMAIN ENTITIES
// -----------------------------------------------------------------------------

// PartnerProfile represents a partner's public identity & offered capabilities.
export interface PartnerProfile {
  id: string;
  userId: string;
  companyName: string;
  partnerType: PartnerType | "";
  logo: string;
  location: string;
  operationalCoverage: string;
  description: string;
  offeredCollaborations: MasterTaxonomyID[];
  contactEmail: string;
  contactPhone: string;
  contactSocial: string;
  shareContact: boolean;
  completeness: number;
  createdAt: string;
  updatedAt: string;
}

// PartnerPreferences represents a partner's private search & matching criteria.
export interface PartnerPreferences {
  id: string;
  userId: string;
  partnerProfileId: string;
  targetCategories: BusinessCategory[];
  searchRegion: string;
  strictRegionMatch: boolean;
  seekingCollaborations: MasterTaxonomyID[];
  specificNeeds: string;
  qualificationCriteria: string;
  hasPreferences: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MatchReason {
  type: "SECTOR" | "TAXONOMY" | "REGION" | "DATA" | "VERIFIED" | string;
  label: string;
  detail: string;
}

export interface BusinessMatch {
  business: Business;
  matchScore: number; // 0 - 100
  reasons: MatchReason[];
}

export interface BusinessMatchList {
  items: BusinessMatch[];
  total: number;
  page: number;
  limit: number;
  hasPreferences: boolean;
}

// -----------------------------------------------------------------------------
// INPUT DTOS
// -----------------------------------------------------------------------------

export type UpsertPartnerProfileInput = {
  companyName: string;
  partnerType: PartnerType | "";
  logo?: string;
  location: string;
  operationalCoverage: string;
  description: string;
  offeredCollaborations: MasterTaxonomyID[];
  contactEmail?: string;
  contactPhone?: string;
  contactSocial?: string;
  shareContact: boolean;
};

export type UpsertPartnerPreferencesInput = {
  targetCategories: BusinessCategory[];
  searchRegion: string;
  strictRegionMatch: boolean;
  seekingCollaborations: MasterTaxonomyID[];
  specificNeeds: string;
  qualificationCriteria: string;
};

export type PartnerDashboardView =
  | "dashboard"
  | "explore"
  | "saved"
  | "profile"
  | "preferences"
  | "requests"
  | "inbox"
  | "history"
  | "notifications"
  | "settings";
