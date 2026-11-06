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
    <div className="mx-auto max-w-[1160px] space-y-4 sm:space-y-5 pb-8">
      {/* Compact Page Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-soft-green/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
          <SlidersHorizontal className="size-3" />
          <span>Preferensi & Kriteria Privat</span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-forest tracking-tight">
          Preferensi Kemitraan
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Kriteria privat untuk filter cepat katalog dan rekomendasi cerdas Smart Partner Matching.
        </p>
      </div>

      {/* Compact Privacy Notice Banner */}
      <div className="flex items-center gap-2.5 rounded-xl border border-forest/20 bg-soft-green/40 p-3 text-xs text-forest shadow-2xs">
        <Lock className="size-4 shrink-0 text-forest" />
        <p className="text-[11px] sm:text-xs text-forest/90 leading-normal">
          <strong>Data Privat:</strong> Kriteria ini hanya dapat diakses oleh akun Anda untuk kalkulasi skor kecocokan profil UMKM.
        </p>
      </div>

      {/* Feedback Alerts */}
      {message ? (
        <div
          role="status"
          className="flex items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-emerald-900"
        >
          <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
          <span>{message}</span>
        </div>
      ) : null}

      {error ? (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 px-3.5 py-2.5 text-xs sm:text-sm font-medium text-red-900"
        >
          <AlertCircle className="size-4 shrink-0 text-red-600" />
          <span>{error}</span>
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        {/* Card 1: Sektor & Kategori Target */}
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Target className="size-4 text-forest" />
              <h2 className="font-display text-base font-semibold text-forest">
                1. Sektor UMKM yang Ditargetkan
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5">
              Pilih satu atau lebih kategori UMKM target. Bila kosong, sistem terbuka untuk semua sektor.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-0.5">
            {BUSINESS_CATEGORIES.map((cat) => {
              const isSelected = targetCategories.includes(cat);
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => toggleCategory(cat)}
                  className={`rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    isSelected
                      ? "bg-forest text-lime shadow-2xs"
                      : "border border-line bg-white text-forest hover:bg-soft-green/50"
                  }`}
                >
                  {isSelected ? `✓ ${cat}` : cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 2: Wilayah Pencarian Target */}
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="size-4 text-forest" />
              <h2 className="font-display text-base font-semibold text-forest">
                2. Fokus Wilayah & Geografis
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5">
              Tentukan wilayah provinsi, kota, atau kawasan aglomerasi (contoh: Jawa Barat, Jabodetabek, Surabaya).
            </p>
          </div>

          <div className="space-y-3">
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
                className="mt-1 block h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
              <p className="mt-1 text-[11px] text-muted">
                Didukung pencocokan hierarkis: memilih &quot;Jawa Barat&quot; otomatis mencakup Bogor, Bandung, dan sekitarnya.
              </p>
            </div>

            <div className="rounded-lg border border-line/80 bg-white p-3">
              <label className="flex items-start gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={strictRegionMatch}
                  onChange={(e) => setStrictRegionMatch(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-line text-forest focus:ring-forest accent-forest shrink-0"
                />
                <div className="text-xs">
                  <span className="font-semibold text-forest">
                    Terapkan batasan wilayah ketat (Hard Filter)
                  </span>
                  <p className="mt-0.5 text-muted leading-relaxed">
                    Bila dicentang, rekomendasi cerdas hanya menampilkan UMKM di wilayah tersebut. Bila tidak, wilayah menjadi faktor penambah skor relevansi (+25 poin).
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Card 3: Bentuk Kolaborasi yang Dicari */}
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3">
          <div className="border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Layers className="size-4 text-forest" />
              <h2 className="font-display text-base font-semibold text-forest">
                3. Bentuk Kolaborasi yang Dicari dari UMKM
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5">
              Pilih model kemitraan yang Anda harapkan dari pelaku UMKM (Vektor 2 Master Taxonomy).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            {MASTER_TAXONOMY_LIST.map((taxID) => {
              const meta = MASTER_TAXONOMY_REGISTRY[taxID];
              const isSelected = seekingCollaborations.includes(taxID);
              return (
                <button
                  key={taxID}
                  type="button"
                  onClick={() => toggleCollaboration(taxID)}
                  className={`flex flex-col text-left p-2.5 sm:p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-forest bg-forest text-lime shadow-2xs"
                      : "border-line bg-white text-forest hover:border-forest/40 hover:bg-soft-green/30"
                  }`}
                >
                  <span className="text-xs font-semibold leading-snug">
                    {isSelected ? `✓ ${meta.partnerSeekLabel}` : meta.partnerSeekLabel}
                  </span>
                  <span
                    className={`text-[10.5px] mt-1 line-clamp-1 leading-normal ${
                      isSelected ? "text-white/80" : "text-muted"
                    }`}
                  >
                    {meta.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Card 4: Kebutuhan Spesifik & Standar Kualifikasi */}
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-1.5">
              <FileText className="size-4 text-forest" />
              <h2 className="font-display text-base font-semibold text-forest">
                4. Kebutuhan Spesifik & Standar Kualifikasi
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5">
              Deskripsikan kualifikasi, kapasitas, atau standar khusus agar UMKM yang terhubung siap bermitra.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:gap-4 md:grid-cols-2">
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
                placeholder="Contoh: Produsen makanan ringan kapasitas min. 5.000 pouch/bulan, masa simpan >6 bulan..."
                className="mt-1 block w-full rounded-lg border border-line bg-white p-3 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
              />
            </div>

            <div>
              <label
                htmlFor="qualificationCriteria"
                className="block text-xs font-semibold text-forest"
              >
                Kriteria Kualifikasi & Standar Bisnis (Opsional)
              </label>
              <textarea
                id="qualificationCriteria"
                rows={3}
                value={qualificationCriteria}
                onChange={(e) => setQualificationCriteria(e.target.value)}
                placeholder="Contoh: Memiliki NIB, P-IRT/BPOM, sertifikat Halal resmi, kemasan barcode siap retail..."
                className="mt-1 block w-full rounded-lg border border-line bg-white p-3 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end pt-1">
          <button
            type="submit"
            disabled={saving}
            className={buttonStyles({
              variant: "primary",
              size: "default",
              className: "min-w-40 gap-2 shadow-2xs font-semibold",
            })}
          >
            {saving ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
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
