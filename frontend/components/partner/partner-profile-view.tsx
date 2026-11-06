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
    <div className="mx-auto max-w-[1160px] space-y-8 pb-12">
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
          Profil ini menjadi representasi resmi organisasi dan layanan yang Anda tawarkan kepada pelaku UMKM di platform LUMORA.
        </p>
      </div>

      {/* Completeness Card */}
      <div className="rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted">
                Kelengkapan Profil Organisasi
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
              Profil yang lengkap mempermudah verifikasi dan meningkatkan kredibilitas organisasi Anda di hadapan pelaku UMKM.
            </p>
          </div>
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
        {/* Section 1: Identitas & Legalitas Organisasi */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
          <div className="border-b border-line/60 pb-3">
            <h2 className="font-display text-lg font-semibold text-forest">
              1. Identitas Organisasi
            </h2>
            <p className="text-xs text-muted mt-0.5">
              Informasi dasar identitas institusi, perusahaan, atau organisasi kemitraan.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
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
                Jangkauan Wilayah Operasional
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

            <div className="md:col-span-2">
              <label
                htmlFor="logo"
                className="block text-xs font-semibold text-forest"
              >
                URL Logo Organisasi (Opsional)
              </label>
              <div className="mt-1.5 flex items-center gap-3">
                <input
                  id="logo"
                  type="text"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  placeholder="https://example.com/logo.png atau /uploads/..."
                  className="block flex-1 rounded-xl border border-line bg-white px-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
                {logo ? (
                  <div className="size-10 overflow-hidden rounded-lg border border-line bg-white p-1">
                    <img
                      src={logo}
                      alt="Logo preview"
                      className="size-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="flex size-10 items-center justify-center rounded-lg border border-dashed border-line bg-soft-green/30 text-muted">
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
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan latar belakang organisasi, pengalaman industri, portofolio, dan nilai tambah yang Anda tawarkan kepada pelaku UMKM..."
                className="mt-1.5 block w-full rounded-xl border border-line bg-white p-3.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Bentuk Kemitraan yang DITAWARKAN ke UMKM */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
          <div className="border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <Handshake className="size-4 text-forest" />
              <h2 className="font-display text-lg font-semibold text-forest">
                2. Layanan & Bentuk Kemitraan yang Ditawarkan
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Pilih bentuk kerjasama, kapabilitas, atau fasilitas yang organisasi Anda sediakan untuk pelaku UMKM (Vektor 1).
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {MASTER_TAXONOMY_LIST.map((taxID) => {
              const meta = MASTER_TAXONOMY_REGISTRY[taxID];
              const isSelected = offeredCollaborations.includes(taxID);
              return (
                <button
                  key={taxID}
                  type="button"
                  onClick={() => toggleOfferedCollaboration(taxID)}
                  className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                    isSelected
                      ? "border-forest bg-forest text-lime shadow-xs"
                      : "border-line bg-white text-forest hover:border-forest/40 hover:bg-soft-green/30"
                  }`}
                >
                  <span className="text-xs font-semibold">
                    {isSelected ? `✓ ${meta.partnerOfferLabel}` : meta.partnerOfferLabel}
                  </span>
                  <span className={`text-[11px] mt-1 line-clamp-2 ${isSelected ? "text-white/80" : "text-muted"}`}>
                    {meta.description}
                  </span>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted">
            Layanan yang Anda pilih akan tampil pada profil publik organisasi dan memudahkan UMKM menemukan Anda.
          </p>
        </div>

        {/* Section 3: Kontak Resmi & Kebijakan Privasi */}
        <div className="rounded-2xl border border-line bg-surface p-6 shadow-xs space-y-6">
          <div className="border-b border-line/60 pb-3">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-forest" />
              <h2 className="font-display text-lg font-semibold text-forest">
                3. Kontak Resmi & Pengaturan Privasi
              </h2>
            </div>
            <p className="text-xs text-muted mt-0.5">
              Tentukan saluran komunikasi resmi dan atur izin pembagian kontak ke pelaku UMKM.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label
                htmlFor="contactEmail"
                className="block text-xs font-semibold text-forest"
              >
                Email Resmi Kemitraan
              </label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="contactEmail"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="partnership@perusahaan.co.id"
                  className="block w-full rounded-xl border border-line bg-white pl-10 pr-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
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
              <div className="relative mt-1.5">
                <Phone className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="contactPhone"
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+62 812 3456 7890"
                  className="block w-full rounded-xl border border-line bg-white pl-10 pr-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
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
              <div className="relative mt-1.5">
                <Globe className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  id="contactSocial"
                  type="text"
                  value={contactSocial}
                  onChange={(e) => setContactSocial(e.target.value)}
                  placeholder="https://linkedin.com/company/... atau https://perusahaan.co.id"
                  className="block w-full rounded-xl border border-line bg-white pl-10 pr-3.5 py-2.5 text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
                />
              </div>
            </div>
          </div>

          {/* Privacy Consent Box */}
          <div className="rounded-xl border border-forest/20 bg-soft-green/30 p-4">
            <label className="flex items-start gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={shareContact}
                onChange={(e) => setShareContact(e.target.checked)}
                className="mt-1 size-4 rounded border-line text-forest focus:ring-forest accent-forest"
              />
              <div className="text-xs">
                <span className="font-semibold text-forest">
                  Izinkan pemilik UMKM terdaftar melihat email dan nomor kontak resmi ini
                </span>
                <p className="mt-0.5 text-muted">
                  Bila opsi ini tidak dicentang, email dan nomor telepon Anda akan dirahasiakan dan tidak ditampilkan ke UMKM. Tautan website publik tetap dapat dilihat.
                </p>
              </div>
            </label>
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
              <span>Simpan Profil Mitra</span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
