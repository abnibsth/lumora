package domain

import "strings"

// RegionNode represents an Indonesian province with its key cities/regencies and aliases.
type RegionNode struct {
	Province string
	Cities   []string
	Aliases  []string
}

// Canonical Indonesian Provinces & Major Cities for Hierarchical Matching.
var IndonesianRegions = []RegionNode{
	{
		Province: "Jawa Barat",
		Cities: []string{
			"Bogor", "Kota Bogor", "Kabupaten Bogor",
			"Bandung", "Kota Bandung", "Kabupaten Bandung", "Bandung Barat",
			"Bekasi", "Kota Bekasi", "Kabupaten Bekasi",
			"Depok", "Cimahi", "Cirebon", "Sukabumi", "Tasikmalaya",
			"Garut", "Karawang", "Purwakarta", "Subang", "Sumedang",
			"Indramayu", "Majalengka", "Kuningan", "Cianjur", "Ciamis",
			"Pangandaran", "Banjar",
		},
		Aliases: []string{"Jabar", "Jawa Barat (All)", "Priangan"},
	},
	{
		Province: "DKI Jakarta",
		Cities: []string{
			"Jakarta", "Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat",
			"Jakarta Timur", "Jakarta Utara", "Kepulauan Seribu",
		},
		Aliases: []string{"DKI", "Ibukota", "Jabotabek"},
	},
	{
		Province: "Jawa Timur",
		Cities: []string{
			"Surabaya", "Malang", "Kota Malang", "Kabupaten Malang", "Batu",
			"Sidoarjo", "Gresik", "Pasuruan", "Mojokerto", "Jombang",
			"Kediri", "Blitar", "Madiun", "Banyuwangi", "Jember", "Probolinggo",
			"Lamongan", "Tuban", "Bojonegoro", "Tulungagung",
		},
		Aliases: []string{"Jatim"},
	},
	{
		Province: "DI Yogyakarta",
		Cities: []string{
			"Yogyakarta", "Kota Yogyakarta", "Sleman", "Bantul",
			"Gunungkidul", "Kulon Progo",
		},
		Aliases: []string{"Jogja", "DIY", "Yogya"},
	},
	{
		Province: "Jawa Tengah",
		Cities: []string{
			"Semarang", "Kota Semarang", "Solo", "Surakarta", "Magelang",
			"Pekalongan", "Salatiga", "Tegal", "Banyumas", "Purwokerto",
			"Kudus", "Klaten", "Cilacap", "Kebumen", "Wonoboyo", "Sukoharjo",
		},
		Aliases: []string{"Jateng"},
	},
	{
		Province: "Banten",
		Cities: []string{
			"Tangerang", "Kota Tangerang", "Tangerang Selatan", "Tangsel",
			"Serang", "Cilegon", "Lebak", "Pandeglang",
		},
		Aliases: []string{"Banten Raya"},
	},
	{
		Province: "Bali",
		Cities: []string{
			"Denpasar", "Badung", "Gianyar", "Ubud", "Tabanan",
			"Buleleng", "Singaraja", "Klungkung", "Bangli", "Karangasem", "Jembrana",
		},
		Aliases: []string{"Pulau Dewata", "Bali Island"},
	},
	{
		Province: "Sumatera Utara",
		Cities: []string{
			"Medan", "Binjai", "Pematangsiantar", "Deli Serdang", "Karo", "Toba",
		},
		Aliases: []string{"Sumut"},
	},
	{
		Province: "Sumatera Barat",
		Cities: []string{
			"Padang", "Bukittinggi", "Payakumbuh", "Pariaman", "Solok",
		},
		Aliases: []string{"Sumbar", "Minang"},
	},
	{
		Province: "Sulawesi Selatan",
		Cities: []string{
			"Makassar", "Gowa", "Maros", "Parepare", "Palopo",
		},
		Aliases: []string{"Sulsel"},
	},
}

// SuperRegions groups urban agglomeration corridors.
var SuperRegions = map[string][]string{
	"Jabodetabek": {
		"Jakarta", "Jakarta Selatan", "Jakarta Pusat", "Jakarta Barat", "Jakarta Timur", "Jakarta Utara",
		"Bogor", "Kota Bogor", "Kabupaten Bogor",
		"Depok",
		"Tangerang", "Kota Tangerang", "Tangerang Selatan",
		"Bekasi", "Kota Bekasi", "Kabupaten Bekasi",
	},
	"Bandung Raya": {
		"Bandung", "Kota Bandung", "Kabupaten Bandung", "Cimahi", "Bandung Barat",
	},
	"Gerbangkertosusila": {
		"Gresik", "Bangkalan", "Mojokerto", "Surabaya", "Sidoarjo", "Lamongan",
	},
	"Joglosemar": {
		"Yogyakarta", "Solo", "Surakarta", "Semarang", "Sleman", "Bantul",
	},
}

// CleanRegion normalizes region strings for case-insensitive matching.
func CleanRegion(r string) string {
	r = strings.ToLower(strings.TrimSpace(r))
	r = strings.TrimPrefix(r, "kota ")
	r = strings.TrimPrefix(r, "kabupaten ")
	r = strings.TrimPrefix(r, "kab. ")
	r = strings.TrimPrefix(r, "dki ")
	r = strings.TrimPrefix(r, "di ")
	return strings.TrimSpace(r)
}

// EvaluateGeographicMatch evaluates if a business location matches the partner's search region.
// Returns (matches, confidenceScore).
// confidenceScore: 1.0 (Exact match), 0.9 (Hierarchical / Super-region match), 0.0 (No match).
func EvaluateGeographicMatch(partnerRegion, businessCity string) (bool, float64) {
	pr := strings.TrimSpace(partnerRegion)
	bc := strings.TrimSpace(businessCity)
	if pr == "" {
		// Partner has no region preference: matches all regions with neutral score.
		return true, 0.7
	}
	if bc == "" {
		return false, 0.0
	}

	cleanPR := CleanRegion(pr)
	cleanBC := CleanRegion(bc)

	// 1. Direct or substring match (e.g. "Bandung" == "Bandung" or "Jakarta Selatan" contains "Jakarta")
	if cleanPR == cleanBC || strings.Contains(cleanBC, cleanPR) || strings.Contains(cleanPR, cleanBC) {
		return true, 1.0
	}

	// 2. Super-Region Check (e.g. partnerRegion "Jabodetabek" vs businessCity "Bogor" or "Bekasi")
	for superName, cities := range SuperRegions {
		if strings.EqualFold(cleanPR, CleanRegion(superName)) {
			for _, city := range cities {
				if strings.EqualFold(cleanBC, CleanRegion(city)) || strings.Contains(cleanBC, CleanRegion(city)) {
					return true, 0.95
				}
			}
		}
	}

	// 3. Hierarchical Province -> City Check
	for _, regNode := range IndonesianRegions {
		provClean := CleanRegion(regNode.Province)
		matchesProvince := cleanPR == provClean || strings.Contains(cleanPR, provClean)
		if !matchesProvince {
			for _, alias := range regNode.Aliases {
				if cleanPR == CleanRegion(alias) {
					matchesProvince = true
					break
				}
			}
		}

		if matchesProvince {
			for _, city := range regNode.Cities {
				cClean := CleanRegion(city)
				if cleanBC == cClean || strings.Contains(cleanBC, cClean) || strings.Contains(cClean, cleanBC) {
					return true, 0.9
				}
			}
		}

		// Reverse hierarchy: partner searched a specific city ("Bogor"), UMKM is labeled under province ("Jawa Barat")
		for _, city := range regNode.Cities {
			if cleanPR == CleanRegion(city) && (cleanBC == provClean || strings.Contains(cleanBC, provClean)) {
				return true, 0.8
			}
		}
	}

	return false, 0.0
}
