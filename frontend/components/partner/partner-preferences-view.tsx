"use client";

import { useState } from "react";
import {
  SlidersHorizontal,
  MapPin,
  Target,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  FileText,
  Lock,
  Compass,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { savePartnerPreferences } from "@/lib/api";
import { BUSINESS_CATEGORIES, type BusinessCategory } from "@/types/business";
import {
  MASTER_TAXONOMY_LIST,
  MASTER_TAXONOMY_REGISTRY,
  type PartnerPreferences,
  type MasterTaxonomyID,
} from "@/types/partner";

export function PartnerPreferencesView({
  initialPreferences,
  onPreferencesUpdated,
}: {
  initialPreferences: PartnerPreferences;
  onPreferencesUpdated: (updated: PartnerPreferences) => void;
}) {
  const [preferences, setPreferences] = useState<PartnerPreferences>(initialPreferences);
  const [targetCategories, setTargetCategories] = useState<BusinessCategory[]>(
    preferences.targetCategories || [],
  );
  const [searchRegion, setSearchRegion] = useState(preferences.searchRegion || "");
  const [strictRegionMatch, setStrictRegionMatch] = useState(
    preferences.strictRegionMatch || false,
  );
  const [seekingCollaborations, setSeekingCollaborations] = useState<MasterTaxonomyID[]>(
    preferences.seekingCollaborations || [],
  );
  const [specificNeeds, setSpecificNeeds] = useState(
    preferences.specificNeeds || "",
  );
  const [qualificationCriteria, setQualificationCriteria] = useState(
    preferences.qualificationCriteria || "",
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(category: BusinessCategory) {
    setTargetCategories((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );
  }

  function toggleCollaboration(id: MasterTaxonomyID) {
    setSeekingCollaborations((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const result = await savePartnerPreferences({
      targetCategories,
      searchRegion,
      strictRegionMatch,
      seekingCollaborations,
      specificNeeds,
      qualificationCriteria,
    });

    setSaving(false);

    if (!result.ok || !result.preferences) {
      setError(result.error || "Gagal menyimpan preferensi kemitraan.");
      return;
    }

    setPreferences(result.preferences);
    onPreferencesUpdated(result.preferences);
    setMessage("Preferensi kemitraan berhasil diperbarui!");
  }

  return (
    <div className="mx-auto max-w-[1160px] space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-soft-green/60 px-3 py-0.5 text-xs font-semibold text-forest">
          <SlidersHorizontal className="size-3.5" />
          <span>Preferensi & Kriteria Privat</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-forest sm:text-3xl">
          Preferensi Kemitraan
        </h1>
        <p className="mt-1 text-sm text-muted">
          Kriteria di bawah ini bersifat privat dan menjadi dasar bagi filter cepat pencarian manual katalog serta sistem rekomendasi cerdas LUMORA.
        </p>
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-3.5 rounded-2xl border border-forest/20 bg-soft-green/40 p-5">
        <Lock className="size-5 shrink-0 text-forest mt-0.5" />
        <div className="text-xs text-forest space-y-1">
          <p className="font-semibold">
            Data preferensi ini bersifat privat dan hanya dapat diakses oleh akun Anda.
          </p>
          <p className="text-muted leading-relaxed">
            UMKM tidak dapat melihat kriteria pencarian ini secara langsung. Sistem menggunakannya untuk menghitung skor kecocokan profil dan mempermudah Anda menyaring ribuan bisnis potensial.
          </p>
        </div>
      </div>

      {/* Feedback Messages */}
      {message ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2.5 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm font-medium text-red-900"
        >
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Sektor & Kategori Target */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-5">
          <div className="border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-forest" />
              <h2 className="font-display text-lg font-semibold text-forest">
                1. Sektor UMKM yang Ditargetkan
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Pilih satu atau lebih kategori UMKM yang ingin Anda kurasi. Jika tidak memilih, sistem akan menganggap Anda terbuka untuk semua sektor.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            {BUSINESS_CATEGORIES.map((cat) => {
              const isSelected = targetCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-forest text-lime shadow-xs"
                      : "border border-line bg-white text-forest hover:bg-soft-green/50"
                  }`}
                >
                  {isSelected ? `✓ ${cat}` : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 2: Wilayah Pencarian Target */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-5">
          <div className="border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-forest" />
              <h2 className="font-display text-lg font-semibold text-forest">
                2. Fokus Wilayah & Geografis
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Tentukan wilayah provinsi, kota, atau kawasan aglomerasi (misal: Jawa Barat, Jabodetabek, Surabaya).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label
                htmlFor="searchRegion"
                className="block text-xs font-semibold text-forest"
              >
                Fokus Wilayah / Kota Pencarian
              </label>
              <input
                id="searchRegion"
                type="text"
                value={searchRegion}
                onChange={(e) => setSearchRegion(e.target.value)}
                placeholder="Contoh: Jawa Barat, Jabodetabek, atau Surabaya"
                className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
              <p className="mt-1.5 text-[11px] text-muted">
                Sistem mendukung pencocokan hierarkis otomatis: memilih &quot;Jawa Barat&quot; akan mencakup Bogor, Bandung, Bekasi, dan kota-kota sekitarnya.
              </p>
            </div>

            <div className="rounded-xl border border-line/80 bg-white p-4">
              <label className="flex items-start gap-3 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={strictRegionMatch}
                  onChange={(e) => setStrictRegionMatch(e.target.checked)}
                  className="mt-1 size-4 rounded border-line text-forest focus:ring-forest accent-forest"
                />
                <div className="text-xs">
                  <span className="font-semibold text-forest">
                    Terapkan batasan wilayah ketat (Hard Filter)
                  </span>
                  <p className="mt-0.5 text-muted">
                    Bila dicentang, rekomendasi cerdas hanya akan menampilkan UMKM yang berlokasi persis di wilayah tersebut. Bila tidak dicentang, wilayah hanya berfungsi sebagai faktor penambah skor relevansi (+25 poin).
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Bentuk Kolaborasi yang Dicari */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-5">
          <div className="border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-forest" />
              <h2 className="font-display text-lg font-semibold text-forest">
                3. Bentuk Kolaborasi yang Dicari dari UMKM
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Pilih model kemitraan yang Anda harapkan dari pelaku UMKM (Vektor 2). Sistem akan mencocokkannya dengan kebutuhan usaha yang dicari UMKM.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MASTER_TAXONOMY_LIST.map((taxID) => {
              const meta = MASTER_TAXONOMY_REGISTRY[taxID];
              const isSelected = seekingCollaborations.includes(taxID);
              return (
                <button
                  key={taxID}
                  type="button"
                  onClick={() => toggleCollaboration(taxID)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-forest bg-forest text-lime shadow-xs"
                      : "border-line bg-white text-forest hover:border-forest/40 hover:bg-soft-green/30"
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {isSelected ? `✓ ${meta.partnerSeekLabel}` : meta.partnerSeekLabel}
                  </span>
                  <span className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? "text-white/80" : "text-muted"}`}>
                    {meta.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Section 4: Kebutuhan Spesifik & Standar Kualifikasi */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
          <div className="border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <FileText className="size-4 text-forest" />
              <h2 className="font-display text-lg font-semibold text-forest">
                4. Kebutuhan Spesifik & Standar Kualifikasi
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Deskripsikan kualifikasi, kuota, atau standar khusus agar UMKM yang terhubung siap bermitra.
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <label
                htmlFor="specificNeeds"
                className="block text-xs font-semibold text-forest"
              >
                Kebutuhan Kemitraan Spesifik (Opsional)
              </label>
              <textarea
                id="specificNeeds"
                rows={3}
                value={specificNeeds}
                onChange={(e) => setSpecificNeeds(e.target.value)}
                placeholder="Contoh: Membutuhkan produsen makanan ringan dengan kapasitas produksi minimal 5.000 pouch per bulan, sistem pembayaran tempo 30 hari..."
                className="mt-1.5 block w-full rounded-xl border border-line bg-white p-3.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
              />
            </div>

            <div>
              <label
                htmlFor="qualificationCriteria"
                className="block text-xs font-semibold text-forest"
              >
                Kriteria Kualifikasi & Standar Bisnis UMKM (Opsional)
              </label>
              <textarea
                id="qualificationCriteria"
                rows={3}
                value={qualificationCriteria}
                onChange={(e) => setQualificationCriteria(e.target.value)}
                placeholder="Contoh: Memiliki legalitas usaha (NIB, P-IRT atau BPOM), sertifikat Halal resmi, kemasan kedap udara dengan barcode, dan rekam jejak penjualan minimal 1 tahun..."
                className="mt-1.5 block w-full rounded-xl border border-line bg-white p-3.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className={buttonStyles({
              variant: "primary",
              size: "lg",
              className: "min-w-44 gap-2 shadow-xs",
            })}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <span>Simpan Preferensi Kemitraan</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
