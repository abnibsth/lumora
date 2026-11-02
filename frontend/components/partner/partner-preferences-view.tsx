"use client";

import { useState } from "react";
import {
  SlidersHorizontal,
  MapPin,
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Layers,
  FileText,
  Lightbulb,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { savePartnerProfile } from "@/lib/api";
import { BUSINESS_CATEGORIES, type BusinessCategory } from "@/types/business";
import {
  COLLABORATION_TYPES,
  type CollaborationType,
  type PartnerProfile,
} from "@/types/partner";

export function PartnerPreferencesView({
  initialProfile,
  onProfileUpdated,
}: {
  initialProfile: PartnerProfile;
  onProfileUpdated: (updated: PartnerProfile) => void;
}) {
  const [interestedCategories, setInterestedCategories] = useState<BusinessCategory[]>(
    initialProfile.interestedCategories || [],
  );
  const [searchRegion, setSearchRegion] = useState(initialProfile.searchRegion || "");
  const [collaborationTypes, setCollaborationTypes] = useState<string[]>(
    initialProfile.collaborationTypes || [],
  );
  const [partnershipNeeds, setPartnershipNeeds] = useState(
    initialProfile.partnershipNeeds || "",
  );
  const [businessCriteria, setBusinessCriteria] = useState(
    initialProfile.businessCriteria || "",
  );

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleCategory(category: BusinessCategory) {
    setInterestedCategories((current) =>
      current.includes(category)
        ? current.filter((c) => c !== category)
        : [...current, category],
    );
  }

  function toggleCollaborationType(type: CollaborationType) {
    setCollaborationTypes((current) =>
      current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const result = await savePartnerProfile({
      ...initialProfile,
      interestedCategories,
      searchRegion,
      collaborationTypes,
      partnershipNeeds,
      businessCriteria,
    });

    setSaving(false);

    if (!result.ok || !result.profile) {
      setError(result.error || "Gagal menyimpan preferensi kemitraan.");
      return;
    }

    onProfileUpdated(result.profile);
    setMessage("Preferensi kemitraan berhasil diperbarui!");
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-soft-green/60 px-3 py-0.5 text-xs font-semibold text-forest">
          <SlidersHorizontal className="size-3.5" />
          <span>Preferensi & Kriteria Mitra</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-forest sm:text-3xl">
          Preferensi Kemitraan
        </h1>
        <p className="mt-1 text-sm text-muted">
          Tentukan parameter dan kriteria UMKM yang Anda prioritaskan untuk memudahkan pencarian
          dan relevansi potensi kemitraan.
        </p>
      </div>

      {/* Info Callout */}
      <div className="flex items-start gap-3 rounded-2xl border border-forest/20 bg-soft-green/50 p-4 sm:p-5">
        <Lightbulb className="size-5 shrink-0 text-forest mt-0.5" />
        <div className="text-xs text-muted leading-relaxed space-y-1">
          <p className="font-semibold text-forest">
            Fondasi Smart Partner Matching
          </p>
          <p>
            Informasi preferensi yang Anda isi di sini digunakan untuk memfilter dan mempersonalisasi
            rekomendasi UMKM di dashboard Anda. Data ini sekaligus menjadi fondasi teknis bagi
            pengembangan sistem pencocokan otomatis (Smart Partner Matching) LUMORA di masa mendatang.
          </p>
        </div>
      </div>

      {/* Messages */}
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
        {/* Kategori & Wilayah */}
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-xs">
          <h2 className="font-display text-lg font-semibold text-forest border-b border-line/60 pb-3 flex items-center gap-2">
            <Target className="size-5 text-forest" />
            <span>1. Sektor & Wilayah Fokus</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-forest mb-2">
              Kategori Sektor UMKM
            </label>
            <div className="flex flex-wrap gap-2">
              {BUSINESS_CATEGORIES.map((cat) => {
                const isSelected = interestedCategories.includes(cat);
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
            <p className="mt-2 text-[11px] text-muted">
              Pilih sektor-sektor bisnis yang relevan dengan pipeline pengadaan atau investasi Anda.
            </p>
          </div>

          <div>
            <label
              htmlFor="searchRegion"
              className="block text-xs font-semibold text-forest flex items-center gap-1.5"
            >
              <MapPin className="size-3.5 text-muted" />
              Wilayah Pencarian & Jangkauan Logistik
            </label>
            <input
              id="searchRegion"
              type="text"
              value={searchRegion}
              onChange={(e) => setSearchRegion(e.target.value)}
              placeholder="Contoh: Jawa Barat, DKI Jakarta, DI Yogyakarta, atau Seluruh Pulau Jawa"
              className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
            />
            <p className="mt-1 text-[11px] text-muted">
              Tentukan wilayah geografis tempat Anda aktif menjaring atau mendistribusikan produk UMKM.
            </p>
          </div>
        </div>

        {/* Model Kolaborasi */}
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-xs">
          <h2 className="font-display text-lg font-semibold text-forest border-b border-line/60 pb-3 flex items-center gap-2">
            <Layers className="size-5 text-forest" />
            <span>2. Bentuk & Skema Kerjasama</span>
          </h2>

          <div>
            <label className="block text-xs font-semibold text-forest mb-2">
              Jenis Kolaborasi yang Terbuka
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {COLLABORATION_TYPES.map((type) => {
                const isSelected = collaborationTypes.includes(type);
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleCollaborationType(type)}
                    className={`flex items-center justify-between rounded-xl p-3 text-left text-xs transition-all ${
                      isSelected
                        ? "border-2 border-forest bg-soft-green/80 font-semibold text-forest"
                        : "border border-line bg-white text-muted hover:border-forest/40 hover:text-forest"
                    }`}
                  >
                    <span>{type}</span>
                    <span
                      className={`size-4 rounded-full border flex items-center justify-center text-[10px] ${
                        isSelected
                          ? "border-forest bg-forest text-lime"
                          : "border-line bg-transparent"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Pilih skema kerjasama yang didukung oleh sumber daya organisasi Anda.
            </p>
          </div>
        </div>

        {/* Spesifikasi Kebutuhan & Kriteria Bisnis */}
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-xs">
          <h2 className="font-display text-lg font-semibold text-forest border-b border-line/60 pb-3 flex items-center gap-2">
            <FileText className="size-5 text-forest" />
            <span>3. Detail Kebutuhan & Standar Kualifikasi</span>
          </h2>

          <div>
            <label
              htmlFor="partnershipNeeds"
              className="block text-xs font-semibold text-forest"
            >
              Kebutuhan Kemitraan Spesifik
            </label>
            <textarea
              id="partnershipNeeds"
              rows={4}
              value={partnershipNeeds}
              onChange={(e) => setPartnershipNeeds(e.target.value)}
              placeholder="Contoh: Kami membutuhkan pasokan kopi roasted bean 200 kg/bulan dengan profil medium roast dan kemasan aluminium foil..."
              className="mt-1.5 block w-full rounded-xl border border-line bg-white p-3.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-muted">
              Jelaskan estimasi volume, spesifikasi teknis barang/jasa, atau target waktu yang diharapkan.
            </p>
          </div>

          <div>
            <label
              htmlFor="businessCriteria"
              className="block text-xs font-semibold text-forest"
            >
              Kriteria & Persyaratan UMKM yang Dicari
            </label>
            <textarea
              id="businessCriteria"
              rows={4}
              value={businessCriteria}
              onChange={(e) => setBusinessCriteria(e.target.value)}
              placeholder="Contoh: Telah beroperasi minimal 1 tahun, memiliki legalitas dasar (NIB/PIRT/Halal), mampu memenuhi kontrak pembayaran tempo 14 hari..."
              className="mt-1.5 block w-full rounded-xl border border-line bg-white p-3.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
            />
            <p className="mt-1 text-[11px] text-muted">
              Tuliskan standar minimum yang harus dipenuhi oleh calon UMKM mitra Anda.
            </p>
          </div>
        </div>

        {/* Save CTA */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className={buttonStyles({
              variant: "primary",
              size: "lg",
              className: "min-w-44 gap-2",
            })}
          >
            {saving ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                <span>Menyimpan Preferensi...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Simpan Preferensi</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
