package domain

import "strings"

// Master Taxonomy Identifiers for LUMORA Partnerships.
const (
	TaxonomyProductDistribution   = "PRODUCT_DISTRIBUTION"
	TaxonomyRetailConsignment     = "RETAIL_CONSIGNMENT"
	TaxonomyResellerNetwork       = "RESELLER_NETWORK"
	TaxonomyLicensingFranchise    = "LICENSING_FRANCHISE"
	TaxonomyProductionPartnership = "PRODUCTION_PARTNERSHIP"
	TaxonomyRawMaterialSupply     = "RAW_MATERIAL_SUPPLY"
	TaxonomyEquipmentToolSupply   = "EQUIPMENT_TOOL_SUPPLY"
	TaxonomyBusinessExpansion     = "BUSINESS_EXPANSION"
	TaxonomyFundingIntroduction   = "FUNDING_INTRODUCTION"
	TaxonomyOperationalMentoring  = "OPERATIONAL_MENTORING"
	TaxonomyTechnologyIntegration = "TECHNOLOGY_INTEGRATION"
	TaxonomyMarketingCoBranding   = "MARKETING_CO_BRANDING"
)

// MasterTaxonomyList contains all 12 canonical taxonomy identifiers.
var MasterTaxonomyList = []string{
	TaxonomyProductDistribution,
	TaxonomyRetailConsignment,
	TaxonomyResellerNetwork,
	TaxonomyLicensingFranchise,
	TaxonomyProductionPartnership,
	TaxonomyRawMaterialSupply,
	TaxonomyEquipmentToolSupply,
	TaxonomyBusinessExpansion,
	TaxonomyFundingIntroduction,
	TaxonomyOperationalMentoring,
	TaxonomyTechnologyIntegration,
	TaxonomyMarketingCoBranding,
}

// TaxonomyItem represents a taxonomy definition with contextual labels.
type TaxonomyItem struct {
	ID           string `json:"id"`
	Cluster      string `json:"cluster"`
	PartnerOffer string `json:"partnerOffer"` // Vektor 1: Ditawarkan Mitra ke UMKM
	PartnerSeek  string `json:"partnerSeek"`  // Vektor 2: Dicari Mitra dari UMKM
	UMKMSeek     string `json:"umkmSeek"`     // Vektor 3: Kebutuhan yang Dicari UMKM
	Description  string `json:"description"`
}

var MasterTaxonomyRegistry = map[string]TaxonomyItem{
	TaxonomyProductDistribution: {
		ID:           TaxonomyProductDistribution,
		Cluster:      "Distribusi & Penjualan",
		PartnerOffer: "Distribusi Produk & Jaringan Penjualan",
		PartnerSeek:  "Distribusi Produk",
		UMKMSeek:     "Mitra Distribusi",
		Description:  "Jalur distribusi toko, minimarket, atau logistik skala regional/nasional.",
	},
	TaxonomyRetailConsignment: {
		ID:           TaxonomyRetailConsignment,
		Cluster:      "Distribusi & Penjualan",
		PartnerOffer: "Konsinyasi & Display Retail Fisik",
		PartnerSeek:  "Konsinyasi / Titip Jual",
		UMKMSeek:     "Penjualan Retail / Titip Jual",
		Description:  "Penempatan barang titip jual pada display toko, butik, atau gerai offline.",
	},
	TaxonomyResellerNetwork: {
		ID:           TaxonomyResellerNetwork,
		Cluster:      "Distribusi & Penjualan",
		PartnerOffer: "Jaringan Reseller, Agen & Dropship",
		PartnerSeek:  "Reseller & Keagenan",
		UMKMSeek:     "Jaringan Reseller & Agen",
		Description:  "Penyediaan komunitas atau jalur tenaga penjual independen.",
	},
	TaxonomyLicensingFranchise: {
		ID:           TaxonomyLicensingFranchise,
		Cluster:      "Distribusi & Penjualan",
		PartnerOffer: "Lisensi Merek, Waralaba & Hak Usaha",
		PartnerSeek:  "Kemitraan Lisensi & Waralaba",
		UMKMSeek:     "Kemitraan Lisensi / Waralaba",
		Description:  "Model pengembangan usaha melalui sistem waralaba atau lisensi hak cipta/merek.",
	},
	TaxonomyProductionPartnership: {
		ID:           TaxonomyProductionPartnership,
		Cluster:      "Produksi & Manufaktur",
		PartnerOffer: "Kapasitas Produksi Bersama & Maklon",
		PartnerSeek:  "Kemitraan Produksi / Maklon",
		UMKMSeek:     "Mitra Produksi",
		Description:  "Fasilitas produksi maklon, bengkel bersama, atau kelompok jahit/pengrajin.",
	},
	TaxonomyRawMaterialSupply: {
		ID:           TaxonomyRawMaterialSupply,
		Cluster:      "Produksi & Manufaktur",
		PartnerOffer: "Pasokan Bahan Baku & Komoditas Hulu",
		PartnerSeek:  "Pasokan Bahan Mentah/Baku",
		UMKMSeek:     "Pasokan Bahan Baku",
		Description:  "Penyediaan bahan mentah, rempah, kain, biji kopi, atau material produksi reguler.",
	},
	TaxonomyEquipmentToolSupply: {
		ID:           TaxonomyEquipmentToolSupply,
		Cluster:      "Produksi & Manufaktur",
		PartnerOffer: "Pengadaan Alat, Mesin & Kemasan B2B",
		PartnerSeek:  "Pengadaan Alat & Kemasan Usaha",
		UMKMSeek:     "Peralatan & Kemasan Usaha",
		Description:  "Peralatan operasional, mesin produksi, kemasan standing pouch, atau perlengkapan B2B.",
	},
	TaxonomyBusinessExpansion: {
		ID:           TaxonomyBusinessExpansion,
		Cluster:      "Pertumbuhan & Skala",
		PartnerOffer: "Ekspansi Gerai & Pembukaan Cabang",
		PartnerSeek:  "Ekspansi & Pembukaan Cabang",
		UMKMSeek:     "Mitra Ekspansi",
		Description:  "Kerjasama membuka titik cabang baru, co-ownership outlet, atau ekspansi kota.",
	},
	TaxonomyFundingIntroduction: {
		ID:           TaxonomyFundingIntroduction,
		Cluster:      "Pertumbuhan & Skala",
		PartnerOffer: "Akses Permodalan & Pembiayaan Kolaboratif",
		PartnerSeek:  "Pendanaan & Modal Kolaboratif",
		UMKMSeek:     "Akses Permodalan",
		Description:  "Dukungan modal kerja, pembiayaan alat, atau bagi hasil non-perbankan.",
	},
	TaxonomyOperationalMentoring: {
		ID:           TaxonomyOperationalMentoring,
		Cluster:      "Pendampingan & Inovasi",
		PartnerOffer: "Mentoring Operasional, SOP & Sertifikasi",
		PartnerSeek:  "Mentoring & Standarisasi SOP",
		UMKMSeek:     "Mitra Operasional",
		Description:  "Pendampingan legalitas (BPOM/Halal), tata kelola dapur/bengkel, dan efisiensi SOP.",
	},
	TaxonomyTechnologyIntegration: {
		ID:           TaxonomyTechnologyIntegration,
		Cluster:      "Pendampingan & Inovasi",
		PartnerOffer: "Solusi Teknologi, POS & Otomasi Operasional",
		PartnerSeek:  "Integrasi Sistem & Teknologi",
		UMKMSeek:     "Mitra Teknologi",
		Description:  "Sistem pencatatan kasir/inventori digital, perangkat lunak, dan otomatisasi pesanan.",
	},
	TaxonomyMarketingCoBranding: {
		ID:           TaxonomyMarketingCoBranding,
		Cluster:      "Pendampingan & Inovasi",
		PartnerOffer: "Co-Branding, Event & Pemasaran Bersama",
		PartnerSeek:  "Kolaborasi Pemasaran & Co-Branding",
		UMKMSeek:     "Mitra Proyek",
		Description:  "Kampanye kolaboratif dua brand, kolaborasi kemasan tematik, dan aktivasi pasar bersama.",
	},
}

// ValidTaxonomyIdentifier checks if an identifier belongs to MasterTaxonomyList.
func ValidTaxonomyIdentifier(id string) bool {
	_, ok := MasterTaxonomyRegistry[strings.TrimSpace(id)]
	return ok
}

// NormalizeTaxonomyIdentifier maps legacy or localized Indonesian strings to canonical identifiers.
func NormalizeTaxonomyIdentifier(raw string) string {
	trimmed := strings.TrimSpace(raw)
	if ValidTaxonomyIdentifier(trimmed) {
		return trimmed
	}

	switch strings.ToLower(trimmed) {
	case "distribusi produk", "mitra distribusi":
		return TaxonomyProductDistribution
	case "konsinyasi / titip jual", "konsinyasi", "titip jual", "mitra retail":
		return TaxonomyRetailConsignment
	case "reseller & agen", "reseller & agen penjualan", "reseller / agen penjualan", "reseller", "agen":
		return TaxonomyResellerNetwork
	case "kemitraan lisensi", "kemitraan lisensi & waralaba", "lisensi", "waralaba", "franchise":
		return TaxonomyLicensingFranchise
	case "kemitraan produksi / maklon", "pengembangan produk bersama", "mitra produksi", "maklon":
		return TaxonomyProductionPartnership
	case "pasokan bahan baku", "pemasok bahan baku", "pasokan bahan", "bahan baku":
		return TaxonomyRawMaterialSupply
	case "b2b supply", "mitra peralatan", "pengadaan alat & kemasan usaha", "peralatan":
		return TaxonomyEquipmentToolSupply
	case "mitra ekspansi", "ekspansi & pembukaan cabang", "ekspansi cabang":
		return TaxonomyBusinessExpansion
	case "pendanaan & modal usaha", "pendanaan & investasi", "mitra modal", "investasi":
		return TaxonomyFundingIntroduction
	case "mentoring operasional", "mentoring & pelatihan", "mitra operasional", "pelatihan":
		return TaxonomyOperationalMentoring
	case "mitra teknologi", "integrasi sistem & teknologi", "solusi teknologi":
		return TaxonomyTechnologyIntegration
	case "kolaborasi pemasaran", "co-branding / kolaborasi pemasaran", "mitra proyek", "co-branding":
		return TaxonomyMarketingCoBranding
	default:
		return trimmed
	}
}

// NormalizeTaxonomySlice maps a slice of strings, removing duplicates and empty values.
func NormalizeTaxonomySlice(items []string) []string {
	seen := make(map[string]bool)
	result := make([]string, 0, len(items))
	for _, item := range items {
		normalized := NormalizeTaxonomyIdentifier(item)
		if normalized != "" && !seen[normalized] {
			seen[normalized] = true
			result = append(result, normalized)
		}
	}
	return result
}
