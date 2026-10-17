"use client";

import { useState, type FormEvent } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Calendar,
  Flag,
  Sparkles,
  Lightbulb,
  CheckCircle2,
  Clock,
  ExternalLink,
  AlertCircle,
  ArrowUpDown,
  Building2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { ProfileForm } from "@/lib/dashboard";
import type { ProfileError } from "@/lib/profile-management";
import type { BusinessMilestone } from "@/types/business";
import { validationProps } from "./profile-fields";

export interface BusinessStoryEditorProps {
  form: ProfileForm;
  disabled: boolean;
  dirty: boolean;
  creating: boolean;
  hasProfile?: boolean;
  onCreateProfile?: () => void;
  businessName?: string;
  errors?: ProfileError[];
  onChange: (form: ProfileForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPreview: () => void;
}

export function BusinessStoryEditor({
  form,
  disabled,
  dirty,
  creating,
  hasProfile = true,
  onCreateProfile,
  businessName,
  errors = [],
  onChange,
  onSubmit,
  onPreview,
}: BusinessStoryEditorProps) {
  const [showGuide, setShowGuide] = useState(true);
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null);

  if (!hasProfile) {
    return (
      <div className="w-full min-w-0">
        <div className="rounded-2xl border border-dashed border-line bg-surface/60 p-8 sm:p-12 text-center">
          <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-soft-green text-forest">
            <Building2 className="size-6 text-accent" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-forest">
            Belum Ada Profil Bisnis yang Dikelola
          </h3>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-muted">
            Untuk menulis cerita usaha dan mencatat perjalanan bisnis, buat profil usaha terlebih dahulu. Kisah usahamu akan ditampilkan di halaman profil publik UMKM.
          </p>
          {onCreateProfile && (
            <div className="mt-6">
              <Button
                type="button"
                onClick={onCreateProfile}
                className="min-h-11 bg-forest px-5 text-sm text-white hover:bg-forest/90 font-medium"
              >
                Buat Profil Bisnis
              </Button>
            </div>
          )}
          <textarea id="profile-story" className="sr-only" readOnly value="" />
        </div>
      </div>
    );
  }

  // Field validation messages
  const storyError = errors.find((e) => e.field === "story")?.message;

  function updateStory(story: string) {
    onChange({ ...form, story });
  }

  function updateMilestone(index: number, patch: Partial<BusinessMilestone>) {
    const nextMilestones = form.milestones.map((item, i) =>
      i === index ? { ...item, ...patch } : item
    );
    onChange({ ...form, milestones: nextMilestones });
  }

  function addMilestone() {
    if (form.milestones.length >= 50 || disabled) return;
    const nextMilestones: BusinessMilestone[] = [
      ...form.milestones,
      { year: new Date().getFullYear(), title: "", description: "" },
    ];
    onChange({ ...form, milestones: nextMilestones });
  }

  function confirmRemoveMilestone(index: number) {
    const item = form.milestones[index];
    // If the milestone is blank, delete directly without confirmation
    if (!item.title?.trim() && !item.description?.trim()) {
      removeMilestone(index);
      return;
    }
    setDeletingIndex(index);
  }

  function removeMilestone(index: number) {
    const nextMilestones = form.milestones.filter((_, i) => i !== index);
    onChange({ ...form, milestones: nextMilestones });
    setDeletingIndex(null);
  }

  function sortMilestonesChronologically() {
    const sorted = [...form.milestones].sort((a, b) => (a.year || 0) - (b.year || 0));
    onChange({ ...form, milestones: sorted });
  }

  // Real-time timeline preview data sorted by year
  const previewMilestones = [...form.milestones]
    .map((item, originalIndex) => ({ ...item, originalIndex }))
    .filter((item) => item.year > 0 || item.title.trim() !== "")
    .sort((a, b) => (a.year || 0) - (b.year || 0));

  return (
    <div className="w-full min-w-0 space-y-6">
      {/* Top Context Info Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line/60 bg-surface px-4 py-3 text-xs sm:text-sm">
        <div className="flex items-center gap-2 text-muted">
          <Building2 className="size-4 text-forest shrink-0" />
          <span>
            Profil aktif: <strong className="text-forest font-semibold">{businessName || form.name || "Usaha Baru"}</strong>
          </span>
        </div>
        <div className="flex items-center gap-3">
          {creating ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200">
              <Clock className="size-3" />
              Draft baru — belum tersimpan
            </span>
          ) : dirty ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800 border border-amber-200">
              <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" />
              Ada perubahan belum disimpan
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-soft-green/70 px-2.5 py-1 text-xs font-medium text-forest border border-soft-green">
              <CheckCircle2 className="size-3 text-accent" />
              Data tersimpan di server
            </span>
          )}
        </div>
      </div>

      {/* Main Story Form */}
      <form noValidate onSubmit={onSubmit} className="w-full min-w-0 space-y-6">
        <fieldset disabled={disabled} className="w-full min-w-0 space-y-6">
          <legend className="sr-only">Editor Cerita Usaha & Milestone</legend>

          {/* SECTION 1: Latar Belakang & Cerita Usaha */}
          <Card className="w-full min-w-0 overflow-hidden border-line/80 bg-surface shadow-xs">
            <div className="border-b border-line/60 bg-ivory/50 px-5 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-forest flex items-center gap-2">
                  <BookOpen className="size-4 text-accent" />
                  <span>Latar Belakang & Cerita Usaha</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Ceritakan narasi usahamu secara autentik untuk membangun koneksi dengan pelanggan dan mitra.
                </p>
              </div>

              {/* Toggle Writing Guide Button */}
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-forest hover:text-accent transition-colors"
                aria-expanded={showGuide}
              >
                <Lightbulb className="size-3.5 text-accent" />
                <span>{showGuide ? "Tutup Panduan" : "Panduan Menulis"}</span>
                {showGuide ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
              </button>
            </div>

            {/* Writing Guide Helper Box */}
            {showGuide && (
              <div className="border-b border-line/50 bg-soft-green/20 p-5 sm:p-6">
                <div className="flex items-start gap-3">
                  <Sparkles className="size-4 text-accent shrink-0 mt-0.5" />
                  <div className="w-full min-w-0 space-y-3">
                    <p className="text-xs font-semibold text-forest uppercase tracking-wider">
                      Ide Pemantik: 4 Poin Cerita yang Menginspirasi
                    </p>
                    <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted">
                      <div className="rounded-lg bg-surface/80 p-3 border border-line/50">
                        <strong className="block text-forest font-medium mb-1">1. Awal Mula & Latar Belakang</strong>
                        <p>Bagaimana bisnis ini pertama kali dimulai? Masalah atau kegelisahan apa yang memicu lahirnya ide usaha ini?</p>
                      </div>
                      <div className="rounded-lg bg-surface/80 p-3 border border-line/50">
                        <strong className="block text-forest font-medium mb-1">2. Rintangan yang Dihadapi</strong>
                        <p>Tantangan terbesar apa yang pernah dihadapi (misal: modal, operasional, pandemi) dan bagaimana tim melewatinya?</p>
                      </div>
                      <div className="rounded-lg bg-surface/80 p-3 border border-line/50">
                        <strong className="block text-forest font-medium mb-1">3. Nilai & Filosofi Produk</strong>
                        <p>Apa komitmen kualitas, bahan lokal, atau dampak sosial yang selalu dijaga dalam setiap produk atau layanan?</p>
                      </div>
                      <div className="rounded-lg bg-surface/80 p-3 border border-line/50">
                        <strong className="block text-forest font-medium mb-1">4. Visi & Impian Masa Depan</strong>
                        <p>Ke mana arah pertumbuhan yang ingin dicapai dalam beberapa tahun mendatang? Apa cita-cita besar usahamu?</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Story Textarea Input */}
            <div className="p-5 sm:p-6 space-y-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Label htmlFor="profile-story" className="text-sm font-medium text-forest">
                  Narasi Kisah Usaha <span className="text-red-600">*</span>
                </Label>
                <span className="text-xs text-muted">
                  {(form.story || "").length}/5000 karakter
                </span>
              </div>

              <textarea
                {...validationProps("story", errors)}
                id="profile-story"
                required
                maxLength={5000}
                rows={7}
                value={form.story}
                onChange={(e) => updateStory(e.target.value)}
                placeholder="Tuliskan kisah usahamu di sini... Contoh: Berawal dari resep kopi turun-temurun keluarga di Pangalengan pada tahun 2020, kami melihat tingginya potensi biji kopi arabika lokal yang belum terserap maksimal..."
                className={cn(
                  "w-full rounded-lg border bg-surface p-4 text-sm leading-relaxed transition-colors min-h-[180px]",
                  storyError
                    ? "border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-200"
                    : "border-line-strong focus:border-forest focus:ring-1 focus:ring-forest/20"
                )}
              />

              {storyError && (
                <p id="error-story" role="alert" className="text-xs text-red-700 flex items-center gap-1.5">
                  <AlertCircle className="size-3.5 shrink-0" />
                  {storyError}
                </p>
              )}

              <p className="text-xs leading-5 text-muted">
                Cerita ini tampil secara menonjol di profil publik UMKM dan menjadi data utama yang dinilai calon investor serta mitra kerja sama.
              </p>
            </div>
          </Card>

          {/* SECTION 2: Milestone & Perjalanan Usaha Editor */}
          <Card className="w-full min-w-0 overflow-hidden border-line/80 bg-surface shadow-xs">
            <div className="border-b border-line/60 bg-ivory/50 px-5 py-4 sm:px-6 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-forest flex items-center gap-2">
                  <Flag className="size-4 text-accent" />
                  <span>Perjalanan Usaha (Milestones)</span>
                </h2>
                <p className="mt-0.5 text-xs text-muted">
                  Dokumentasikan fase-fase penting dan pencapaian bermakna dari tahun ke tahun.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {form.milestones.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={sortMilestonesChronologically}
                    disabled={disabled}
                    className="h-8 text-xs text-forest hover:bg-surface"
                    title="Urutkan milestone berdasarkan tahun terkecil ke terbesar"
                  >
                    <ArrowUpDown className="mr-1 size-3 text-muted" />
                    Urutkan Tahun
                  </Button>
                )}
                <span className="rounded-full bg-ivory px-2.5 py-1 text-xs font-medium text-muted border border-line/60">
                  {form.milestones.length}/50 milestone
                </span>
              </div>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {form.milestones.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-ivory/30 p-8 text-center">
                  <Calendar className="mx-auto size-8 text-muted" />
                  <p className="mt-2 text-sm font-medium text-forest">Belum ada milestone tercatat</p>
                  <p className="mt-1 text-xs text-muted max-w-sm mx-auto">
                    Catat momen awal berdiri, peluncuran produk pertama, pembukaan cabang, atau penghargaan yang pernah diraih.
                  </p>
                  <Button
                    type="button"
                    onClick={addMilestone}
                    disabled={disabled}
                    className="mt-4 min-h-10 bg-forest text-xs text-white hover:bg-forest/90"
                  >
                    <Plus className="mr-1.5 size-3.5" />
                    Tambah Momen Pertama
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {form.milestones.map((item, index) => {
                    const yearError = errors.find((e) => e.field === `milestone-year-${index}`)?.message;
                    const titleError = errors.find((e) => e.field === `milestone-title-${index}`)?.message;
                    const descError = errors.find((e) => e.field === `milestone-desc-${index}`)?.message;
                    const isConfirmingDelete = deletingIndex === index;

                    return (
                      <div
                        key={index}
                        className={cn(
                          "rounded-xl border p-4 sm:p-5 transition-all bg-surface/90",
                          yearError || titleError || descError
                            ? "border-red-300 ring-1 ring-red-100"
                            : "border-line/70 hover:border-forest/40"
                        )}
                      >
                        {/* Milestone Card Top Row */}
                        <div className="flex items-center justify-between gap-3 border-b border-line/40 pb-3 mb-4">
                          <div className="flex items-center gap-2">
                            <span className="flex size-6 items-center justify-center rounded-full bg-soft-green text-xs font-semibold text-forest">
                              {index + 1}
                            </span>
                            <span className="text-xs font-semibold text-forest">
                              {item.year ? `Tahun ${item.year}` : `Milestone #${index + 1}`}
                            </span>
                          </div>

                          {/* Delete Button with Confirmation State */}
                          {isConfirmingDelete ? (
                            <div className="flex items-center gap-2 animate-in fade-in duration-150">
                              <span className="text-xs font-medium text-red-800">
                                Hapus momen ini?
                              </span>
                              <Button
                                type="button"
                                size="sm"
                                variant="destructive"
                                onClick={() => removeMilestone(index)}
                                className="h-7 px-2.5 text-xs"
                              >
                                Ya, Hapus
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => setDeletingIndex(null)}
                                className="h-7 px-2 text-xs border-line"
                              >
                                Batal
                              </Button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => confirmRemoveMilestone(index)}
                              disabled={disabled}
                              className="text-muted hover:text-red-700 p-1 rounded-md hover:bg-red-50 transition-colors"
                              aria-label={`Hapus milestone ${index + 1}`}
                              title="Hapus milestone ini"
                            >
                              <Trash2 className="size-4" />
                            </button>
                          )}
                        </div>

                        {/* Milestone Input Fields */}
                        <div className="space-y-4">
                          <div className="grid gap-4 sm:grid-cols-[130px_1fr]">
                            {/* Year Field */}
                            <div>
                              <Label htmlFor={`milestone-year-${index}`} className="text-xs font-medium text-forest">
                                Tahun <span className="text-red-600">*</span>
                              </Label>
                              <Input
                                id={`milestone-year-${index}`}
                                type="number"
                                required
                                min={1900}
                                max={2100}
                                value={item.year || ""}
                                onChange={(e) => updateMilestone(index, { year: Number(e.target.value) })}
                                placeholder="2021"
                                className={cn(
                                  "mt-1.5 min-h-10 text-sm",
                                  yearError ? "border-red-400 focus:border-red-500" : "border-line-strong"
                                )}
                              />
                              {yearError && (
                                <p role="alert" className="mt-1 text-[11px] text-red-700">
                                  {yearError}
                                </p>
                              )}
                            </div>

                            {/* Title Field */}
                            <div>
                              <Label htmlFor={`milestone-title-${index}`} className="text-xs font-medium text-forest">
                                Momen Penting / Pencapaian <span className="text-red-600">*</span>
                              </Label>
                              <Input
                                id={`milestone-title-${index}`}
                                type="text"
                                required
                                maxLength={150}
                                value={item.title}
                                onChange={(e) => updateMilestone(index, { title: e.target.value })}
                                placeholder="Contoh: Membuka Gerai Pertama di Bandung & Raih Sertifikasi Halal"
                                className={cn(
                                  "mt-1.5 min-h-10 text-sm",
                                  titleError ? "border-red-400 focus:border-red-500" : "border-line-strong"
                                )}
                              />
                              {titleError && (
                                <p role="alert" className="mt-1 text-[11px] text-red-700">
                                  {titleError}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Description Field */}
                          <div>
                            <div className="flex items-baseline justify-between gap-2">
                              <Label htmlFor={`milestone-desc-${index}`} className="text-xs font-medium text-forest">
                                Deskripsi Tambahan (opsional)
                              </Label>
                              <span className="text-[11px] text-muted">
                                {(item.description || "").length}/500 karakter
                              </span>
                            </div>
                            <textarea
                              id={`milestone-desc-${index}`}
                              maxLength={500}
                              rows={2}
                              value={item.description || ""}
                              onChange={(e) => updateMilestone(index, { description: e.target.value })}
                              placeholder="Ceritakan detail menarik atau hasil dari momen ini..."
                              className={cn(
                                "mt-1.5 w-full rounded-lg border bg-surface p-3 text-xs sm:text-sm leading-relaxed transition-colors min-h-[72px]",
                                descError ? "border-red-400 focus:border-red-500" : "border-line-strong"
                              )}
                            />
                            {descError && (
                              <p role="alert" className="mt-1 text-[11px] text-red-700">
                                {descError}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  {/* Add Milestone Button */}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addMilestone}
                    disabled={disabled || form.milestones.length >= 50}
                    className="w-full min-h-11 border-dashed border-line text-forest hover:border-forest/50 hover:bg-ivory/60 font-medium text-xs sm:text-sm"
                  >
                    <Plus className="mr-1.5 size-4" />
                    <span>Tambah Momen Perjalanan Berikutnya</span>
                  </Button>
                </div>
              )}
            </div>
          </Card>
        </fieldset>

        {/* SECTION 3: Real-Time Vertical Timeline Preview */}
        <section aria-labelledby="timeline-preview-heading" className="w-full min-w-0 rounded-xl border border-line/70 bg-surface p-5 sm:p-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-line/50 pb-4">
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-accent">
                Tampilan Publik
              </span>
              <h3 id="timeline-preview-heading" className="mt-1 text-base sm:text-lg font-semibold text-forest">
                Preview Timeline Perjalanan Usaha
              </h3>
            </div>
            <span className="text-xs text-muted">
              {previewMilestones.length} momen siap ditampilkan
            </span>
          </div>

          <div className="mt-6">
            {previewMilestones.length === 0 ? (
              <p className="text-xs sm:text-sm italic text-muted text-center py-6">
                Belum ada milestone yang dapat dipratinjau. Isi tahun dan judul momen di atas untuk melihat alur timeline usahamu.
              </p>
            ) : (
              <ol className="relative ml-2 sm:ml-4 border-l-2 border-soft-green space-y-6 pl-5 sm:pl-7">
                {previewMilestones.map((item, index) => (
                  <li key={`${item.originalIndex}-${index}`} className="relative group">
                    {/* Timeline Node Dot */}
                    <span className="absolute -left-[27px] sm:-left-[35px] top-1 flex size-3.5 items-center justify-center rounded-full bg-forest ring-4 ring-soft-green" />

                    <div>
                      {/* Year Badge */}
                      <span className="inline-block rounded-md bg-soft-green/80 px-2.5 py-0.5 text-xs font-bold text-forest">
                        {item.year || "Tahapan"}
                      </span>

                      {/* Title */}
                      <h4 className="mt-1.5 text-sm sm:text-base font-semibold text-forest">
                        {item.title || "Judul momen belum diisi"}
                      </h4>

                      {/* Description */}
                      {item.description && (
                        <p className="mt-1.5 text-xs sm:text-sm leading-relaxed text-muted whitespace-pre-wrap">
                          {item.description}
                        </p>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </section>

        {/* Action Buttons Bar */}
        <div className="flex flex-wrap items-center gap-3 border-t border-line/60 pt-5">
          <Button
            type="submit"
            disabled={disabled}
            className="min-h-11 bg-forest px-6 text-white hover:bg-forest/90 font-medium text-sm"
          >
            {disabled
              ? "Menyimpan cerita..."
              : creating
              ? "Simpan draft pertama"
              : "Simpan cerita usaha"}
          </Button>

          <Button
            type="button"
            disabled={disabled}
            variant="outline"
            onClick={onPreview}
            className="min-h-11 border-line px-5 text-forest hover:bg-ivory font-medium text-sm"
          >
            <ExternalLink className="mr-1.5 size-3.5" />
            Preview cerita usaha
          </Button>
        </div>
      </form>
    </div>
  );
}
