"use client";

import { useState } from "react";
import {
  Building2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Info,
  Mail,
  Phone,
  Globe,
  Sparkles,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { savePartnerProfile } from "@/lib/api";
import { BUSINESS_CATEGORIES, type BusinessCategory } from "@/types/business";
import {
  PARTNER_TYPES,
  type PartnerType,
  type PartnerProfile,
} from "@/types/partner";
import type { User } from "@/types/user";

const COMMON_PARTNERSHIP_TYPES = [
  "B2B Supply",
  "Distribusi Produk",
  "Konsinyasi / Titip Jual",
  "Reseller & Agen",
  "Kemitraan Lisensi",
  "Pendanaan & Modal Usaha",
  "Mentoring Operasional",
  "Kolaborasi Pemasaran",
];

export function PartnerProfileView({
  user,
  initialProfile,
  onProfileUpdated,
}: {
  user: User;
  initialProfile: PartnerProfile;
  onProfileUpdated: (updated: PartnerProfile) => void;
}) {
  const [profile, setProfile] = useState<PartnerProfile>(initialProfile);
  const [companyName, setCompanyName] = useState(() => {
    if (profile.companyName) return profile.companyName;
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("lumora_initial_company_name") || "";
    }
    return "";
  });
  const [partnerType, setPartnerType] = useState<PartnerType | "">(
    profile.partnerType || "",
  );
  const [location, setLocation] = useState(profile.location || "");
  const [operationalCoverage, setOperationalCoverage] = useState(
    profile.operationalCoverage || "",
  );
  const [interestedCategories, setInterestedCategories] = useState<BusinessCategory[]>(
    profile.interestedCategories || [],
  );
  const [partnershipTypes, setPartnershipTypes] = useState<string[]>(
    profile.partnershipTypes || [],
  );
  const [customTypeInput, setCustomTypeInput] = useState("");
  const [description, setDescription] = useState(profile.description || "");
  const [shareContact, setShareContact] = useState(profile.shareContact || false);
  const [contactEmail, setContactEmail] = useState(profile.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(profile.contactPhone || "");
  const [contactSocial, setContactSocial] = useState(profile.contactSocial || "");

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

  function togglePartnershipType(type: string) {
    setPartnershipTypes((current) =>
      current.includes(type)
        ? current.filter((t) => t !== type)
        : [...current, type],
    );
  }

  function addCustomPartnershipType() {
    const trimmed = customTypeInput.trim();
    if (!trimmed || partnershipTypes.includes(trimmed)) return;
    setPartnershipTypes((current) => [...current, trimmed]);
    setCustomTypeInput("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    setError(null);

    const result = await savePartnerProfile({
      ...profile,
      companyName,
      partnerType,
      location,
      operationalCoverage,
      interestedCategories,
      partnershipTypes,
      description,
      shareContact,
      contactEmail,
      contactPhone,
      contactSocial,
    });

    setSaving(false);

    if (!result.ok || !result.profile) {
      setError(result.error || "Gagal menyimpan profil mitra.");
      return;
    }

    setProfile(result.profile);
    onProfileUpdated(result.profile);
    setMessage("Profil mitra berhasil diperbarui!");
  }

  const completeness = profile.completeness || 0;

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-soft-green/60 px-3 py-0.5 text-xs font-semibold text-forest">
          <Building2 className="size-3.5" />
          <span>Profil Organisasi Mitra</span>
        </div>
        <h1 className="mt-2 font-display text-2xl font-semibold text-forest sm:text-3xl">
          Kelola Profil Mitra
        </h1>
        <p className="mt-1 text-sm text-muted">
          Profil ini menjadi representasi identitas organisasi atau institusi Anda di hadapan para
          pemilik UMKM pada platform LUMORA.
        </p>
      </div>

      {/* Completeness Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border border-line bg-surface p-5 shadow-xs">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted">
              Kelengkapan Profil Anda
            </span>
            <span className="font-display text-lg font-bold text-forest">
              {completeness}%
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-soft-green">
            <div
              className="h-full rounded-full bg-forest transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(0, completeness))}%` }}
            />
          </div>
          <p className="text-[11px] text-muted">
            Profil yang lengkap mempermudah validasi saat proses kolaborasi dan membangun kepercayaan
            UMKM.
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
        {/* Section 1: Akun & Identitas Organisasi */}
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-xs">
          <h2 className="font-display text-lg font-semibold text-forest border-b border-line/60 pb-3">
            1. Identitas Akun & Organisasi
          </h2>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-semibold text-forest">
                Nama Pengguna Terdaftar
              </label>
              <input
                type="text"
                disabled
                value={user.name}
                className="mt-1.5 block w-full rounded-xl border border-line bg-soft-green/30 px-3.5 py-2.5 text-sm text-forest/70 cursor-not-allowed"
              />
              <span className="mt-1 block text-[11px] text-muted">
                Dapat diubah melalui menu Pengaturan Akun.
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-forest">
                Email Akun
              </label>
              <input
                type="email"
                disabled
                value={user.email}
                className="mt-1.5 block w-full rounded-xl border border-line bg-soft-green/30 px-3.5 py-2.5 text-sm text-forest/70 cursor-not-allowed"
              />
              <span className="mt-1 block text-[11px] text-muted">
                Email utama akun LUMORA Anda.
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="companyName"
                className="block text-xs font-semibold text-forest"
              >
                Nama Organisasi / Perusahaan
              </label>
              <input
                id="companyName"
                type="text"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: PT Mitra Distribusi Niaga"
                className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label
                htmlFor="partnerType"
                className="block text-xs font-semibold text-forest"
              >
                Jenis Mitra
              </label>
              <select
                id="partnerType"
                value={partnerType}
                onChange={(e) => setPartnerType(e.target.value as PartnerType)}
                className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="">Pilih Jenis Mitra...</option>
                {PARTNER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="location"
                className="block text-xs font-semibold text-forest"
              >
                Lokasi Domisili / Kantor Pusat
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Contoh: Jakarta Selatan, DKI Jakarta"
                className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label
                htmlFor="operationalCoverage"
                className="block text-xs font-semibold text-forest"
              >
                Jangkauan Operasional
              </label>
              <input
                id="operationalCoverage"
                type="text"
                value={operationalCoverage}
                onChange={(e) => setOperationalCoverage(e.target.value)}
                placeholder="Contoh: Jabodetabek, Jawa & Bali, atau Seluruh Indonesia"
                className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-xs font-semibold text-forest"
            >
              Deskripsi Singkat Organisasi & Kemitraan
            </label>
            <textarea
              id="description"
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ceritakan latar belakang organisasi, portofolio bisnis, atau nilai tambah yang Anda tawarkan kepada UMKM binaan/mitra..."
              className="mt-1.5 block w-full rounded-xl border border-line bg-white p-3.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
            />
          </div>
        </div>

        {/* Section 2: Kategori & Kemitraan yang Diminati */}
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-xs">
          <h2 className="font-display text-lg font-semibold text-forest border-b border-line/60 pb-3">
            2. Fokus Kemitraan
          </h2>

          <div>
            <label className="block text-xs font-semibold text-forest mb-2">
              Kategori UMKM yang Diminati
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
              Pilih satu atau lebih kategori UMKM yang sesuai dengan cakupan bisnis Anda.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-forest mb-2">
              Bentuk Kemitraan yang Dicari
            </label>
            <div className="flex flex-wrap gap-2">
              {COMMON_PARTNERSHIP_TYPES.map((pt) => {
                const isSelected = partnershipTypes.includes(pt);
                return (
                  <button
                    key={pt}
                    type="button"
                    onClick={() => togglePartnershipType(pt)}
                    className={`rounded-xl px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isSelected
                        ? "bg-soft-green border border-forest/30 text-forest font-semibold"
                        : "border border-line bg-white text-muted hover:border-forest/30 hover:text-forest"
                    }`}
                  >
                    {isSelected ? `✓ ${pt}` : pt}
                  </button>
                );
              })}
            </div>

            {/* Custom type input */}
            <div className="mt-3 flex items-center gap-2 max-w-md">
              <input
                type="text"
                value={customTypeInput}
                onChange={(e) => setCustomTypeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomPartnershipType();
                  }
                }}
                placeholder="Tambah jenis kemitraan lain..."
                className="flex-1 rounded-xl border border-line bg-white px-3 py-1.5 text-xs text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
              <button
                type="button"
                onClick={addCustomPartnershipType}
                className={buttonStyles({
                  variant: "secondary",
                  size: "sm",
                })}
              >
                Tambah
              </button>
            </div>
          </div>
        </div>

        {/* Section 3: Informasi Kontak & Kebijakan Privasi */}
        <div className="space-y-5 rounded-2xl border border-line bg-surface p-6 shadow-xs">
          <div className="border-b border-line/60 pb-3">
            <h2 className="font-display text-lg font-semibold text-forest">
              3. Informasi Kontak & Kebijakan Privasi
            </h2>
            <p className="mt-1 text-xs text-muted">
              LUMORA menjaga privasi data Anda. Informasi kontak ini tidak akan dipublikasikan secara
              terbuka tanpa persetujuan eksplisit Anda.
            </p>
          </div>

          {/* Privacy Consent Box */}
          <div className="rounded-xl border border-forest/20 bg-soft-green/40 p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shareContact}
                onChange={(e) => setShareContact(e.target.checked)}
                className="mt-0.5 size-4 rounded border-line text-forest focus:ring-forest accent-forest"
              />
              <div>
                <span className="text-xs font-semibold text-forest flex items-center gap-1.5">
                  <ShieldCheck className="size-4 text-forest" />
                  Bagikan informasi kontak resmi kepada UMKM mitra
                </span>
                <p className="mt-1 text-[11px] text-muted leading-relaxed">
                  Dengan mengaktifkan opsi ini, nomor telepon/WhatsApp, email kemitraan, dan media
                  sosial organisasi Anda dapat diakses oleh UMKM yang menerima inisiasi kolaborasi dari Anda.
                </p>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
            <div>
              <label
                htmlFor="contactEmail"
                className="block text-xs font-semibold text-forest flex items-center gap-1.5"
              >
                <Mail className="size-3.5 text-muted" />
                Email Kemitraan Resmi
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="partnership@organisasi.co.id"
                className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label
                htmlFor="contactPhone"
                className="block text-xs font-semibold text-forest flex items-center gap-1.5"
              >
                <Phone className="size-3.5 text-muted" />
                No. Telepon / WhatsApp
              </label>
              <input
                id="contactPhone"
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+62 812 3456 7890"
                className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label
                htmlFor="contactSocial"
                className="block text-xs font-semibold text-forest flex items-center gap-1.5"
              >
                <Globe className="size-3.5 text-muted" />
                Website / Akun LinkedIn
              </label>
              <input
                id="contactSocial"
                type="text"
                value={contactSocial}
                onChange={(e) => setContactSocial(e.target.value)}
                placeholder="https://perusahaan.co.id"
                className="mt-1.5 block w-full rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
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
                <span>Menyimpan Profil...</span>
              </>
            ) : (
              <>
                <Sparkles className="size-4" />
                <span>Simpan Perubahan</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
