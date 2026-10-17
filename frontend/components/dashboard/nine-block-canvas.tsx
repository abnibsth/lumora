"use client";

import { useState } from "react";
import { Dialog } from "radix-ui";
import {
  LayoutGrid,
  BookOpen,
  Sparkles,
  Handshake,
  CheckSquare,
  Boxes,
  HeartHandshake,
  Truck,
  Users,
  Receipt,
  Wallet,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Pencil,
  X,
  Check,
  Layers,
  Copy,
  ArrowRight,
} from "lucide-react";
import { BMC_LABELS } from "@/lib/dashboard";
import type { BmcEntry } from "@/types/business";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BMC_BLOCK_DEFINITIONS, type BmcBlockMeta } from "./bmc-guide-data";
import styles from "./bmc-workspace.module.css";

function getBlockIcon(id: string) {
  switch (id) {
    case "partners":
      return <Handshake className="size-4 shrink-0 text-forest" />;
    case "activities":
      return <CheckSquare className="size-4 shrink-0 text-forest" />;
    case "resources":
      return <Boxes className="size-4 shrink-0 text-forest" />;
    case "value":
      return <Sparkles className="size-4 shrink-0 text-forest" />;
    case "relationships":
      return <HeartHandshake className="size-4 shrink-0 text-forest" />;
    case "channels":
      return <Truck className="size-4 shrink-0 text-forest" />;
    case "customers":
      return <Users className="size-4 shrink-0 text-forest" />;
    case "costs":
      return <Receipt className="size-4 shrink-0 text-forest" />;
    case "revenue":
      return <Wallet className="size-4 shrink-0 text-forest" />;
    default:
      return <Sparkles className="size-4 shrink-0 text-forest" />;
  }
}

const gridClassMap: Record<string, string> = {
  partners: styles.blockPartners,
  activities: styles.blockActivities,
  resources: styles.blockResources,
  value: styles.blockValue,
  relationships: styles.blockRelationships,
  channels: styles.blockChannels,
  customers: styles.blockCustomers,
  costs: styles.blockCosts,
  revenue: styles.blockRevenue,
};

export function NineBlockCanvas({
  items,
  disabled,
  onChange,
}: {
  items: BmcEntry[];
  disabled: boolean;
  onChange: (items: BmcEntry[]) => void;
}) {
  const [mode, setMode] = useState<"canvas" | "guide">("canvas");
  const [activeDrawerDef, setActiveDrawerDef] = useState<BmcBlockMeta | null>(null);
  const [drawerValue, setDrawerValue] = useState("");
  const [initialDrawerValue, setInitialDrawerValue] = useState("");
  const [drawerHelpTab, setDrawerHelpTab] = useState<"questions" | "examples" | "tips">("questions");
  const [drawerExampleIndustry, setDrawerExampleIndustry] = useState(0);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const [drawerSaveNotice, setDrawerSaveNotice] = useState<string | null>(null);

  // Guide mode tab state
  const [guideExampleTabs, setGuideExampleTabs] = useState<Record<string, number>>({});

  // Helper: find all occurrences in items matching a given label
  function getMatches(label: string) {
    return items
      .map((item, index) => ({ ...item, index }))
      .filter(
        (item) => item.label.trim().toLowerCase() === label.trim().toLowerCase()
      );
  }

  // Update primary entry for standard BMC block
  function updateStandardBlock(label: string, value: string) {
    const matches = getMatches(label);
    if (matches.length === 0) {
      if (value.trim()) {
        onChange([...items, { label, value }]);
      }
    } else {
      const primaryIndex = matches[0].index;
      if (value.trim()) {
        onChange(
          items.map((item, i) => (i === primaryIndex ? { ...item, value } : item))
        );
      } else {
        // Remove entry when empty so it doesn't fail profile validation
        onChange(items.filter((_, i) => i !== primaryIndex));
      }
    }
  }

  // Update custom or specific entry by its exact array index
  function updateEntry(index: number, patch: Partial<BmcEntry>) {
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item))
    );
  }

  // Delete an entry by index
  function deleteEntry(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }

  // Add a new blank custom block
  function addCustomBlock() {
    if (items.length >= 30) return;
    onChange([...items, { label: "", value: "" }]);
  }

  // Calculate standard completion
  const filledBlocks = BMC_BLOCK_DEFINITIONS.filter((def) => {
    const matches = getMatches(def.label);
    return matches.length > 0 && Boolean(matches[0].value.trim());
  });
  const filledCount = filledBlocks.length;
  const progressPercent = Math.round((filledCount / 9) * 100);

  // Identify custom items and duplicate standard items
  const standardLabelSet = new Set(
    BMC_LABELS.map((l) => l.trim().toLowerCase())
  );

  const occurrencesByLabel: Record<string, number[]> = {};
  items.forEach((item, index) => {
    const norm = item.label.trim().toLowerCase();
    if (!occurrencesByLabel[norm]) occurrencesByLabel[norm] = [];
    occurrencesByLabel[norm].push(index);
  });

  const customEntries = items
    .map((item, index) => ({ ...item, index }))
    .filter((item) => !standardLabelSet.has(item.label.trim().toLowerCase()));

  const duplicateStandardEntries = items
    .map((item, index) => ({ ...item, index }))
    .filter((item) => {
      const norm = item.label.trim().toLowerCase();
      if (!standardLabelSet.has(norm)) return false;
      const indices = occurrencesByLabel[norm] || [];
      return indices.indexOf(item.index) > 0;
    });

  const totalSpecialBlocks = customEntries.length + duplicateStandardEntries.length;

  // Drawer handlers
  function openDrawer(def: BmcBlockMeta) {
    if (disabled) return;
    const matches = getMatches(def.label);
    const currentVal = matches[0]?.value || "";
    setActiveDrawerDef(def);
    setDrawerValue(currentVal);
    setInitialDrawerValue(currentVal);
    setShowDiscardConfirm(false);
    setDrawerSaveNotice(null);
    setDrawerHelpTab("questions");
    setDrawerExampleIndustry(0);
  }

  function handleAttemptClose() {
    if (drawerValue !== initialDrawerValue) {
      setShowDiscardConfirm(true);
    } else {
      setActiveDrawerDef(null);
      setShowDiscardConfirm(false);
    }
  }

  function handleSaveDrawer() {
    if (!activeDrawerDef) return;
    updateStandardBlock(activeDrawerDef.label, drawerValue);
    setInitialDrawerValue(drawerValue);
    setDrawerSaveNotice("Perubahan blok tersimpan di draft!");
    setTimeout(() => {
      setActiveDrawerDef(null);
      setDrawerSaveNotice(null);
      setShowDiscardConfirm(false);
    }, 400);
  }

  function handleDiscardAndClose() {
    setShowDiscardConfirm(false);
    setActiveDrawerDef(null);
  }

  function handleAppendExample(text: string) {
    setDrawerValue((prev) => (prev.trim() ? `${prev}\n- ${text}` : text));
  }

  function scrollToBlock(defId: string) {
    if (mode === "canvas") {
      const def = BMC_BLOCK_DEFINITIONS.find((d) => d.id === defId);
      if (def) openDrawer(def);
    } else {
      const element = document.getElementById(`bmc-target-${defId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        const textarea = element.querySelector("textarea");
        if (textarea) textarea.focus();
      }
    }
  }

  return (
    <div className={styles.container}>
      {/* Top Controls Bar: Title & Mode Switcher */}
      <div className={styles.controlsBar}>
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base font-semibold text-forest">
            Business Model Canvas (BMC)
          </h2>
          <p className="text-xs text-muted">
            {mode === "canvas"
              ? "Klik blok mana pun pada kanvas untuk meninjau dan mengedit melalui panel editor."
              : "Formulir langkah demi langkah lengkap dengan panduan dan contoh untuk pemula."}
          </p>
        </div>

        {/* View Mode Switcher */}
        <div
          className={styles.modeToggleGroup}
          role="tablist"
          aria-label="Mode tampilan BMC"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === "canvas"}
            aria-pressed={mode === "canvas"}
            onClick={() => setMode("canvas")}
            className={`${styles.modeButton} ${
              mode === "canvas" ? styles.modeButtonActive : ""
            }`}
          >
            <LayoutGrid className="size-4 shrink-0" />
            <span>Mode Canvas</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "guide"}
            aria-pressed={mode === "guide"}
            onClick={() => setMode("guide")}
            className={`${styles.modeButton} ${
              mode === "guide" ? styles.modeButtonActive : ""
            }`}
          >
            <BookOpen className="size-4 shrink-0" />
            <span>Mode Panduan</span>
          </button>
        </div>
      </div>

      {/* Progress & Quick Jump Section */}
      <section
        className={styles.progressCard}
        aria-label="Kelengkapan sembilan blok BMC"
      >
        <div className={styles.progressHeader}>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-forest">
              Kelengkapan Canvas Standar:
            </span>
            <span className="text-xs font-medium text-accent">
              {filledCount} dari 9 blok terisi ({progressPercent}%)
            </span>
          </div>
          {filledCount === 9 ? (
            <span className="inline-flex items-center gap-1 rounded bg-soft-green px-2 py-0.5 text-xs font-semibold text-forest">
              <CheckCircle2 className="size-3.5 text-forest" /> Canvas Lengkap
            </span>
          ) : (
            <span className="text-xs text-muted">
              {9 - filledCount} blok belum terisi
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div
          className={styles.progressTrack}
          role="progressbar"
          aria-valuenow={progressPercent}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={`${styles.progressBar} ${
              progressPercent === 100 ? styles.progressBarComplete : ""
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Interactive Quick-Jump Chips */}
        <div className={styles.chipsContainer}>
          <span className="text-[11px] font-medium text-muted">Lompat ke blok:</span>
          {BMC_BLOCK_DEFINITIONS.map((def) => {
            const matches = getMatches(def.label);
            const isFilled = matches.length > 0 && Boolean(matches[0].value.trim());
            return (
              <button
                key={def.id}
                type="button"
                onClick={() => scrollToBlock(def.id)}
                className={`${styles.chip} ${
                  isFilled ? styles.chipFilled : styles.chipEmpty
                }`}
                title={`${def.label}: ${isFilled ? "Sudah terisi" : "Belum diisi"} (klik untuk edit)`}
              >
                {isFilled ? (
                  <CheckCircle2 className="size-3 text-forest" />
                ) : (
                  <span className="size-1.5 rounded-full bg-muted/60" />
                )}
                {def.shortName}
              </button>
            );
          })}
        </div>
      </section>

      {/* VIEW MODE 1: CANONICAL 10-COLUMN BMC GRID OVERVIEW */}
      {mode === "canvas" ? (
        <section aria-label="Layout Canvas Model Bisnis" className="w-full">
          <div className={styles.canvasGridWrapper}>
            <div className={styles.canvasGrid}>
              {BMC_BLOCK_DEFINITIONS.map((def) => {
                const matches = getMatches(def.label);
                const hasMultiple = matches.length > 1;
                const primaryEntry = matches[0];
                const value = primaryEntry?.value || "";
                const isFilled = Boolean(value.trim());
                const charCount = value.length;
                const gridAreaClass = gridClassMap[def.id] || "";
                const isTallBlock =
                  def.id === "partners" || def.id === "value" || def.id === "customers";

                return (
                  <div
                    key={def.id}
                    id={`canvas-block-${def.id}`}
                    role="button"
                    tabIndex={0}
                    onClick={() => openDrawer(def)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        openDrawer(def);
                      }
                    }}
                    className={`${styles.canvasCard} ${gridAreaClass} ${
                      activeDrawerDef?.id === def.id ? styles.canvasCardActive : ""
                    }`}
                    aria-label={`Blok #${def.order}: ${def.label}. Status: ${
                      isFilled ? "Terisi" : "Belum terisi"
                    }. Klik untuk mengedit.`}
                  >
                    {/* Header */}
                    <div className="mb-2.5">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={styles.canvasCardBadge}>
                            #{def.order}
                          </span>
                          <span className="shrink-0">{getBlockIcon(def.id)}</span>
                        </div>

                        <span className={styles.canvasCardEditTrigger}>
                          <Pencil className="size-3" />
                          <span>Edit</span>
                        </span>
                      </div>

                      <h3 className="text-[13px] sm:text-sm font-bold text-forest leading-snug">
                        {def.label}
                      </h3>
                    </div>

                    {/* Content Preview / Empty State */}
                    {hasMultiple ? (
                      <div className="my-auto rounded border border-amber-200 bg-amber-50 p-2 text-[11px] text-amber-900 leading-tight">
                        <div className="flex items-center gap-1 font-semibold text-amber-800 mb-0.5">
                          <AlertCircle className="size-3 shrink-0 text-amber-600" />
                          <span>{matches.length} entri duplikat</span>
                        </div>
                        Kelola di Blok Khusus.
                      </div>
                    ) : isFilled ? (
                      <div
                        className={`${styles.canvasSummaryContent} ${
                          isTallBlock
                            ? styles.canvasSummaryLines7
                            : styles.canvasSummaryLines4
                        }`}
                      >
                        {value}
                      </div>
                    ) : (
                      <div className={styles.canvasEmptyState}>
                        <span className={styles.canvasEmptyPrompt}>
                          + Klik untuk mengisi
                        </span>
                        <span className={styles.canvasEmptyHint}>
                          {def.description}
                        </span>
                      </div>
                    )}

                    {/* Card Footer */}
                    <div className={styles.canvasCardFooter}>
                      <span className="font-medium">
                        {isFilled ? "✓ Terisi" : "Belum diisi"}
                      </span>
                      <span>
                        {isFilled ? `${charCount} kar.` : "Buka editor ↗"}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        /* VIEW MODE 2: STEP-BY-STEP GUIDED FORM FOR BEGINNERS */
        <section className={styles.guideList} aria-label="Mode Panduan Terstruktur">
          <div className="rounded-lg border border-line bg-ivory/60 p-4">
            <h3 className="text-sm font-semibold text-forest">
              Panduan Lengkap Model Bisnis untuk UMKM
            </h3>
            <p className="mt-1 text-xs leading-5 text-muted">
              Isi sembilan blok di bawah ini secara bertahap. Gunakan pertanyaan pemantik dan contoh nyata industri UMKM sebagai inspirasi. Setiap perubahan tersimpan otomatis pada draft.
            </p>
          </div>

          {BMC_BLOCK_DEFINITIONS.map((def) => {
            const matches = getMatches(def.label);
            const hasMultiple = matches.length > 1;
            const primaryEntry = matches[0];
            const value = primaryEntry?.value || "";
            const isFilled = Boolean(value.trim());
            const charCount = value.length;
            const currentTab = guideExampleTabs[def.id] || 0;

            const categoryLabel =
              def.category === "feasibility"
                ? "Kelayakan Operasional"
                : def.category === "desirability"
                ? "Daya Tarik Pasar"
                : "Kelangsungan Finansial";

            const categoryBadgeClass =
              def.category === "feasibility"
                ? styles.badgeFeasibility
                : def.category === "desirability"
                ? styles.badgeDesirability
                : styles.badgeViability;

            return (
              <div
                key={def.id}
                id={`bmc-target-${def.id}`}
                className={styles.guideCard}
              >
                {/* Guide Card Header */}
                <div className={styles.guideCardHeader}>
                  <div className="flex items-center gap-3">
                    <span className="flex size-7 items-center justify-center rounded-full bg-forest text-xs font-bold text-white">
                      {def.order}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-forest">
                          {def.label}
                        </h4>
                        <span
                          className={`${styles.guideCategoryBadge} ${categoryBadgeClass}`}
                        >
                          {categoryLabel}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-0.5">
                        {def.description}
                      </p>
                    </div>
                  </div>

                  <div>
                    {isFilled ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-soft-green px-2.5 py-1 text-xs font-semibold text-forest">
                        <CheckCircle2 className="size-3.5 text-forest" />
                        Terisi
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-ivory px-2.5 py-1 text-xs font-medium text-muted">
                        Belum diisi
                      </span>
                    )}
                  </div>
                </div>

                {/* Guide Card Body: Split Explanations & Editor */}
                <div className={styles.guideCardBody}>
                  {/* Left Column: Context, Questions, Real Examples, Tips */}
                  <div className={styles.guideHelpColumn}>
                    {/* Guiding Questions */}
                    <div className={styles.guideQuestionBox}>
                      <p className="text-xs font-bold text-forest uppercase tracking-wider mb-1.5">
                        ❓ Pertanyaan Pemantik
                      </p>
                      <ul className="list-disc pl-4 space-y-1 text-xs leading-5 text-forest/90">
                        {def.guidingQuestions.map((q, idx) => (
                          <li key={idx}>{q}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Real UMKM Examples with tabs */}
                    <div className={styles.guideExamplesBox}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-bold text-forest">
                          Contoh Nyata UMKM:
                        </p>
                        <div className="flex gap-1">
                          {def.examples.map((ex, idx) => (
                            <button
                              key={ex.businessType}
                              type="button"
                              onClick={() =>
                                setGuideExampleTabs((prev) => ({
                                  ...prev,
                                  [def.id]: idx,
                                }))
                              }
                              className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                currentTab === idx
                                  ? "bg-forest text-white"
                                  : "bg-ivory text-muted hover:text-forest"
                              }`}
                            >
                              {ex.businessType}
                            </button>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs italic leading-5 text-forest/80 bg-white/70 p-2.5 rounded border border-line/60">
                        &ldquo;{def.examples[currentTab]?.text}&rdquo;
                      </p>
                    </div>

                    {/* Pro Tip */}
                    <div className="rounded border-l-2 border-lime bg-surface p-2 text-xs text-muted">
                      <span className="font-semibold text-forest">💡 Tips: </span>
                      {def.tips}
                    </div>
                  </div>

                  {/* Right Column: Practical Textarea Editor */}
                  <div className="flex flex-col">
                    <Label
                      htmlFor={`guide-input-${def.id}`}
                      className="text-xs font-semibold text-forest mb-2"
                    >
                      Tuliskan {def.label} Usahamu:
                    </Label>

                    {hasMultiple ? (
                      <div className="my-auto rounded-md bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
                        <div className="flex items-center gap-1.5 font-semibold text-amber-800">
                          <AlertCircle className="size-4 shrink-0 text-amber-600" />
                          <span>Duplikat label ({matches.length} blok)</span>
                        </div>
                        <p className="mt-1 leading-5">
                          Terdapat {matches.length} data dengan nama &quot;{def.label}&quot;. Kelola di bagian Blok Khusus di bawah agar data tidak tertimpa.
                        </p>
                      </div>
                    ) : (
                      <textarea
                        id={primaryEntry ? `bmc-value-${primaryEntry.index}` : `guide-input-${def.id}`}
                        disabled={disabled || (matches.length === 0 && items.length >= 30)}
                        maxLength={1000}
                        value={value}
                        rows={7}
                        placeholder={def.placeholder}
                        onChange={(e) => updateStandardBlock(def.label, e.target.value)}
                        className="flex-1 min-h-[160px] w-full rounded-lg border border-line-strong bg-surface p-3 text-sm leading-6 text-ink focus:border-forest focus:outline-none focus:bg-white disabled:opacity-60 transition-colors"
                      />
                    )}

                    <div className="flex items-center justify-between mt-2 text-xs text-muted">
                      <span>
                        {value.trim()
                          ? "Data terisi dan siap disimpan"
                          : "Belum ada data pada blok ini"}
                      </span>
                      <span
                        className={
                          charCount > 900
                            ? "font-semibold text-red-600"
                            : charCount > 700
                            ? "text-amber-600"
                            : "text-muted"
                        }
                      >
                        {charCount}/1000 karakter
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}

      {/* DISTINCT SECTION: INFORMASI BISNIS TAMBAHAN / BLOK KHUSUS & EDITOR LANJUTAN */}
      <section
        className={styles.customSection}
        aria-label="Informasi Bisnis Tambahan dan Blok Khusus"
      >
        <div className={styles.customSectionHeader}>
          <div>
            <div className="flex items-center gap-2">
              <Layers className="size-4 text-forest" />
              <h3 className="text-base font-semibold text-forest">
                Informasi Bisnis Tambahan & Blok Khusus
              </h3>
              {totalSpecialBlocks > 0 && (
                <span className="rounded-full bg-soft-green px-2 py-0.5 text-xs font-semibold text-forest">
                  {totalSpecialBlocks} blok
                </span>
              )}
            </div>
            <p className="mt-1 text-xs leading-5 text-muted max-w-2xl">
              Blok khusus di luar 9 blok standar BMC (misalnya: Dampak Lingkungan, Sertifikasi, Rencana Ekspansi, atau label kustom lainnya). Data di bagian ini dipertahankan utuh dan tidak digabung dengan blok standar.
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            disabled={disabled || items.length >= 30}
            onClick={addCustomBlock}
            className="min-h-10 border-line px-3 text-xs font-medium text-forest shrink-0"
          >
            <Plus className="size-3.5 mr-1" />
            Tambah Blok Khusus
          </Button>
        </div>

        {/* Warning if duplicate standard labels exist */}
        {duplicateStandardEntries.length > 0 && (
          <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50/80 p-3.5 text-xs text-amber-900">
            <div className="flex items-center gap-2 font-semibold text-amber-800">
              <AlertCircle className="size-4 text-amber-600 shrink-0" />
              <span>Ditemukan duplikasi label standar pada data bisnismu</span>
            </div>
            <p className="mt-1 leading-relaxed">
              Terdapat data dengan nama blok standar yang berulang. Demi keamanan, data tidak dihapus atau digabung otomatis. Kamu dapat menyesuaikan nama label menjadi lebih spesifik atau menghapusnya jika sudah tidak relevan.
            </p>
          </div>
        )}

        {/* Custom Entries & Duplicate Entries List */}
        {customEntries.length === 0 && duplicateStandardEntries.length === 0 ? (
          <div className="rounded-lg border border-dashed border-line bg-surface/60 p-6 text-center text-xs text-muted">
            <p className="font-medium text-forest">Belum ada blok informasi tambahan.</p>
            <p className="mt-1">
              Seluruh data model bisnis saat ini menggunakan 9 blok standar di atas. Klik &quot;Tambah Blok Khusus&quot; jika butuh mencatat variabel bisnis lain.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Render Duplicate Standard Entries First with high visibility */}
            {duplicateStandardEntries.map((item) => (
              <fieldset
                key={item.index}
                disabled={disabled}
                className="rounded-lg border border-amber-300 bg-amber-50/40 p-4"
              >
                <legend className="px-2 text-xs font-semibold text-amber-800">
                  Duplikat Label Standar (Blok #{item.index + 1})
                </legend>
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Label
                      htmlFor={`bmc-label-${item.index}`}
                      className="text-xs font-semibold text-forest"
                    >
                      Nama Blok
                    </Label>
                    <Input
                      id={`bmc-label-${item.index}`}
                      required
                      maxLength={100}
                      value={item.label}
                      onChange={(e) =>
                        updateEntry(item.index, { label: e.target.value })
                      }
                      className="mt-1 min-h-10 border-amber-300 bg-white text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Hapus blok duplikat ${item.label || item.index + 1}`}
                    onClick={() => deleteEntry(item.index)}
                    className="size-10 text-red-700 hover:bg-red-50 hover:text-red-800"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="mt-3">
                  <Label
                    htmlFor={`bmc-value-${item.index}`}
                    className="text-xs font-semibold text-forest"
                  >
                    Isi Blok
                  </Label>
                  <textarea
                    id={`bmc-value-${item.index}`}
                    required
                    maxLength={1000}
                    value={item.value}
                    rows={3}
                    onChange={(e) =>
                      updateEntry(item.index, { value: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-amber-300 bg-white p-2.5 text-xs leading-5"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-muted">
                    <span>Disimpan sebagai entri terpisah</span>
                    <span>{item.value.length}/1000</span>
                  </div>
                </div>
              </fieldset>
            ))}

            {/* Render Normal Custom Entries */}
            {customEntries.map((item) => (
              <fieldset
                key={item.index}
                disabled={disabled}
                className="rounded-lg border border-line bg-surface p-4"
              >
                <legend className="px-2 text-xs font-medium text-muted">
                  Blok Khusus #{item.index + 1}
                </legend>
                <div className="flex items-end gap-2">
                  <div className="min-w-0 flex-1">
                    <Label
                      htmlFor={`bmc-label-${item.index}`}
                      className="text-xs font-semibold text-forest"
                    >
                      Nama Blok Khusus
                    </Label>
                    <Input
                      id={`bmc-label-${item.index}`}
                      required
                      maxLength={100}
                      placeholder="Contoh: Dampak Lingkungan / Sertifikasi"
                      value={item.label}
                      onChange={(e) =>
                        updateEntry(item.index, { label: e.target.value })
                      }
                      className="mt-1 min-h-10 border-line bg-white text-xs"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    aria-label={`Hapus blok khusus ${item.label || item.index + 1}`}
                    onClick={() => deleteEntry(item.index)}
                    className="size-10 text-red-700 hover:bg-red-50 hover:text-red-800"
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>

                <div className="mt-3">
                  <Label
                    htmlFor={`bmc-value-${item.index}`}
                    className="text-xs font-semibold text-forest"
                  >
                    Isi Blok Khusus
                  </Label>
                  <textarea
                    id={`bmc-value-${item.index}`}
                    required
                    maxLength={1000}
                    value={item.value}
                    rows={3}
                    placeholder="Tuliskan keterangan detail untuk blok khusus ini..."
                    onChange={(e) =>
                      updateEntry(item.index, { value: e.target.value })
                    }
                    className="mt-1 w-full rounded-lg border border-line bg-white p-2.5 text-xs leading-5"
                  />
                  <div className="mt-1 flex justify-between text-[11px] text-muted">
                    <span>Maksimal 1000 karakter</span>
                    <span>{item.value.length}/1000</span>
                  </div>
                </div>
              </fieldset>
            ))}
          </div>
        )}

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-line/60 pt-3 text-xs text-muted">
          <span>
            Kapasitas keseluruhan: {items.length}/30 blok (termasuk blok standar)
          </span>
          {items.length >= 30 && (
            <span className="font-semibold text-amber-700">
              Batas maksimum 30 blok tercapai.
            </span>
          )}
        </div>
      </section>

      {/* SIDE PANEL / DRAWER EDITOR FOR MODE CANVAS */}
      <Dialog.Root
        open={Boolean(activeDrawerDef)}
        onOpenChange={(open) => {
          if (!open) handleAttemptClose();
        }}
      >
        <Dialog.Portal>
          <Dialog.Overlay className={styles.drawerOverlay} />
          <Dialog.Content
            className={styles.drawerContent}
            aria-describedby="drawer-description"
          >
            {activeDrawerDef && (
              <>
                {/* Drawer Header */}
                <header className={styles.drawerHeader}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="flex size-7 items-center justify-center rounded-md bg-forest text-xs font-bold text-white shrink-0">
                      #{activeDrawerDef.order}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Dialog.Title className="text-base sm:text-lg font-bold text-forest truncate">
                          {activeDrawerDef.label}
                        </Dialog.Title>
                        <span
                          className={`${styles.guideCategoryBadge} ${
                            activeDrawerDef.category === "feasibility"
                              ? styles.badgeFeasibility
                              : activeDrawerDef.category === "desirability"
                              ? styles.badgeDesirability
                              : styles.badgeViability
                          }`}
                        >
                          {activeDrawerDef.category === "feasibility"
                            ? "Kelayakan"
                            : activeDrawerDef.category === "desirability"
                            ? "Pasar"
                            : "Finansial"}
                        </span>
                      </div>
                      <Dialog.Description
                        id="drawer-description"
                        className="text-xs text-muted truncate mt-0.5"
                      >
                        {activeDrawerDef.description}
                      </Dialog.Description>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAttemptClose}
                    className="flex size-9 items-center justify-center rounded-lg text-forest hover:bg-soft-green transition-colors shrink-0"
                    aria-label="Tutup panel editor"
                  >
                    <X className="size-5" />
                  </button>
                </header>

                {/* Drawer Body */}
                <div className={styles.drawerBody}>
                  {/* Unsaved Discard Prompt if user tried to close */}
                  {showDiscardConfirm && (
                    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 animate-fadeIn">
                      <p className="font-semibold text-amber-800">
                        Perubahan pada blok ini belum disimpan.
                      </p>
                      <p className="mt-1 leading-relaxed">
                        Jika kamu menutup panel sekarang, perubahan terbaru pada blok ini akan dibuang.
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => setShowDiscardConfirm(false)}
                          className="bg-forest text-white text-xs h-8 px-3"
                        >
                          Lanjutkan Mengedit
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDiscardAndClose}
                          className="border-amber-300 text-amber-900 text-xs h-8 px-3 hover:bg-amber-100"
                        >
                          Buang & Tutup
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Save Notice Feedback */}
                  {drawerSaveNotice && (
                    <div className="rounded-lg border border-green-200 bg-soft-green p-3 text-xs font-semibold text-forest flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="size-4 text-forest shrink-0" />
                      <span>{drawerSaveNotice}</span>
                    </div>
                  )}

                  {/* Spacious Textarea Editor */}
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <Label
                        htmlFor="bmc-drawer-textarea"
                        className="text-xs font-semibold text-forest"
                      >
                        Isi {activeDrawerDef.label} Usahamu:
                      </Label>
                      <span
                        className={
                          drawerValue.length > 900
                            ? "text-xs font-semibold text-red-600"
                            : drawerValue.length > 700
                            ? "text-xs text-amber-600"
                            : "text-xs text-muted"
                        }
                      >
                        {drawerValue.length}/1000 karakter
                      </span>
                    </div>

                    <textarea
                      id="bmc-drawer-textarea"
                      value={drawerValue}
                      onChange={(e) => {
                        setDrawerValue(e.target.value);
                        if (showDiscardConfirm) setShowDiscardConfirm(false);
                      }}
                      maxLength={1000}
                      rows={8}
                      placeholder={activeDrawerDef.placeholder}
                      className="w-full rounded-lg border border-line-strong bg-white p-3.5 text-sm leading-relaxed text-ink focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest transition-colors min-h-[190px] resize-y"
                    />

                    <p className="text-[11px] text-muted leading-relaxed">
                      💡 Tuliskan poin-poin utama secara ringkas. Kamu juga dapat memanfaatkan panel bantuan di bawah untuk melihat contoh nyata dan pertanyaan pemantik.
                    </p>
                  </div>

                  {/* Dedicated Guidance & Help Panel */}
                  <div className={styles.drawerHelpBox}>
                    {/* Tabs Bar */}
                    <div className={styles.drawerHelpHeader} role="tablist">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={drawerHelpTab === "questions"}
                        onClick={() => setDrawerHelpTab("questions")}
                        className={`${styles.drawerHelpTab} ${
                          drawerHelpTab === "questions"
                            ? styles.drawerHelpTabActive
                            : ""
                        }`}
                      >
                        ❓ Pertanyaan Panduan
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={drawerHelpTab === "examples"}
                        onClick={() => setDrawerHelpTab("examples")}
                        className={`${styles.drawerHelpTab} ${
                          drawerHelpTab === "examples"
                            ? styles.drawerHelpTabActive
                            : ""
                        }`}
                      >
                        📋 Contoh Nyata
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={drawerHelpTab === "tips"}
                        onClick={() => setDrawerHelpTab("tips")}
                        className={`${styles.drawerHelpTab} ${
                          drawerHelpTab === "tips"
                            ? styles.drawerHelpTabActive
                            : ""
                        }`}
                      >
                        💡 Tips Menulis
                      </button>
                    </div>

                    {/* Tab Content 1: Questions */}
                    {drawerHelpTab === "questions" && (
                      <div className={styles.drawerHelpContent}>
                        <p className="font-semibold text-forest mb-2">
                          Gunakan pertanyaan berikut untuk menyusun isi blok ini:
                        </p>
                        <ul className="list-disc pl-4 space-y-1.5 text-xs text-forest/90 leading-relaxed">
                          {activeDrawerDef.guidingQuestions.map((q, idx) => (
                            <li key={idx}>{q}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Tab Content 2: Real UMKM Examples */}
                    {drawerHelpTab === "examples" && (
                      <div className={styles.drawerHelpContent}>
                        <div className="flex items-center justify-between gap-1 mb-2">
                          <span className="font-semibold text-forest text-xs">
                            Pilih sektor bisnis:
                          </span>
                          <div className="flex gap-1">
                            {activeDrawerDef.examples.map((ex, idx) => (
                              <button
                                key={ex.businessType}
                                type="button"
                                onClick={() => setDrawerExampleIndustry(idx)}
                                className={`rounded px-2 py-0.5 text-[11px] font-medium transition-colors ${
                                  drawerExampleIndustry === idx
                                    ? "bg-forest text-white"
                                    : "bg-ivory text-muted hover:text-forest"
                                }`}
                              >
                                {ex.businessType}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="rounded border border-line bg-white p-3 text-xs italic text-forest/80 leading-relaxed">
                          &ldquo;{activeDrawerDef.examples[drawerExampleIndustry]?.text}&rdquo;
                        </div>

                        <div className="mt-2.5 flex justify-end">
                          <button
                            type="button"
                            onClick={() =>
                              handleAppendExample(
                                activeDrawerDef.examples[drawerExampleIndustry]?.text || ""
                              )
                            }
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-forest hover:text-accent transition-colors"
                          >
                            <Copy className="size-3" />
                            <span>+ Salin contoh ke kolom input</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Tab Content 3: Tips */}
                    {drawerHelpTab === "tips" && (
                      <div className={styles.drawerHelpContent}>
                        <p className="font-semibold text-forest mb-1.5">
                          Saran dari Praktisi Bisnis:
                        </p>
                        <p className="text-xs text-forest/90 leading-relaxed">
                          {activeDrawerDef.tips}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Drawer Sticky Footer */}
                <footer className={styles.drawerFooter}>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAttemptClose}
                    className="min-h-10 border-line text-xs font-medium text-forest px-4"
                  >
                    Batal
                  </Button>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted hidden sm:inline">
                      {drawerValue !== initialDrawerValue
                        ? "Ada perubahan belum disimpan"
                        : "Data sinkron"}
                    </span>
                    <Button
                      type="button"
                      onClick={handleSaveDrawer}
                      className="min-h-10 bg-forest hover:bg-deep-forest text-white text-xs font-semibold px-4 flex items-center gap-1.5"
                    >
                      <Check className="size-3.5" />
                      <span>Simpan Blok</span>
                    </Button>
                  </div>
                </footer>
              </>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
  );
}


