"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Save,
  Send,
  Eye,
  History,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ToggleLeft,
  ToggleRight,
  Layers,
  Clock,
  UserCheck,
  X,
  Upload,
} from "lucide-react";
import type {
  HomepageContent,
  HomepageAdminState,
  HomepageRevision,
} from "@/types/homepage";
import { DEFAULT_HOMEPAGE_CONTENT } from "@/lib/homepage-defaults";
import { uploadMediaApi } from "@/lib/api";

export default function HomepageEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [uploadingHeroMedia, setUploadingHeroMedia] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Admin state
  const [adminState, setAdminState] = useState<HomepageAdminState | null>(null);
  const [content, setContent] = useState<HomepageContent>(DEFAULT_HOMEPAGE_CONTENT);
  const [originalContent, setOriginalContent] = useState<string>("");
  const isDirty = Boolean(originalContent && JSON.stringify(content) !== originalContent);

  // Accordion active sections
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    hero: true,
    value: false,
    discovery: false,
    features: false,
    journey: false,
    howItWorks: false,
    ai: false,
    finalCta: false,
  });

  // Revisions modal
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState<HomepageRevision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);
  const [restoringVersion, setRestoringVersion] = useState<string | null>(null);

  // Publish confirmation modal
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  // Load initial homepage state
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch("/api/v1/admin/homepage", {
          credentials: "include",
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Gagal memuat konten beranda dari server.");
        }

        const json = await res.json();
        if (json.data) {
          setAdminState(json.data);
          const initial = json.data.draftContent || DEFAULT_HOMEPAGE_CONTENT;
          setContent(initial);
          setOriginalContent(JSON.stringify(initial));
          if (json.data.revisions) {
            setRevisions(json.data.revisions);
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);



  function toggleSection(sectionKey: string) {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  }

  // Save Draft Handler
  async function handleSaveDraft() {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);

      const res = await fetch("/api/v1/admin/homepage", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal menyimpan draft.");
      }

      setAdminState(data.data);
      setOriginalContent(JSON.stringify(content));
      setSuccessMessage("Draft konten beranda berhasil disimpan!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan draft.");
    } finally {
      setSaving(false);
    }
  }

  async function handleHeroImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingHeroMedia(true);
      setError(null);
      const result = await uploadMediaApi(file);
      if (!result.ok || !result.url) {
        throw new Error(result.error || "Gagal mengunggah file gambar.");
      }

      setContent((prev) => ({
        ...prev,
        hero: {
          ...prev.hero,
          fallbackImage: {
            ...prev.hero.fallbackImage,
            src: result.url!,
          },
        },
      }));
      setSuccessMessage("Gambar fallback berhasil diunggah!");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengunggah gambar.");
    } finally {
      setUploadingHeroMedia(false);
      // Reset input value so same file can be re-selected if desired
      e.target.value = "";
    }
  }

  // Publish Draft Handler
  async function handlePublish() {
    try {
      setPublishing(true);
      setError(null);
      setSuccessMessage(null);

      // Save draft first if dirty
      if (isDirty) {
        const saveRes = await fetch("/api/v1/admin/homepage", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ content }),
        });
        if (!saveRes.ok) {
          const saveErr = await saveRes.json().catch(() => null);
          throw new Error(saveErr?.error || "Gagal menyimpan draft sebelum mempublikasikan.");
        }
      }


      const res = await fetch("/api/v1/admin/homepage", {
        method: "POST",
        credentials: "include",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal mempublikasikan konten.");
      }

      setAdminState(data.data?.state || data.data);
      setOriginalContent(JSON.stringify(content));
      setShowPublishConfirm(false);
      setSuccessMessage("Konten beranda berhasil dipublikasikan ke Website Publik!");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mempublikasikan konten.");
    } finally {
      setPublishing(false);
    }
  }

  // Load Revisions Handler
  async function openRevisionsModal() {
    setShowRevisions(true);
    try {
      setLoadingRevisions(true);
      const res = await fetch("/api/v1/admin/homepage/revisions", {
        credentials: "include",
        cache: "no-store",
      });
      if (res.ok) {
        const json = await res.json();
        if (json.data) setRevisions(json.data);
      }
    } catch (err) {
      console.error("Gagal mengambil daftar revisi:", err);
    } finally {
      setLoadingRevisions(false);
    }
  }

  // Restore revision to draft
  async function handleRestoreRevision(revisionId: string) {
    if (!confirm(`Pulihkan revisi #${revisionId.slice(0, 8)} ke draft aktif? Perubahan draft Anda saat ini akan ditimpa.`)) {
      return;
    }

    try {
      setRestoringVersion(revisionId);
      const res = await fetch("/api/v1/admin/homepage/revisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ revisionId }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memulihkan revisi.");
      }

      const restoredState = data.data;
      setAdminState(restoredState);
      setContent(restoredState.draftContent);
      setOriginalContent(JSON.stringify(restoredState.draftContent));
      setShowRevisions(false);
      setSuccessMessage(`Revisi #${revisionId.slice(0, 8)} berhasil dipulihkan ke draft aktif! Silakan periksa lalu publikasikan.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal memulihkan revisi.");
    } finally {
      setRestoringVersion(null);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-8 text-center">
        <div className="size-8 animate-spin rounded-full border-3 border-[#123f32] border-t-transparent" />
        <p className="mt-4 text-sm font-medium text-[#123f32]">Memuat editor konten beranda...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Notifications */}
      {error && (
        <div className="flex items-center justify-between rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-xs font-semibold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {successMessage && (
        <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-xs font-semibold hover:underline">
            Tutup
          </button>
        </div>
      )}

      {/* Top Action Bar */}
      <header className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#123f32]/10 px-2.5 py-0.5 font-semibold text-[#123f32]">
                <Layers className="size-3" />
                CMS Beranda
              </span>
              {isDirty ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 font-medium text-amber-800">
                  <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
                  Ada Perubahan Belum Disimpan
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800">
                  <CheckCircle2 className="size-3" />
                  Draft Tersimpan
                </span>
              )}
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#123f32] sm:text-3xl">
              Manajemen Konten Beranda
            </h1>
            <p className="mt-1 text-xs text-[#526059] sm:text-sm">
              Kelola teks, headline, narasi fitur, CTA, dan visibilitas 8 section landing page LUMORA.
            </p>

            {adminState && (
              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-[#526059]">
                <div className="flex items-center gap-1">
                  <Clock className="size-3.5 text-[#123f32]" />
                  <span>
                    Draft diedit:{" "}
                    <strong>
                      {new Date(adminState.draftUpdatedAt).toLocaleString("id-ID", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </strong>
                  </span>
                </div>
                {adminState.lastPublishedAt && (
                  <div className="flex items-center gap-1 border-l border-[#d8d8cf] pl-4">
                    <UserCheck className="size-3.5 text-emerald-700" />
                    <span>
                      Terakhir publikasi:{" "}
                      <strong>
                        {new Date(adminState.lastPublishedAt).toLocaleString("id-ID", {
                          dateStyle: "medium",
                          timeStyle: "short",
                        })}
                      </strong>
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={openRevisionsModal}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#123f32] transition-colors hover:bg-[#e7efe9]"
              title="Lihat riwayat versi publikasi"
            >
              <History className="size-4" />
              <span>Riwayat</span>
            </button>

            <Link
              href="/admin/beranda/preview"
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#123f32]/20 bg-[#f5f2e9] px-3.5 py-2.5 text-xs font-semibold text-[#123f32] transition-colors hover:bg-[#e7efe9]"
              title="Buka pratinjau draft di tab baru"
            >
              <Eye className="size-4" />
              <span>Pratinjau Draft</span>
              <ExternalLink className="size-3 text-[#526059]" />
            </Link>

            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving || !isDirty}
              className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-semibold transition-colors shadow-2xs ${
                isDirty
                  ? "bg-[#123f32] text-white hover:bg-[#0b3027]"
                  : "bg-[#e7efe9] text-[#71827a] cursor-not-allowed"
              }`}
            >
              <Save className="size-4" />
              <span>{saving ? "Menyimpan..." : "Simpan Draft"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowPublishConfirm(true)}
              disabled={publishing}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#b7df68] px-4 py-2.5 text-xs font-bold text-[#123f32] transition-colors hover:bg-[#a6d152] shadow-xs"
            >
              <Send className="size-4" />
              <span>Publikasikan</span>
            </button>
          </div>
        </div>
      </header>

      {/* Accordion List for 8 Homepage Sections */}
      <div className="space-y-4">
        {/* SECTION 1: HERO */}
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-2xs overflow-hidden">
          <button
            type="button"
            onClick={() => toggleSection("hero")}
            className="flex w-full items-center justify-between p-5 sm:p-6 text-left transition-colors hover:bg-[#f5f2e9]"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#123f32] text-xs font-bold text-[#b7df68]">
                01
              </span>
              <div>
                <h2 className="text-base font-bold text-[#123f32]">Hero Section</h2>
                <p className="text-xs text-[#526059]">Headline utama, narasi hero, CTA pendaftaran, dan fallback banner</p>
              </div>
            </div>
            {openSections.hero ? <ChevronUp className="size-5 text-[#526059]" /> : <ChevronDown className="size-5 text-[#526059]" />}
          </button>

          {openSections.hero && (
            <div className="border-t border-[#d8d8cf] p-5 sm:p-6 bg-white space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Wordmark</label>
                  <input
                    type="text"
                    value={content.hero.wordmark}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, wordmark: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm focus:border-[#123f32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Catatan Kaki (Footnote)</label>
                  <input
                    type="text"
                    value={content.hero.footnote}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, footnote: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm focus:border-[#123f32] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Headline Utama (Baris 1)</label>
                  <input
                    type="text"
                    value={content.hero.headingLead}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, headingLead: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm focus:border-[#123f32] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Headline Utama (Penekanan / Italic)</label>
                  <input
                    type="text"
                    value={content.hero.headingEmphasis}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        hero: { ...content.hero, headingEmphasis: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm focus:border-[#123f32] focus:outline-none font-serif italic"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123f32] mb-1">Deskripsi Hero</label>
                <textarea
                  rows={2}
                  value={content.hero.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      hero: { ...content.hero, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm focus:border-[#123f32] focus:outline-none leading-relaxed"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#e7efe9]">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#123f32]">Tombol Utama (Lime Button)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label tombol"
                      value={content.hero.primaryCta.label}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: {
                            ...content.hero,
                            primaryCta: { ...content.hero.primaryCta, label: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="URL tujuan"
                      value={content.hero.primaryCta.href}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: {
                            ...content.hero,
                            primaryCta: { ...content.hero.primaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#123f32]">Tombol Kedua (Link Jelajah)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label tombol"
                      value={content.hero.secondaryCta.label}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: {
                            ...content.hero,
                            secondaryCta: { ...content.hero.secondaryCta, label: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs"
                    />
                    <input
                      type="text"
                      placeholder="URL tujuan"
                      value={content.hero.secondaryCta.href}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: {
                            ...content.hero,
                            secondaryCta: { ...content.hero.secondaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Fallback Image Settings */}
              <div className="pt-2 border-t border-[#e7efe9] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#123f32]">Fallback Banner (Jika Belum Ada Profil Terbit)</span>
                  <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-[#123f32] bg-white px-3 py-1 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors">
                    <Upload className="size-3.5" />
                    <span>{uploadingHeroMedia ? "Mengunggah..." : "Unggah Gambar Baru"}</span>
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingHeroMedia}
                      onChange={handleHeroImageUpload}
                      className="sr-only"
                    />
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] text-[#526059] mb-1">Path/URL Gambar Fallback</label>
                    <input
                      type="text"
                      value={content.hero.fallbackImage.src}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: {
                            ...content.hero,
                            fallbackImage: { ...content.hero.fallbackImage, src: e.target.value },
                          },
                        })
                      }
                      className="w-full rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#526059] mb-1">Caption Ilustrasi</label>
                    <input
                      type="text"
                      value={content.hero.fallbackImage.caption}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: {
                            ...content.hero,
                            fallbackImage: { ...content.hero.fallbackImage, caption: e.target.value },
                          },
                        })
                      }
                      className="w-full rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[11px] text-[#526059] mb-1">Alt Text Gambar</label>
                    <input
                      type="text"
                      value={content.hero.fallbackImage.alt}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: {
                            ...content.hero,
                            fallbackImage: { ...content.hero.fallbackImage, alt: e.target.value },
                          },
                        })
                      }
                      className="w-full rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs"
                      placeholder="Deskripsi untuk pembaca layar (accessibility)"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-[#526059] mb-1">Teks Disclaimer (Disclosure)</label>
                    <input
                      type="text"
                      value={content.hero.fallbackImage.disclosure}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          hero: {
                            ...content.hero,
                            fallbackImage: { ...content.hero.fallbackImage, disclosure: e.target.value },
                          },
                        })
                      }
                      className="w-full rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs"
                      placeholder="e.g. Visual ilustrasi, bukan profil bisnis terdaftar."
                    />
                  </div>
                </div>
              </div>

            </div>
          )}
        </section>

        {/* SECTION 2: VALUE PROPOSITION */}
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-2xs overflow-hidden">
          <div className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-[#f5f2e9]">
            <button
              type="button"
              onClick={() => toggleSection("value")}
              className="flex items-center gap-3 text-left flex-1"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#123f32] text-xs font-bold text-[#b7df68]">
                02
              </span>
              <div>
                <h2 className="text-base font-bold text-[#123f32]">Value Proposition Section</h2>
                <p className="text-xs text-[#526059]">Pernyataan nilai dan 3 pilar solusi untuk UMKM lokal</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    value: { ...content.value, visible: !content.value.visible },
                  })
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-[#123f32]"
                title="Tampilkan / Sembunyikan section"
              >
                {content.value.visible ? (
                  <>
                    <ToggleRight className="size-6 text-[#123f32]" />
                    <span className="hidden sm:inline">Tampil</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-[#71827a]" />
                    <span className="hidden sm:inline text-[#71827a]">Tersembunyi</span>
                  </>
                )}
              </button>
              <button type="button" onClick={() => toggleSection("value")}>
                {openSections.value ? <ChevronUp className="size-5 text-[#526059]" /> : <ChevronDown className="size-5 text-[#526059]" />}
              </button>
            </div>
          </div>

          {openSections.value && (
            <div className="border-t border-[#d8d8cf] p-5 sm:p-6 bg-white space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Eyebrow</label>
                  <input
                    type="text"
                    value={content.value.eyebrow}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        value: { ...content.value, eyebrow: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Heading Lead</label>
                  <input
                    type="text"
                    value={content.value.headingLead}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        value: { ...content.value, headingLead: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Heading Emphasis</label>
                  <input
                    type="text"
                    value={content.value.headingEmphasis}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        value: { ...content.value, headingEmphasis: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm font-serif italic"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123f32] mb-1">Deskripsi Narasi</label>
                <textarea
                  rows={2}
                  value={content.value.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      value: { ...content.value, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                />
              </div>

              {/* 3 Points */}
              <div className="pt-2 border-t border-[#e7efe9] space-y-3">
                <span className="text-xs font-bold text-[#123f32]">3 Poin Nilai Tambah</span>
                <div className="grid gap-4 sm:grid-cols-3">
                  {content.value.points.map((point, index) => (
                    <div key={index} className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-3 space-y-2">
                      <span className="text-[11px] font-bold text-[#123f32]">Poin 0{index + 1}</span>
                      <input
                        type="text"
                        placeholder="Judul poin"
                        value={point.title}
                        onChange={(e) => {
                          const updated = [...content.value.points];
                          updated[index] = { ...point, title: e.target.value };
                          setContent({
                            ...content,
                            value: { ...content.value, points: updated },
                          });
                        }}
                        className="w-full rounded-lg border border-[#d8d8cf] bg-white px-3 py-1.5 text-xs font-semibold"
                      />
                      <textarea
                        rows={3}
                        placeholder="Deskripsi poin"
                        value={point.body}
                        onChange={(e) => {
                          const updated = [...content.value.points];
                          updated[index] = { ...point, body: e.target.value };
                          setContent({
                            ...content,
                            value: { ...content.value, points: updated },
                          });
                        }}
                        className="w-full rounded-lg border border-[#d8d8cf] bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 3: JELAJAHI UMKM DISCOVERY */}
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-2xs overflow-hidden">
          <div className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-[#f5f2e9]">
            <button
              type="button"
              onClick={() => toggleSection("discovery")}
              className="flex items-center gap-3 text-left flex-1"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#123f32] text-xs font-bold text-[#b7df68]">
                03
              </span>
              <div>
                <h2 className="text-base font-bold text-[#123f32]">Jelajahi UMKM Section</h2>
                <p className="text-xs text-[#526059]">Header katalog bisnis (data profil tetap dinamis dari API)</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    discovery: { ...content.discovery, visible: !content.discovery.visible },
                  })
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-[#123f32]"
              >
                {content.discovery.visible ? (
                  <>
                    <ToggleRight className="size-6 text-[#123f32]" />
                    <span className="hidden sm:inline">Tampil</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-[#71827a]" />
                    <span className="hidden sm:inline text-[#71827a]">Tersembunyi</span>
                  </>
                )}
              </button>
              <button type="button" onClick={() => toggleSection("discovery")}>
                {openSections.discovery ? <ChevronUp className="size-5 text-[#526059]" /> : <ChevronDown className="size-5 text-[#526059]" />}
              </button>
            </div>
          </div>

          {openSections.discovery && (
            <div className="border-t border-[#d8d8cf] p-5 sm:p-6 bg-white space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Eyebrow</label>
                  <input
                    type="text"
                    value={content.discovery.eyebrow}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        discovery: { ...content.discovery, eyebrow: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Judul Heading</label>
                  <input
                    type="text"
                    value={content.discovery.heading}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        discovery: { ...content.discovery, heading: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123f32] mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={content.discovery.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      discovery: { ...content.discovery, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                />
              </div>

              <div className="pt-2 border-t border-[#e7efe9] space-y-2">
                <span className="text-xs font-bold text-[#123f32]">Tautan CTA Jelajahi Semua</span>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={content.discovery.cta.label}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        discovery: {
                          ...content.discovery,
                          cta: { ...content.discovery.cta, label: e.target.value },
                        },
                      })
                    }
                    className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-medium"
                  />
                  <input
                    type="text"
                    value={content.discovery.cta.href}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        discovery: {
                          ...content.discovery,
                          cta: { ...content.discovery.cta, href: e.target.value },
                        },
                      })
                    }
                    className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 4: FITUR LUMORA */}
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-2xs overflow-hidden">
          <div className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-[#f5f2e9]">
            <button
              type="button"
              onClick={() => toggleSection("features")}
              className="flex items-center gap-3 text-left flex-1"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#123f32] text-xs font-bold text-[#b7df68]">
                04
              </span>
              <div>
                <h2 className="text-base font-bold text-[#123f32]">Fitur LUMORA Section</h2>
                <p className="text-xs text-[#526059]">Daftar 4 fitur utama platform dan link asisten AI</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    features: { ...content.features, visible: !content.features.visible },
                  })
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-[#123f32]"
              >
                {content.features.visible ? (
                  <>
                    <ToggleRight className="size-6 text-[#123f32]" />
                    <span className="hidden sm:inline">Tampil</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-[#71827a]" />
                    <span className="hidden sm:inline text-[#71827a]">Tersembunyi</span>
                  </>
                )}
              </button>
              <button type="button" onClick={() => toggleSection("features")}>
                {openSections.features ? <ChevronUp className="size-5 text-[#526059]" /> : <ChevronDown className="size-5 text-[#526059]" />}
              </button>
            </div>
          </div>

          {openSections.features && (
            <div className="border-t border-[#d8d8cf] p-5 sm:p-6 bg-white space-y-5">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Eyebrow</label>
                  <input
                    type="text"
                    value={content.features.eyebrow}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        features: { ...content.features, eyebrow: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Heading Lead</label>
                  <input
                    type="text"
                    value={content.features.headingLead}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        features: { ...content.features, headingLead: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Heading Emphasis</label>
                  <input
                    type="text"
                    value={content.features.headingEmphasis}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        features: { ...content.features, headingEmphasis: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm font-serif italic"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123f32] mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={content.features.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      features: { ...content.features, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                />
              </div>

              {/* Action Buttons for Features Section */}
              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#e7efe9]">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#123f32]">Tombol Utama (Buat Profil)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label tombol"
                      value={content.features.primaryCta.label}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          features: {
                            ...content.features,
                            primaryCta: { ...content.features.primaryCta, label: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="URL tujuan"
                      value={content.features.primaryCta.href}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          features: {
                            ...content.features,
                            primaryCta: { ...content.features.primaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#123f32]">Tautan Sekunder (Asisten AI)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label tautan"
                      value={content.features.secondaryLink.label}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          features: {
                            ...content.features,
                            secondaryLink: { ...content.features.secondaryLink, label: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="URL tujuan"
                      value={content.features.secondaryLink.href}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          features: {
                            ...content.features,
                            secondaryLink: { ...content.features.secondaryLink, href: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* 4 Feature Items */}
              <div className="pt-2 border-t border-[#e7efe9] space-y-3">
                <span className="text-xs font-bold text-[#123f32]">4 Item Fitur Platform</span>

                <div className="grid gap-3 sm:grid-cols-2">
                  {content.features.items.map((item, index) => (
                    <div key={index} className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-3 space-y-2">
                      <span className="text-[11px] font-bold text-[#123f32]">Fitur 0{index + 1}</span>
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const updated = [...content.features.items];
                          updated[index] = { ...item, title: e.target.value };
                          setContent({
                            ...content,
                            features: { ...content.features, items: updated },
                          });
                        }}
                        className="w-full rounded-lg border border-[#d8d8cf] bg-white px-3 py-1.5 text-xs font-semibold"
                      />
                      <textarea
                        rows={2}
                        value={item.description}
                        onChange={(e) => {
                          const updated = [...content.features.items];
                          updated[index] = { ...item, description: e.target.value };
                          setContent({
                            ...content,
                            features: { ...content.features, items: updated },
                          });
                        }}
                        className="w-full rounded-lg border border-[#d8d8cf] bg-white px-3 py-1.5 text-xs"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 5: CERITA & PERJALANAN */}
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-2xs overflow-hidden">
          <div className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-[#f5f2e9]">
            <button
              type="button"
              onClick={() => toggleSection("journey")}
              className="flex items-center gap-3 text-left flex-1"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#123f32] text-xs font-bold text-[#b7df68]">
                05
              </span>
              <div>
                <h2 className="text-base font-bold text-[#123f32]">Cerita & Perjalanan Usaha</h2>
                <p className="text-xs text-[#526059]">Header timeline perkembangan (timeline dinamis dari milestone UMKM)</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    journey: { ...content.journey, visible: !content.journey.visible },
                  })
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-[#123f32]"
              >
                {content.journey.visible ? (
                  <>
                    <ToggleRight className="size-6 text-[#123f32]" />
                    <span className="hidden sm:inline">Tampil</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-[#71827a]" />
                    <span className="hidden sm:inline text-[#71827a]">Tersembunyi</span>
                  </>
                )}
              </button>
              <button type="button" onClick={() => toggleSection("journey")}>
                {openSections.journey ? <ChevronUp className="size-5 text-[#526059]" /> : <ChevronDown className="size-5 text-[#526059]" />}
              </button>
            </div>
          </div>

          {openSections.journey && (
            <div className="border-t border-[#d8d8cf] p-5 sm:p-6 bg-white space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Eyebrow</label>
                  <input
                    type="text"
                    value={content.journey.eyebrow}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        journey: { ...content.journey, eyebrow: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Heading Lead</label>
                  <input
                    type="text"
                    value={content.journey.headingLead}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        journey: { ...content.journey, headingLead: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Heading Emphasis</label>
                  <input
                    type="text"
                    value={content.journey.headingEmphasis}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        journey: { ...content.journey, headingEmphasis: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm font-serif italic"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123f32] mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={content.journey.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      journey: { ...content.journey, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                />
              </div>
            </div>
          )}
        </section>

        {/* SECTION 6: CARA KERJA */}
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-2xs overflow-hidden">
          <div className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-[#f5f2e9]">
            <button
              type="button"
              onClick={() => toggleSection("howItWorks")}
              className="flex items-center gap-3 text-left flex-1"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#123f32] text-xs font-bold text-[#b7df68]">
                06
              </span>
              <div>
                <h2 className="text-base font-bold text-[#123f32]">Cara Kerja Section</h2>
                <p className="text-xs text-[#526059]">5 langkah untuk UMKM dan 5 langkah untuk Mitra/Investor</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    howItWorks: { ...content.howItWorks, visible: !content.howItWorks.visible },
                  })
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-[#123f32]"
              >
                {content.howItWorks.visible ? (
                  <>
                    <ToggleRight className="size-6 text-[#123f32]" />
                    <span className="hidden sm:inline">Tampil</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-[#71827a]" />
                    <span className="hidden sm:inline text-[#71827a]">Tersembunyi</span>
                  </>
                )}
              </button>
              <button type="button" onClick={() => toggleSection("howItWorks")}>
                {openSections.howItWorks ? <ChevronUp className="size-5 text-[#526059]" /> : <ChevronDown className="size-5 text-[#526059]" />}
              </button>
            </div>
          </div>

          {openSections.howItWorks && (
            <div className="border-t border-[#d8d8cf] p-5 sm:p-6 bg-white space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Eyebrow</label>
                  <input
                    type="text"
                    value={content.howItWorks.eyebrow}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        howItWorks: { ...content.howItWorks, eyebrow: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Judul Heading</label>
                  <input
                    type="text"
                    value={content.howItWorks.heading}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        howItWorks: { ...content.howItWorks, heading: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123f32] mb-1">Deskripsi</label>
                <textarea
                  rows={2}
                  value={content.howItWorks.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      howItWorks: { ...content.howItWorks, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                />
              </div>

              {/* Steps for UMKM */}
              <div className="pt-2 border-t border-[#e7efe9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#123f32]">Alur Sisi 1: {content.howItWorks.umkmLabel}</span>
                  <input
                    type="text"
                    value={content.howItWorks.umkmLabel}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        howItWorks: { ...content.howItWorks, umkmLabel: e.target.value },
                      })
                    }
                    className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-2.5 py-1 text-xs"
                    placeholder="Label Tab UMKM"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {content.howItWorks.umkmSteps.map((step, idx) => (
                    <div key={idx} className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-2.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-[#123f32]">Step 0{idx + 1}</span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const updated = [...content.howItWorks.umkmSteps];
                          updated[idx] = { ...step, title: e.target.value };
                          setContent({
                            ...content,
                            howItWorks: { ...content.howItWorks, umkmSteps: updated },
                          });
                        }}
                        className="w-full rounded border border-[#d8d8cf] bg-white px-2 py-1 text-xs font-medium"
                      />
                      <textarea
                        rows={2}
                        value={step.body}
                        onChange={(e) => {
                          const updated = [...content.howItWorks.umkmSteps];
                          updated[idx] = { ...step, body: e.target.value };
                          setContent({
                            ...content,
                            howItWorks: { ...content.howItWorks, umkmSteps: updated },
                          });
                        }}
                        className="w-full rounded border border-[#d8d8cf] bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Steps for Partner */}
              <div className="pt-2 border-t border-[#e7efe9] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#123f32]">Alur Sisi 2: {content.howItWorks.partnerLabel}</span>
                  <input
                    type="text"
                    value={content.howItWorks.partnerLabel}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        howItWorks: { ...content.howItWorks, partnerLabel: e.target.value },
                      })
                    }
                    className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-2.5 py-1 text-xs"
                    placeholder="Label Tab Mitra"
                  />
                </div>
                <div className="grid gap-2 sm:grid-cols-5">
                  {content.howItWorks.partnerSteps.map((step, idx) => (
                    <div key={idx} className="rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-2.5 space-y-1.5">
                      <span className="text-[10px] font-bold text-[#123f32]">Step 0{idx + 1}</span>
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => {
                          const updated = [...content.howItWorks.partnerSteps];
                          updated[idx] = { ...step, title: e.target.value };
                          setContent({
                            ...content,
                            howItWorks: { ...content.howItWorks, partnerSteps: updated },
                          });
                        }}
                        className="w-full rounded border border-[#d8d8cf] bg-white px-2 py-1 text-xs font-medium"
                      />
                      <textarea
                        rows={2}
                        value={step.body}
                        onChange={(e) => {
                          const updated = [...content.howItWorks.partnerSteps];
                          updated[idx] = { ...step, body: e.target.value };
                          setContent({
                            ...content,
                            howItWorks: { ...content.howItWorks, partnerSteps: updated },
                          });
                        }}
                        className="w-full rounded border border-[#d8d8cf] bg-white px-2 py-1 text-[11px]"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 7: LUMORA AI */}
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-2xs overflow-hidden">
          <div className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-[#f5f2e9]">
            <button
              type="button"
              onClick={() => toggleSection("ai")}
              className="flex items-center gap-3 text-left flex-1"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#123f32] text-xs font-bold text-[#b7df68]">
                07
              </span>
              <div>
                <h2 className="text-base font-bold text-[#123f32]">LUMORA AI Section</h2>
                <p className="text-xs text-[#526059]">Narasi asisten AI, disclaimer guardrail, dan batasan sistem</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    ai: { ...content.ai, visible: !content.ai.visible },
                  })
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-[#123f32]"
              >
                {content.ai.visible ? (
                  <>
                    <ToggleRight className="size-6 text-[#123f32]" />
                    <span className="hidden sm:inline">Tampil</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-[#71827a]" />
                    <span className="hidden sm:inline text-[#71827a]">Tersembunyi</span>
                  </>
                )}
              </button>
              <button type="button" onClick={() => toggleSection("ai")}>
                {openSections.ai ? <ChevronUp className="size-5 text-[#526059]" /> : <ChevronDown className="size-5 text-[#526059]" />}
              </button>
            </div>
          </div>

          {openSections.ai && (
            <div className="border-t border-[#d8d8cf] p-5 sm:p-6 bg-white space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Eyebrow</label>
                  <input
                    type="text"
                    value={content.ai.eyebrow}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        ai: { ...content.ai, eyebrow: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Judul Heading</label>
                  <input
                    type="text"
                    value={content.ai.heading}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        ai: { ...content.ai, heading: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123f32] mb-1">Deskripsi Narasi AI</label>
                <textarea
                  rows={2}
                  value={content.ai.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      ai: { ...content.ai, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#e7efe9]">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Judul Guardrail</label>
                  <input
                    type="text"
                    value={content.ai.guardrailTitle}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        ai: { ...content.ai, guardrailTitle: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Teks Disclaimer Guardrail</label>
                  <input
                    type="text"
                    value={content.ai.guardrailDescription}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        ai: { ...content.ai, guardrailDescription: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>
            </div>
          )}
        </section>

        {/* SECTION 8: FINAL CTA */}
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-2xs overflow-hidden">
          <div className="flex w-full items-center justify-between p-5 sm:p-6 transition-colors hover:bg-[#f5f2e9]">
            <button
              type="button"
              onClick={() => toggleSection("finalCta")}
              className="flex items-center gap-3 text-left flex-1"
            >
              <span className="flex size-7 items-center justify-center rounded-lg bg-[#123f32] text-xs font-bold text-[#b7df68]">
                08
              </span>
              <div>
                <h2 className="text-base font-bold text-[#123f32]">Final CTA Section</h2>
                <p className="text-xs text-[#526059]">Ajakan bertindak penutup halaman, tombol daftar dan jelajahi</p>
              </div>
            </button>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setContent({
                    ...content,
                    finalCta: { ...content.finalCta, visible: !content.finalCta.visible },
                  })
                }
                className="flex items-center gap-1.5 text-xs font-semibold text-[#123f32]"
              >
                {content.finalCta.visible ? (
                  <>
                    <ToggleRight className="size-6 text-[#123f32]" />
                    <span className="hidden sm:inline">Tampil</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="size-6 text-[#71827a]" />
                    <span className="hidden sm:inline text-[#71827a]">Tersembunyi</span>
                  </>
                )}
              </button>
              <button type="button" onClick={() => toggleSection("finalCta")}>
                {openSections.finalCta ? <ChevronUp className="size-5 text-[#526059]" /> : <ChevronDown className="size-5 text-[#526059]" />}
              </button>
            </div>
          </div>

          {openSections.finalCta && (
            <div className="border-t border-[#d8d8cf] p-5 sm:p-6 bg-white space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Eyebrow</label>
                  <input
                    type="text"
                    value={content.finalCta.eyebrow}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        finalCta: { ...content.finalCta, eyebrow: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#123f32] mb-1">Judul Heading</label>
                  <input
                    type="text"
                    value={content.finalCta.heading}
                    onChange={(e) =>
                      setContent({
                        ...content,
                        finalCta: { ...content.finalCta, heading: e.target.value },
                      })
                    }
                    className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#123f32] mb-1">Deskripsi Ajakan</label>
                <textarea
                  rows={2}
                  value={content.finalCta.description}
                  onChange={(e) =>
                    setContent({
                      ...content,
                      finalCta: { ...content.finalCta, description: e.target.value },
                    })
                  }
                  className="w-full rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] px-3.5 py-2 text-sm"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2 pt-2 border-t border-[#e7efe9]">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#123f32]">Tombol Utama (Daftarkan UMKM)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label tombol"
                      value={content.finalCta.primaryCta.label}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          finalCta: {
                            ...content.finalCta,
                            primaryCta: { ...content.finalCta.primaryCta, label: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="URL tujuan"
                      value={content.finalCta.primaryCta.href}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          finalCta: {
                            ...content.finalCta,
                            primaryCta: { ...content.finalCta.primaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#123f32]">Tombol Kedua (Jelajahi Bisnis)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Label tombol"
                      value={content.finalCta.secondaryCta.label}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          finalCta: {
                            ...content.finalCta,
                            secondaryCta: { ...content.finalCta.secondaryCta, label: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-medium"
                    />
                    <input
                      type="text"
                      placeholder="URL tujuan"
                      value={content.finalCta.secondaryCta.href}
                      onChange={(e) =>
                        setContent({
                          ...content,
                          finalCta: {
                            ...content.finalCta,
                            secondaryCta: { ...content.finalCta.secondaryCta, href: e.target.value },
                          },
                        })
                      }
                      className="rounded-lg border border-[#d8d8cf] bg-[#fbfaf6] px-3 py-1.5 text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* Confirmation Modal for Publishing */}
      {showPublishConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-[#d8d8cf] bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-3 text-[#123f32]">
              <span className="flex size-10 items-center justify-center rounded-xl bg-[#b7df68]/40 text-[#123f32]">
                <Send className="size-5" />
              </span>
              <div>
                <h3 className="text-lg font-bold">Publikasikan ke Publik?</h3>
                <p className="text-xs text-[#526059]">Perubahan akan langsung tampil di beranda website publik.</p>
              </div>
            </div>

            <p className="text-xs leading-relaxed text-[#526059]">
              Tindakan ini akan mengabadikan revisi baru dalam sistem riwayat. Anda dapat membatalkan atau memulihkan versi lama kapan saja melalui panel Riwayat Revisi.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#e7efe9]">
              <button
                type="button"
                onClick={() => setShowPublishConfirm(false)}
                disabled={publishing}
                className="rounded-xl border border-[#d8d8cf] px-4 py-2 text-xs font-semibold text-[#526059] hover:bg-[#f5f2e9]"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handlePublish}
                disabled={publishing}
                className="rounded-xl bg-[#123f32] px-4 py-2 text-xs font-bold text-white hover:bg-[#0b3027] transition-colors"
              >
                {publishing ? "Mempublikasikan..." : "Ya, Publikasikan Sekarang"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Revisions History Drawer / Modal */}
      {showRevisions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl border border-[#d8d8cf] bg-white p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-[#e7efe9]">
              <div className="flex items-center gap-2 text-[#123f32]">
                <History className="size-5" />
                <h3 className="text-lg font-bold">Riwayat Revisi Publikasi</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="rounded-lg p-1 text-[#526059] hover:bg-[#f5f2e9]"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {loadingRevisions ? (
                <div className="py-8 text-center text-xs text-[#526059]">Memuat riwayat revisi...</div>
              ) : revisions.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#526059]">
                  Belum ada riwayat publikasi. Konten saat ini menggunakan default sistem.
                </div>
              ) : (
                revisions.map((rev) => (
                  <div
                    key={rev.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 text-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#123f32]">
                          Versi #{rev.id.slice(0, 8)}
                        </span>
                        <span className="text-[#526059]">
                          • Dipublikasikan oleh <strong>{rev.publishedByName}</strong>
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#71827a]">
                        {new Date(rev.publishedAt).toLocaleString("id-ID", {
                          dateStyle: "full",
                          timeStyle: "medium",
                        })}
                      </p>
                      <p className="mt-1 text-[11px] text-[#526059] italic">
                        Headline: &quot;{rev.content?.hero?.headingLead} {rev.content?.hero?.headingEmphasis}&quot;
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRestoreRevision(rev.id)}
                      disabled={restoringVersion !== null}
                      className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-lg border border-[#123f32] bg-white px-3 py-1.5 font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors"
                    >
                      <RotateCcw className="size-3.5" />
                      <span>{restoringVersion === rev.id ? "Memulihkan..." : "Pulihkan ke Draft"}</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-[#e7efe9]">
              <button
                type="button"
                onClick={() => setShowRevisions(false)}
                className="rounded-xl border border-[#d8d8cf] px-4 py-2 text-xs font-semibold text-[#123f32] hover:bg-[#f5f2e9]"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
