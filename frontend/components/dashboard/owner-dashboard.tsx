"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { EmailVerificationNotice } from "@/components/auth/email-verification-notice";
import { AccountSettings } from "@/components/dashboard/account-settings";
import { SavedBusinesses } from "@/components/dashboard/saved-businesses";
import { Logo } from "@/components/layout/logo";
import { buttonStyles } from "@/components/ui/button";
import {
  archiveBusinessApi,
  createBusinessApi,
  draftProfileApi,
  logoutApi,
  publishBusinessApi,
  uploadMediaApi,
  updateBusinessApi,
} from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import {
  BUSINESS_CATEGORIES,
  type AIDraftProfile,
  type BmcEntry,
  type BusinessCategory,
  type Business,
  type BusinessMilestone,
  type BusinessWriteInput,
  type OwnedBusiness,
} from "@/types/business";
import type { User } from "@/types/user";

type FormValues = {
  name: string;
  category: BusinessCategory;
  location: string;
  description: string;
  story: string;
  foundedYear: string;
  ownerName: string;
  ownerRole: string;
  ownerBio: string;
  coverImage: string;
  logo: string;
  seeking: string;
  seekingObjective: string;
};

const emptyForm: FormValues = {
  name: "",
  category: "F&B",
  location: "",
  description: "",
  story: "",
  foundedYear: "",
  ownerName: "",
  ownerRole: "",
  ownerBio: "",
  coverImage: "",
  logo: "",
  seeking: "",
  seekingObjective: "",
};

function valuesFromBusiness(business: OwnedBusiness): FormValues {
  return {
    name: business.name,
    category: business.category,
    location: business.location,
    description: business.description,
    story: business.story,
    foundedYear: String(business.foundedYear),
    ownerName: business.owner.name,
    ownerRole: business.owner.role,
    ownerBio: business.owner.bio,
    coverImage: business.coverImage || "",
    logo: business.logo || "",
    seeking: business.seeking?.join(", ") || "",
    seekingObjective: business.seekingObjective || "",
  };
}

export function OwnerDashboard({
  user,
  initialBusinesses,
  initialBookmarks,
  initialError,
}: {
  user: User;
  initialBusinesses: OwnedBusiness[];
  initialBookmarks: Business[];
  initialError?: string;
}) {
  const router = useRouter();
  const [accountUser, setAccountUser] = useState(user);
  const [businesses, setBusinesses] = useState(initialBusinesses);
  const [editing, setEditing] = useState<OwnedBusiness | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [values, setValues] = useState<FormValues>(emptyForm);
  const [milestones, setMilestones] = useState<BusinessMilestone[]>([]);
  const [bmc, setBmc] = useState<BmcEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [confirmArchiveId, setConfirmArchiveId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(initialError || null);
  const [messageTone, setMessageTone] = useState<"error" | "success">("error");

  function openCreate() {
    setEditing(null);
    setValues({ ...emptyForm, ownerName: accountUser.name });
    setMilestones([]);
    setBmc([]);
    setMessage(null);
    setShowForm(true);
  }

  function openEdit(business: OwnedBusiness) {
    setEditing(business);
    setValues(valuesFromBusiness(business));
    setMilestones(business.milestones);
    setBmc(business.bmc);
    setMessage(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditing(null);
    setValues(emptyForm);
    setMilestones([]);
    setBmc([]);
  }

  function setField<K extends keyof FormValues>(field: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [field]: value }));
  }

  function applyAIDraft(draft: AIDraftProfile) {
    setValues((current) => ({
      ...current,
      name: draft.name || current.name,
      category: draft.category || current.category,
      location: draft.location || current.location,
      description: draft.description || current.description,
      story: draft.story || current.story,
      foundedYear: draft.foundedYear ? String(draft.foundedYear) : current.foundedYear,
      ownerName: draft.owner.name || current.ownerName,
      ownerRole: draft.owner.role || current.ownerRole,
      ownerBio: draft.owner.bio || current.ownerBio,
      seeking: draft.seeking.length ? draft.seeking.join(", ") : current.seeking,
      seekingObjective: draft.seekingObjective || current.seekingObjective,
    }));
    if (draft.milestones.length) setMilestones(draft.milestones);
    if (draft.bmc.length) setBmc(draft.bmc);
  }

  async function handleSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage(null);

    const input: BusinessWriteInput = {
      name: values.name,
      category: values.category,
      location: values.location,
      description: values.description,
      story: values.story,
      foundedYear: Number(values.foundedYear),
      coverImage: values.coverImage,
      logo: values.logo,
      seeking: values.seeking.split(",").map((item) => item.trim()).filter(Boolean),
      seekingObjective: values.seekingObjective,
      owner: {
        name: values.ownerName,
        role: values.ownerRole,
        bio: values.ownerBio,
      },
      milestones,
      bmc,
    };

    const result = editing
      ? await updateBusinessApi(editing.id, input)
      : await createBusinessApi(input);
    setSaving(false);

    if (!result.ok || !result.business) {
      if (result.code === "unauthenticated") {
        router.push(`${ROUTES.login}?next=${ROUTES.dashboard}`);
        return;
      }
      setMessageTone("error");
      setMessage(result.error || "Profil bisnis gagal disimpan.");
      return;
    }

    setBusinesses((current) =>
      editing
        ? current.map((business) => business.id === result.business?.id ? result.business : business)
        : [result.business!, ...current],
    );
    setMessageTone("success");
    setMessage(editing ? "Perubahan profil disimpan." : "Draft profil dibuat.");
    closeForm();
  }

  async function handlePublish(business: OwnedBusiness) {
    setActionId(business.id);
    setMessage(null);
    const result = await publishBusinessApi(business.id);
    setActionId(null);

    if (!result.ok || !result.business) {
      if (result.code === "unauthenticated") {
        router.push(`${ROUTES.login}?next=${ROUTES.dashboard}`);
        return;
      }
      setMessageTone("error");
      setMessage(
        result.code === "email_not_verified"
          ? "Verifikasi email sebelum menerbitkan profil. Gunakan tombol kirim ulang di pemberitahuan atas."
          : result.error || "Profil bisnis gagal diterbitkan.",
      );
      return;
    }

    setBusinesses((current) =>
      current.map((item) => item.id === result.business?.id ? result.business : item),
    );
    setMessageTone("success");
    setMessage(`${business.name} sudah diterbitkan.`);
  }

  async function handleArchive(business: OwnedBusiness) {
    setActionId(business.id);
    setMessage(null);
    const result = await archiveBusinessApi(business.id);
    setActionId(null);
    setConfirmArchiveId(null);

    if (!result.ok) {
      if (result.code === "unauthenticated") {
        router.push(`${ROUTES.login}?next=${ROUTES.dashboard}`);
        return;
      }
      setMessageTone("error");
      setMessage(result.error || "Profil bisnis gagal diarsipkan.");
      return;
    }

    setBusinesses((current) => current.filter((item) => item.id !== business.id));
    setMessageTone("success");
    setMessage(`${business.name} diarsipkan dan tidak lagi tampil di daftar.`);
  }

  async function handleLogout() {
    if (await logoutApi()) {
      router.push(ROUTES.home);
      router.refresh();
    }
  }

  return (
    <div className="min-h-screen bg-background text-ink">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-6 lg:px-8">
          <Logo />
          <div className="flex items-center gap-3">
            <span className="hidden max-w-56 truncate text-sm text-muted sm:block">{accountUser.name}</span>
            <button type="button" onClick={handleLogout} className={buttonStyles({ variant: "secondary" })}>
              Keluar
            </button>
          </div>
        </div>
      </header>

      {!accountUser.emailVerified ? <EmailVerificationNotice user={accountUser} /> : null}

      <main className="mx-auto w-full max-w-7xl px-5 py-10 sm:px-6 md:py-14 lg:px-8">
        <div className="flex flex-col gap-6 border-b border-forest pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-accent">Dashboard pemilik</p>
            <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight text-ink md:text-5xl">
              Profil bisnismu
            </h1>
            <p className="mt-3 max-w-2xl leading-7 text-muted">
              Simpan draft, perbarui informasi usaha, lalu terbitkan saat profil sudah siap dilihat calon mitra.
            </p>
          </div>
          <button type="button" onClick={openCreate} className={buttonStyles({ variant: "primary", size: "lg" })}>
            Buat profil
          </button>
        </div>

        {message ? (
          <div
            role={messageTone === "error" ? "alert" : "status"}
            className={cn(
              "mt-6 border px-4 py-3 text-sm",
              messageTone === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-forest/15 bg-soft-green text-forest",
            )}
          >
            {message}
          </div>
        ) : null}

        {showForm ? (
          <BusinessForm
            values={values}
            editing={editing}
            saving={saving}
            emailVerified={accountUser.emailVerified}
            generatedMilestones={milestones.length}
            generatedBmc={bmc.length}
            onFieldChange={setField}
            onApplyAIDraft={applyAIDraft}
            onSessionExpired={() => router.push(`${ROUTES.login}?next=${ROUTES.dashboard}`)}
            onSubmit={handleSave}
            onCancel={closeForm}
          />
        ) : null}

        <section className="py-10" aria-labelledby="business-list-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2 id="business-list-heading" className="text-2xl font-semibold text-ink">Daftar profil</h2>
            <p className="text-sm text-muted">{businesses.length} profil</p>
          </div>

          {businesses.length === 0 ? (
            <div className="mt-6 border-y border-line py-12">
              <h3 className="text-xl font-semibold text-ink">Belum ada profil bisnis.</h3>
              <p className="mt-2 max-w-xl leading-7 text-muted">
                Buat draft pertama untuk mulai menyusun informasi usaha. Draft tidak tampil ke publik sebelum diterbitkan.
              </p>
              <button type="button" onClick={openCreate} className={buttonStyles({ variant: "primary", className: "mt-6" })}>
                Buat draft pertama
              </button>
            </div>
          ) : (
            <div className="mt-6 divide-y divide-line border-y border-line">
              {businesses.map((business) => {
                const busy = actionId === business.id;
                const confirming = confirmArchiveId === business.id;
                return (
                  <article key={business.id} className="grid gap-5 py-7 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-ink">{business.name}</h3>
                        <span className={cn(
                          "rounded-full px-3 py-1 text-xs font-semibold",
                          business.status === "published" ? "bg-soft-green text-forest" : "bg-ivory text-muted",
                        )}>
                          {business.status === "published" ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-muted">
                        {business.category} · {business.location} · Berdiri {business.foundedYear}
                      </p>
                      <p className="mt-3 max-w-3xl leading-7 text-muted">{business.description}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 lg:justify-end">
                      {business.status === "published" ? (
                        <Link href={ROUTES.business(business.slug)} className={buttonStyles({ variant: "ghost" })}>
                          Lihat profil
                        </Link>
                      ) : null}
                      <button type="button" onClick={() => openEdit(business)} className={buttonStyles({ variant: "secondary" })}>
                        Edit
                      </button>
                      {business.status === "draft" ? (
                        <button
                          type="button"
                          onClick={() => handlePublish(business)}
                          disabled={busy}
                          className={buttonStyles({ variant: "primary" })}
                        >
                          {busy ? "Menerbitkan..." : "Terbitkan"}
                        </button>
                      ) : null}
                      {confirming ? (
                        <>
                          <button
                            type="button"
                            onClick={() => handleArchive(business)}
                            disabled={busy}
                            className="min-h-11 border border-red-300 px-4 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                          >
                            {busy ? "Mengarsipkan..." : "Ya, arsipkan"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmArchiveId(null)}
                            className={buttonStyles({ variant: "ghost" })}
                          >
                            Batal
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setConfirmArchiveId(business.id)}
                          className="min-h-11 px-3 text-sm font-medium text-red-700 underline decoration-red-300 underline-offset-4 hover:decoration-red-700"
                        >
                          Arsipkan
                        </button>
                      )}
                    </div>
                    {confirming ? (
                      <p className="text-sm text-red-700 lg:col-span-2">
                        Profil akan hilang dari publik dan dashboard. Saat ini belum ada fitur pemulihan arsip.
                      </p>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <SavedBusinesses initialBusinesses={initialBookmarks} />
        <AccountSettings user={accountUser} onUserChange={setAccountUser} />
      </main>
    </div>
  );
}

function BusinessForm({
  values,
  editing,
  saving,
  emailVerified,
  generatedMilestones,
  generatedBmc,
  onFieldChange,
  onApplyAIDraft,
  onSessionExpired,
  onSubmit,
  onCancel,
}: {
  values: FormValues;
  editing: OwnedBusiness | null;
  saving: boolean;
  emailVerified: boolean;
  generatedMilestones: number;
  generatedBmc: number;
  onFieldChange: <K extends keyof FormValues>(field: K, value: FormValues[K]) => void;
  onApplyAIDraft: (draft: AIDraftProfile) => void;
  onSessionExpired: () => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
}) {
  const fieldClass = "mt-2 min-h-12 w-full border border-line-strong bg-surface px-4 text-base text-ink focus:border-forest";
  const textAreaClass = `${fieldClass} min-h-32 py-3 leading-7`;
  const [narrative, setNarrative] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [aiMessage, setAIMessage] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"coverImage" | "logo" | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string | null>(null);

  async function handleDraft() {
    setDrafting(true);
    setAIMessage(null);
    setSuggestions([]);
    const result = await draftProfileApi(narrative);
    setDrafting(false);

    if (!result.ok || !result.draft) {
      if (result.code === "unauthenticated") {
        onSessionExpired();
        return;
      }
      setAIMessage(
        result.code === "email_not_verified"
          ? "Verifikasi email sebelum menggunakan draf AI."
          : result.code === "rate_limited"
            ? "Batas penggunaan AI tercapai. Tunggu sebelum mencoba lagi."
            : result.code === "ai_unavailable"
              ? "Layanan AI sedang tidak tersedia. Coba lagi nanti."
              : result.error || "Draf AI gagal dibuat.",
      );
      return;
    }

    onApplyAIDraft(result.draft);
    setSuggestions(result.draft.suggestions);
    setAIMessage("Draf AI dimasukkan ke form. Periksa setiap field sebelum menyimpan.");
  }

  async function handleUpload(field: "coverImage" | "logo", file?: File) {
    if (!file) return;
    setUploading(field);
    setUploadMessage("Mengunggah gambar...");
    const result = await uploadMediaApi(file);
    setUploading(null);

    if (!result.ok || !result.url) {
      if (result.code === "unauthenticated") {
        onSessionExpired();
        return;
      }
      setUploadMessage(result.error || "Gambar gagal diunggah.");
      return;
    }

    onFieldChange(field, result.url);
    setUploadMessage(field === "coverImage" ? "Gambar cover siap disimpan." : "Logo siap disimpan.");
  }

  return (
    <section className="mt-8 border border-line bg-surface p-5 sm:p-8" aria-labelledby="business-form-heading">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-accent">{editing ? "Edit profil" : "Draft baru"}</p>
          <h2 id="business-form-heading" className="mt-1 text-2xl font-semibold text-ink">
            {editing ? editing.name : "Informasi inti bisnis"}
          </h2>
        </div>
        <button type="button" onClick={onCancel} className={buttonStyles({ variant: "ghost" })}>Tutup</button>
      </div>

      <form onSubmit={onSubmit} className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="border-b border-line pb-8 md:col-span-2">
          <h3 className="text-lg font-semibold text-ink">Susun dengan AI</h3>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted">
            Tulis fakta tentang usaha dalam 20–5000 karakter. AI mengisi form dan tidak menyimpan apa pun sebelum kamu menekan tombol simpan.
          </p>
          <textarea
            value={narrative}
            onChange={(event) => setNarrative(event.target.value)}
            minLength={20}
            maxLength={5000}
            disabled={!emailVerified || drafting}
            placeholder="Contoh: Usaha kopi kami berdiri di Bandung pada 2018, dikelola oleh..."
            className={textAreaClass}
          />
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleDraft}
              disabled={!emailVerified || drafting || narrative.trim().length < 20}
              className={buttonStyles({ variant: "secondary" })}
            >
              {drafting ? "Menyusun draf..." : "Isi form dengan AI"}
            </button>
            {!emailVerified ? <span className="text-sm text-red-700">Verifikasi email untuk memakai fitur ini.</span> : null}
          </div>
          {aiMessage ? <p className="mt-3 text-sm text-muted" role="status">{aiMessage}</p> : null}
          {suggestions.length ? (
            <div className="mt-5 border-l-2 border-accent pl-4">
              <p className="text-sm font-semibold text-ink">Informasi yang masih perlu kamu lengkapi</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-muted">
                {suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}
              </ul>
            </div>
          ) : null}
          {generatedMilestones || generatedBmc ? (
            <p className="mt-3 text-xs text-muted">
              Data AI yang ikut disimpan: {generatedMilestones} milestone dan {generatedBmc} blok model bisnis.
            </p>
          ) : null}
        </div>

        <FormField label="Nama bisnis" htmlFor="business-name">
          <input id="business-name" required maxLength={100} value={values.name} onChange={(event) => onFieldChange("name", event.target.value)} className={fieldClass} />
        </FormField>
        <FormField label="Kategori" htmlFor="business-category">
          <select id="business-category" value={values.category} onChange={(event) => onFieldChange("category", event.target.value as BusinessCategory)} className={fieldClass}>
            {BUSINESS_CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
          </select>
        </FormField>
        <FormField label="Lokasi" htmlFor="business-location">
          <input id="business-location" required maxLength={200} value={values.location} onChange={(event) => onFieldChange("location", event.target.value)} className={fieldClass} />
        </FormField>
        <FormField label="Tahun berdiri" htmlFor="business-year">
          <input id="business-year" type="number" required min={1900} max={2100} value={values.foundedYear} onChange={(event) => onFieldChange("foundedYear", event.target.value)} className={fieldClass} />
        </FormField>
        <FormField label="Deskripsi singkat" htmlFor="business-description" className="md:col-span-2">
          <textarea id="business-description" required maxLength={5000} value={values.description} onChange={(event) => onFieldChange("description", event.target.value)} className={textAreaClass} />
        </FormField>
        <FormField label="Cerita bisnis" htmlFor="business-story" className="md:col-span-2">
          <textarea id="business-story" required maxLength={5000} value={values.story} onChange={(event) => onFieldChange("story", event.target.value)} className={textAreaClass} />
        </FormField>

        <div className="border-t border-line pt-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-ink">Pemilik bisnis</h3>
        </div>
        <FormField label="Nama pemilik" htmlFor="owner-name">
          <input id="owner-name" required maxLength={100} value={values.ownerName} onChange={(event) => onFieldChange("ownerName", event.target.value)} className={fieldClass} />
        </FormField>
        <FormField label="Peran" htmlFor="owner-role">
          <input id="owner-role" required maxLength={100} placeholder="Contoh: Pendiri" value={values.ownerRole} onChange={(event) => onFieldChange("ownerRole", event.target.value)} className={fieldClass} />
        </FormField>
        <FormField label="Bio pemilik" htmlFor="owner-bio" className="md:col-span-2">
          <textarea id="owner-bio" required maxLength={1000} value={values.ownerBio} onChange={(event) => onFieldChange("ownerBio", event.target.value)} className={textAreaClass} />
        </FormField>

        <div className="border-t border-line pt-6 md:col-span-2">
          <h3 className="text-lg font-semibold text-ink">Informasi tambahan</h3>
        </div>
        <FormField label="Gambar cover (JPEG, PNG, WebP, atau GIF; maks. 5 MB)" htmlFor="business-cover-file" className="md:col-span-2">
          <input
            id="business-cover-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading !== null}
            onChange={(event) => handleUpload("coverImage", event.target.files?.[0])}
            className={`${fieldClass} py-2.5 file:mr-4 file:border-0 file:bg-soft-green file:px-3 file:py-1 file:text-sm file:font-medium file:text-forest`}
          />
          {values.coverImage ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="break-all text-xs text-muted">{values.coverImage}</p>
              <button type="button" onClick={() => onFieldChange("coverImage", "")} className="min-h-11 text-xs font-medium text-red-700 underline underline-offset-4">
                Hapus cover
              </button>
            </div>
          ) : null}
        </FormField>
        <FormField label="Logo bisnis (JPEG, PNG, WebP, atau GIF; maks. 5 MB)" htmlFor="business-logo-file" className="md:col-span-2">
          <input
            id="business-logo-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            disabled={uploading !== null}
            onChange={(event) => handleUpload("logo", event.target.files?.[0])}
            className={`${fieldClass} py-2.5 file:mr-4 file:border-0 file:bg-soft-green file:px-3 file:py-1 file:text-sm file:font-medium file:text-forest`}
          />
          {values.logo ? (
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <p className="break-all text-xs text-muted">{values.logo}</p>
              <button type="button" onClick={() => onFieldChange("logo", "")} className="min-h-11 text-xs font-medium text-red-700 underline underline-offset-4">
                Hapus logo
              </button>
            </div>
          ) : null}
        </FormField>
        {uploadMessage ? <p className="text-sm text-muted md:col-span-2" role="status">{uploadMessage}</p> : null}
        <FormField label="Kebutuhan mitra (pisahkan dengan koma)" htmlFor="business-seeking" className="md:col-span-2">
          <input id="business-seeking" placeholder="Mitra distribusi, Mitra ekspansi" value={values.seeking} onChange={(event) => onFieldChange("seeking", event.target.value)} className={fieldClass} />
        </FormField>
        <FormField label="Tujuan mencari mitra (opsional)" htmlFor="business-objective" className="md:col-span-2">
          <textarea id="business-objective" maxLength={500} value={values.seekingObjective} onChange={(event) => onFieldChange("seekingObjective", event.target.value)} className={textAreaClass} />
        </FormField>

        <div className="flex flex-col gap-3 border-t border-line pt-6 sm:flex-row md:col-span-2">
          <button type="submit" disabled={saving} className={buttonStyles({ variant: "primary", size: "lg" })}>
            {saving ? "Menyimpan..." : editing ? "Simpan perubahan" : "Simpan draft"}
          </button>
          <button type="button" onClick={onCancel} disabled={saving} className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Batal
          </button>
        </div>
      </form>
    </section>
  );
}

function FormField({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string;
  htmlFor: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-ink">{label}</label>
      {children}
    </div>
  );
}
