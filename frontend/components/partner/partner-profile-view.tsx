"use client";

import { useState } from "react";
import {
  Building2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Mail,
  Phone,
  Globe,
  Handshake,
  Image as ImageIcon,
  ShieldCheck,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { savePartnerProfile } from "@/lib/api";
import {
  PARTNER_TYPES,
  MASTER_TAXONOMY_LIST,
  MASTER_TAXONOMY_REGISTRY,
  type PartnerType,
  type PartnerProfile,
  type MasterTaxonomyID,
} from "@/types/partner";
import type { User } from "@/types/user";

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
  const [logo, setLogo] = useState(profile.logo || "");
  const [location, setLocation] = useState(profile.location || "");
  const [operationalCoverage, setOperationalCoverage] = useState(
    profile.operationalCoverage || "",
  );
  const [offeredCollaborations, setOfferedCollaborations] = useState<MasterTaxonomyID[]>(
    profile.offeredCollaborations || [],
  );
  const [description, setDescription] = useState(profile.description || "");
  const [shareContact, setShareContact] = useState(profile.shareContact || false);
  const [contactEmail, setContactEmail] = useState(profile.contactEmail || "");
  const [contactPhone, setContactPhone] = useState(profile.contactPhone || "");
  const [contactSocial, setContactSocial] = useState(profile.contactSocial || "");

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function toggleOfferedCollaboration(id: MasterTaxonomyID) {
    setOfferedCollaborations((current) =>
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

    const result = await savePartnerProfile({
      companyName,
      partnerType,
      logo,
      location,
      operationalCoverage,
      description,
      offeredCollaborations,
      contactEmail,
      contactPhone,
      contactSocial,
      shareContact,
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
    <div className="mx-auto max-w-[1160px] space-y-4 sm:space-y-5 pb-8">
      {/* Compact Page Header */}
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-soft-green/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest">
          <Building2 className="size-3" />
          <span>Profil Organisasi Mitra</span>
        </div>
        <h1 className="font-display text-xl sm:text-2xl font-semibold text-forest tracking-tight">
          Kelola Profil Mitra
        </h1>
        <p className="text-xs sm:text-sm text-muted">
          Representasi resmi identitas organisasi dan layanan yang Anda tawarkan kepada pelaku UMKM di LUMORA.
        </p>
      </div>

      {/* Compact Completeness Progress Card */}
      <div className="rounded-xl border border-line bg-surface p-3.5 sm:p-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex-1 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-forest">Kelengkapan Profil Organisasi</span>
              <span className="font-bold text-forest">{completeness}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-soft-green">
              <div
                className="h-full rounded-full bg-forest transition-all duration-500"
                style={{ width: `${Math.min(100, Math.max(0, completeness))}%` }}
              />
            </div>
          </div>
          <span className="text-[11px] text-muted shrink-0 sm:pl-4">
            Profil lengkap membangun kredibilitas saat berkolaborasi dengan UMKM.
          </span>
        </div>
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
        {/* Card 1: Identitas & Legalitas Organisasi */}
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="border-b border-line/60 pb-2.5">
            <h2 className="font-display text-base font-semibold text-forest">
              1. Identitas Organisasi
            </h2>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5">
              Informasi dasar identitas institusi, perusahaan, atau organisasi kemitraan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-3.5 md:grid-cols-2">
            <div>
              <label
                htmlFor="companyName"
                className="block text-xs font-semibold text-forest"
              >
                Nama Resmi Organisasi / Perusahaan
              </label>
              <input
                id="companyName"
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Contoh: PT Distribusi Nusantara Berjaya"
                className="mt-1 block h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
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
                className="mt-1 block h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs sm:text-sm text-forest focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              >
                <option value="">Pilih Jenis Mitra...</option>
                {PARTNER_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

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
                className="mt-1 block h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div>
              <label
                htmlFor="operationalCoverage"
                className="block text-xs font-semibold text-forest"
              >
                Jangkauan Wilayah Operasional
              </label>
              <input
                id="operationalCoverage"
                type="text"
                value={operationalCoverage}
                onChange={(e) => setOperationalCoverage(e.target.value)}
                placeholder="Contoh: Jabodetabek, Jawa & Bali, atau Nasional"
                className="mt-1 block h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="logo"
                className="block text-xs font-semibold text-forest"
              >
                URL Logo Organisasi (Opsional)
              </label>
              <div className="mt-1 flex items-center gap-2.5">
                <input
                  id="logo"
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.png atau /uploads/..."
                  className="block h-10 flex-1 rounded-lg border border-line bg-white px-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
                {logo ? (
                  <div className="size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-white p-1">
                    <img
                      src={logo}
                      alt="Logo preview"
                      className="size-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-dashed border-line bg-soft-green/30 text-muted">
                    <ImageIcon className="size-4" />
                  </div>
                )}
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="description"
                className="block text-xs font-semibold text-forest"
              >
                Deskripsi Profil Organisasi & Kapabilitas Kemitraan
              </label>
              <textarea
                id="description"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan latar belakang organisasi, portofolio, dan nilai tambah yang Anda tawarkan kepada pelaku UMKM..."
                className="mt-1 block w-full rounded-lg border border-line bg-white p-3 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Card 2: Layanan & Bentuk Kemitraan yang Ditawarkan */}
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-1.5">
              <Handshake className="size-4 text-forest" />
              <h2 className="font-display text-base font-semibold text-forest">
                2. Layanan & Bentuk Kemitraan yang Ditawarkan
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5">
              Pilih kapabilitas atau fasilitas yang organisasi Anda sediakan untuk UMKM (Vektor 1).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-2.5">
            {MASTER_TAXONOMY_LIST.map((taxID) => {
              const meta = MASTER_TAXONOMY_REGISTRY[taxID];
              const isSelected = offeredCollaborations.includes(taxID);
              return (
                <button
                  key={taxID}
                  type="button"
                  onClick={() => toggleOfferedCollaboration(taxID)}
                  className={`flex flex-col text-left p-2.5 sm:p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-forest bg-forest text-lime shadow-2xs"
                      : "border-line bg-white text-forest hover:border-forest/40 hover:bg-soft-green/30"
                  }`}
                >
                  <span className="text-xs font-semibold leading-snug">
                    {isSelected ? `✓ ${meta.partnerOfferLabel}` : meta.partnerOfferLabel}
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

        {/* Card 3: Kontak Resmi & Kebijakan Privasi */}
        <div className="rounded-xl border border-line bg-surface p-4 sm:p-5 shadow-2xs space-y-3.5">
          <div className="border-b border-line/60 pb-2.5">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="size-4 text-forest" />
              <h2 className="font-display text-base font-semibold text-forest">
                3. Kontak Resmi & Pengaturan Privasi
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-muted mt-0.5">
              Tentukan saluran komunikasi resmi dan atur izin pembagian kontak ke pelaku UMKM.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:gap-3.5 md:grid-cols-2">
            <div>
              <label
                htmlFor="contactEmail"
                className="block text-xs font-semibold text-forest"
              >
                Email Resmi Kemitraan
              </label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="partnership@perusahaan.co.id"
                  className="block h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="contactPhone"
                className="block text-xs font-semibold text-forest"
              >
                Nomor Telepon / WhatsApp Bisnis
              </label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  className="block h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label
                htmlFor="contactSocial"
                className="block text-xs font-semibold text-forest"
              >
                Tautan Profil LinkedIn, Situs Web, atau Media Sosial
              </label>
              <div className="relative mt-1">
                <Globe className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="contactSocial"
                  type="text"
                  value={contactSocial}
                  onChange={(e) => setContactSocial(e.target.value)}
                  placeholder="https://linkedin.com/company/... atau https://perusahaan.co.id"
                  className="block h-10 w-full rounded-lg border border-line bg-white pl-9 pr-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>
          </div>

          {/* Privacy Consent Box */}
          <div className="rounded-lg border border-forest/15 bg-soft-green/30 p-3 sm:p-3.5">
            <label className="flex items-start gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shareContact}
                onChange={(e) => setShareContact(e.target.checked)}
                className="mt-0.5 size-4 rounded border-line text-forest focus:ring-forest accent-forest shrink-0"
              />
              <div className="text-xs">
                <span className="font-semibold text-forest">
                  Izinkan pemilik UMKM terdaftar melihat email dan nomor kontak resmi ini
                </span>
                <p className="mt-0.5 text-muted leading-relaxed">
                  Bila tidak dicentang, email dan telepon Anda dirahasiakan dari UMKM. Tautan website publik tetap dapat dilihat.
                </p>
              </div>
            </label>
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
              <span>Simpan Profil Mitra</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
