"use client";

import { useState, useMemo } from "react";
import {
  CircleHelp,
  Search,
  Filter,
  Eye,
  CheckCircle2,
  X,
  Info,
  Sparkles,
  Layers,
  FileText,
  Tag,
  LayoutList,
  SlidersHorizontal,
} from "lucide-react";
import { faqItems, type FaqItem } from "@/data/faq";
import { faqSection } from "@/data/landing";
import type { AdminOverview } from "@/lib/api";
import { Accordion } from "@/components/ui/accordion";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";

export type FaqTopic =
  | "Platform & Model"
  | "Legalitas & Onboarding"
  | "Teknologi & AI"
  | "Investasi & Biaya";

export interface EnrichedFaqItem extends FaqItem {
  id: string;
  order: number;
  topic: FaqTopic;
  targetAudience: string;
  rationale: string;
}

// Deterministic topic, order, and PRD 10.12 rationale metadata mapping for the 6 curated FAQ items
export const ENRICHED_FAQ_ITEMS: EnrichedFaqItem[] = [
  {
    id: "faq-1",
    order: 1,
    question: faqItems[0]?.question || "Apa itu LUMORA?",
    answer: faqItems[0]?.answer || "",
    topic: "Platform & Model",
    targetAudience: "Pelaku UMKM, Calon Mitra, & Publik",
    rationale:
      "Menjelaskan positioning platform sebagai digital pitching & discovery hub, bukan sekadar marketplace ritel atau media sosial biasa.",
  },
  {
    id: "faq-2",
    order: 2,
    question:
      faqItems[1]?.question || "Apakah LUMORA platform crowdfunding?",
    answer: faqItems[1]?.answer || "",
    topic: "Platform & Model",
    targetAudience: "Calon Investor & Pelaku Usaha",
    rationale:
      "Menegaskan batas kepatuhan regulasi finansial bahwa LUMORA adalah alat bantu perkenalan (pitching) dan tidak memproses dana investasi langsung.",
  },
  {
    id: "faq-3",
    order: 3,
    question: faqItems[2]?.question || "Apakah UMKM harus berbadan hukum?",
    answer: faqItems[2]?.answer || "",
    topic: "Legalitas & Onboarding",
    targetAudience: "Usaha Mikro, Kecil, & Perorangan",
    rationale:
      "Memberikan kepastian aksesibilitas bagi usaha mikro informal agar dapat mulai menyusun profil bisnis tanpa hambatan birokrasi legalitas awal.",
  },
  {
    id: "faq-4",
    order: 4,
    question: faqItems[3]?.question || "Apa fungsi AI di LUMORA?",
    answer: faqItems[3]?.answer || "",
    topic: "Teknologi & AI",
    targetAudience: "Pelaku UMKM Pengguna Lumora AI",
    rationale:
      "Menjelaskan peran asisten Lumora AI dalam menyusun draf profil dan Business Model Canvas (BMC) dengan kendali sunting tetap di tangan pengguna.",
  },
  {
    id: "faq-5",
    order: 5,
    question:
      faqItems[4]?.question ||
      "Apakah LUMORA menentukan bisnis yang layak diinvestasikan?",
    answer: faqItems[4]?.answer || "",
    topic: "Investasi & Biaya",
    targetAudience: "Calon Mitra, Pemodal, & Publik",
    rationale:
      "Menjelaskan netralitas platform yang tidak bertindak sebagai penasihat keuangan atau lembaga pemeringkat kelayakan investasi.",
  },
  {
    id: "faq-6",
    order: 6,
    question: faqItems[5]?.question || "Apakah menggunakan LUMORA gratis?",
    answer: faqItems[5]?.answer || "",
    topic: "Investasi & Biaya",
    targetAudience: "Semua Pengguna Terdaftar",
    rationale:
      "Transparansi model biaya fase MVP untuk mendorong adopsi awal pelaku UMKM lokal tanpa friksi biaya berlangganan di muka.",
  },
];

const FAQ_TOPICS: FaqTopic[] = [
  "Platform & Model",
  "Legalitas & Onboarding",
  "Teknologi & AI",
  "Investasi & Biaya",
];

interface FaqManagementViewProps {
  overview?: AdminOverview;
}

export default function FaqManagementView({}: FaqManagementViewProps) {
  // Filters & Search State
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTopic, setSelectedTopic] = useState<string>("Semua");
  const [viewMode, setViewMode] = useState<"table" | "accordion">("table");

  // Drawer Detail State
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedFaq, setSelectedFaq] = useState<EnrichedFaqItem | null>(null);

  // Filter items based on search and topic
  const filteredFaqs = useMemo(() => {
    return ENRICHED_FAQ_ITEMS.filter((item) => {
      const matchesTopic =
        selectedTopic === "Semua" || item.topic === selectedTopic;
      const term = searchTerm.trim().toLowerCase();
      const matchesSearch =
        !term ||
        item.question.toLowerCase().includes(term) ||
        item.answer.toLowerCase().includes(term) ||
        item.topic.toLowerCase().includes(term);

      return matchesTopic && matchesSearch;
    });
  }, [searchTerm, selectedTopic]);

  // Prepared Accordion Items for Public Preview
  const accordionItems = useMemo(() => {
    return filteredFaqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    }));
  }, [filteredFaqs]);

  // Statistics strictly derived from actual data
  const stats = useMemo(() => {
    const total = ENRICHED_FAQ_ITEMS.length;
    const totalChars = ENRICHED_FAQ_ITEMS.reduce(
      (acc, item) => acc + item.answer.length,
      0
    );
    const avgChars = total > 0 ? Math.round(totalChars / total) : 0;
    const topicCount = FAQ_TOPICS.length;

    return {
      total,
      avgChars,
      topicCount,
    };
  }, []);

  // Handle opening drawer
  const openDetailDrawer = (faq: EnrichedFaqItem) => {
    setSelectedFaq(faq);
    setDrawerOpen(true);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedTopic("Semua");
  };

  // Helper for topic badge colors
  const getTopicBadgeStyle = (topic: FaqTopic) => {
    switch (topic) {
      case "Platform & Model":
        return "border-[#123f32]/20 bg-[#e7efe9] text-[#123f32]";
      case "Legalitas & Onboarding":
        return "border-blue-200 bg-blue-50 text-blue-900";
      case "Teknologi & AI":
        return "border-purple-200 bg-purple-50 text-purple-900";
      case "Investasi & Biaya":
        return "border-amber-200 bg-amber-50 text-amber-900";
      default:
        return "border-[#d8d8cf] bg-white text-[#526059]";
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Title Section */}
      <header className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-5 shadow-xs sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#123f32]/10 px-2.5 py-0.5 font-semibold text-[#123f32]">
                <CircleHelp className="size-3" />
                FAQ
              </span>
              <span className="inline-flex items-center gap-1 text-[#526059]">
                • Basis Pengetahuan & Tanya Jawab Produk
              </span>
            </div>

            <h1 className="mt-2 text-2xl font-bold tracking-tight text-[#123f32] sm:text-3xl">
              Katalog & Manajemen FAQ
            </h1>
            <p className="mt-1 text-xs text-[#526059] sm:text-sm max-w-3xl leading-relaxed">
              Tinjau butir pertanyaan dan jawaban kurasi PRD platform mengenai positioning LUMORA, batasan crowdfunding, onboarding tanpa syarat badan hukum, dan peran Lumora AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-white px-3.5 py-2 text-xs font-semibold text-[#123f32] shadow-2xs">
              <span className="size-2 rounded-full bg-[#b7df68]" />
              <span>Sumber Data: Repositori Statis (Read-Only)</span>
            </span>
          </div>
        </div>

        {/* 2. Metrics & Stat Cards (Strictly Accurate & Free from Dummy Data) */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-5 border-t border-[#d8d8cf]/60">
          {/* Stat 1: Total Pertanyaan */}
          <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-[#526059]">
              <span>Total Butir FAQ</span>
              <CircleHelp className="size-3.5 text-[#123f32]" />
            </div>
            <p className="mt-2 text-xl font-bold text-[#123f32]">{stats.total}</p>
            <p className="text-[11px] text-[#71827a] mt-0.5">
              Pertanyaan aktif di repositori
            </p>
          </div>

          {/* Stat 2: Topik Pembahasan */}
          <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-blue-800">
              <span>Topik Pembahasan</span>
              <Layers className="size-3.5 text-blue-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-blue-950">
              {stats.topicCount}
            </p>
            <p className="text-[11px] text-blue-700/80 mt-0.5">
              Platform, Legal, AI, Investasi
            </p>
          </div>

          {/* Stat 3: Rata-rata Panjang Jawaban */}
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-emerald-800">
              <span>Rerata Panjang Jawaban</span>
              <FileText className="size-3.5 text-emerald-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-emerald-950">
              ~{stats.avgChars}{" "}
              <span className="text-xs font-normal text-emerald-800">karakter</span>
            </p>
            <p className="text-[11px] text-emerald-700/80 mt-0.5">
              Ringkas & komitmen PRD 10.12
            </p>
          </div>

          {/* Stat 4: Komponen Publik Siap */}
          <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-3.5 shadow-2xs">
            <div className="flex items-center justify-between text-xs text-amber-800">
              <span>Komponen Publik</span>
              <CheckCircle2 className="size-3.5 text-amber-700" />
            </div>
            <p className="mt-2 text-xl font-bold text-amber-950">1 Siap</p>
            <p className="text-[11px] text-amber-700/80 mt-0.5">
              FaqSection (Radix Accordion)
            </p>
          </div>
        </div>
      </header>

      {/* 3. Search, Filter Bar, & View Mode Switcher */}
      <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-4 shadow-xs sm:p-5 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-[#71827a]" />
            <input
              id="admin-faq-search"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari pertanyaan, kata kunci, atau jawaban..."
              className="w-full rounded-xl border border-[#d8d8cf] bg-white py-2.5 pl-10 pr-10 text-xs sm:text-sm text-[#123f32] placeholder-[#71827a] outline-hidden focus:border-[#123f32] focus:ring-2 focus:ring-[#123f32]/10 transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#71827a] hover:bg-[#e7efe9] hover:text-[#123f32]"
                aria-label="Hapus pencarian"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {/* View Mode Switcher & Reset */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <div className="flex rounded-xl border border-[#d8d8cf] bg-white p-1 shadow-2xs shrink-0">
              <button
                type="button"
                id="admin-faq-view-table"
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "table"
                    ? "bg-[#123f32] text-white shadow-2xs"
                    : "text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
                }`}
              >
                <LayoutList className="size-3.5" />
                <span>Tabel Direktori</span>
              </button>
              <button
                type="button"
                id="admin-faq-view-accordion"
                onClick={() => setViewMode("accordion")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  viewMode === "accordion"
                    ? "bg-[#123f32] text-white shadow-2xs"
                    : "text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
                }`}
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Pratinjau Publik</span>
              </button>
            </div>

            {(searchTerm || selectedTopic !== "Semua") && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-[#d8d8cf] bg-white px-3 py-2 text-xs font-medium text-[#71827a] hover:bg-[#e7efe9] hover:text-[#123f32] transition-colors"
                title="Reset pencarian dan filter"
              >
                <X className="size-3" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Topic Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="mr-1 inline-flex items-center gap-1 text-xs font-semibold text-[#526059] shrink-0">
            <Filter className="size-3" />
            Topik:
          </span>
          <button
            type="button"
            onClick={() => setSelectedTopic("Semua")}
            className={`shrink-0 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
              selectedTopic === "Semua"
                ? "bg-[#123f32] text-white shadow-2xs"
                : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
            }`}
          >
            Semua Topik ({ENRICHED_FAQ_ITEMS.length})
          </button>
          {FAQ_TOPICS.map((topic) => {
            const count = ENRICHED_FAQ_ITEMS.filter(
              (item) => item.topic === topic
            ).length;
            return (
              <button
                key={topic}
                type="button"
                onClick={() => setSelectedTopic(topic)}
                className={`shrink-0 inline-flex items-center gap-1 rounded-xl px-3 py-1.5 text-xs font-medium transition-colors ${
                  selectedTopic === topic
                    ? "bg-[#123f32] text-white shadow-2xs"
                    : "border border-[#d8d8cf] bg-white text-[#526059] hover:bg-[#e7efe9] hover:text-[#123f32]"
                }`}
              >
                <span>{topic}</span>
                <span className="text-[10px] opacity-80">({count})</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* 4. Main Content: Table View vs Accordion View */}
      {filteredFaqs.length === 0 ? (
        // Empty State
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-12 text-center shadow-xs">
          <div className="mx-auto max-w-sm space-y-3">
            <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-[#123f32]/10 text-[#123f32]">
              <CircleHelp className="size-6" />
            </div>
            <h3 className="text-base font-bold text-[#123f32]">
              Tidak ada butir FAQ ditemukan
            </h3>
            <p className="text-xs text-[#526059] leading-relaxed">
              Tidak ada pertanyaan atau jawaban yang cocok dengan kata kunci &ldquo;{searchTerm}&rdquo;
              {selectedTopic !== "Semua" && ` pada topik "${selectedTopic}"`}.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="mt-2 inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-white px-3.5 py-2 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors"
            >
              <X className="size-3.5" />
              <span>Reset Semua Filter</span>
            </button>
          </div>
        </section>
      ) : viewMode === "table" ? (
        // Mode 1: Table View
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#f0eee6] border-b border-[#d8d8cf]">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[60px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    No
                  </TableHead>
                  <TableHead className="w-[280px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    Pertanyaan
                  </TableHead>
                  <TableHead className="w-[170px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    Topik Pembahasan
                  </TableHead>
                  <TableHead className="min-w-[320px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    Jawaban Resmi
                  </TableHead>
                  <TableHead className="w-[100px] py-3.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    Panjang
                  </TableHead>
                  <TableHead className="w-[130px] py-3.5 text-right text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    Aksi
                  </TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredFaqs.map((faq) => (
                  <TableRow
                    key={faq.id}
                    className="border-b border-[#e8e4d9] hover:bg-[#f5f2e9]/60 transition-colors"
                  >
                    {/* 1. Order Number */}
                    <TableCell className="py-4 align-top">
                      <span className="inline-flex size-7 items-center justify-center rounded-lg bg-white border border-[#d8d8cf] text-xs font-bold font-mono text-[#123f32] shadow-2xs">
                        #{faq.order}
                      </span>
                    </TableCell>

                    {/* 2. Question Title */}
                    <TableCell className="py-4 align-top">
                      <button
                        type="button"
                        onClick={() => openDetailDrawer(faq)}
                        className="text-left font-bold text-sm text-[#123f32] hover:underline leading-snug"
                      >
                        {faq.question}
                      </button>
                    </TableCell>

                    {/* 3. Topic Badge */}
                    <TableCell className="py-4 align-top">
                      <Badge
                        variant="outline"
                        className={`font-semibold text-[11px] whitespace-nowrap ${getTopicBadgeStyle(
                          faq.topic
                        )}`}
                      >
                        {faq.topic}
                      </Badge>
                    </TableCell>

                    {/* 4. Answer Excerpt */}
                    <TableCell className="py-4 align-top">
                      <p className="line-clamp-2 text-xs leading-relaxed text-[#2d3832]">
                        {faq.answer}
                      </p>
                    </TableCell>

                    {/* 5. Character Count */}
                    <TableCell className="py-4 align-top">
                      <span className="text-xs text-[#71827a] font-mono">
                        {faq.answer.length} kar
                      </span>
                    </TableCell>

                    {/* 6. Action Button */}
                    <TableCell className="py-4 align-top text-right">
                      <button
                        type="button"
                        id={`admin-faq-detail-${faq.id}`}
                        onClick={() => openDetailDrawer(faq)}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[#d8d8cf] bg-white px-3 py-1.5 text-xs font-semibold text-[#123f32] hover:bg-[#e7efe9] transition-colors shadow-2xs"
                        title="Buka detail pertanyaan dan penjelasan"
                      >
                        <Eye className="size-3.5" />
                        <span>Lihat Detail</span>
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Footer note */}
          <div className="border-t border-[#d8d8cf] bg-[#f0eee6]/60 p-4 text-xs text-[#526059]">
            Menampilkan <span className="font-semibold text-[#123f32]">{filteredFaqs.length}</span> dari total{" "}
            <span className="font-semibold text-[#123f32]">{ENRICHED_FAQ_ITEMS.length}</span> butir pertanyaan kurasi.
          </div>
        </section>
      ) : (
        // Mode 2: Interactive Public Accordion Preview
        <section className="rounded-2xl border border-[#d8d8cf] bg-[#fbfaf6] p-6 sm:p-8 shadow-xs">
          <div className="max-w-2xl mx-auto text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#123f32]/10 px-3 py-1 text-xs font-semibold text-[#123f32]">
              <Sparkles className="size-3" />
              Pratinjau Komponen Publik
            </span>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[#123f32]">
              {faqSection.heading}
            </h2>
            <p className="text-xs sm:text-sm text-[#526059] leading-relaxed">
              {faqSection.description}
            </p>
          </div>

          <div className="mt-8 max-w-3xl mx-auto rounded-xl border border-[#d8d8cf] bg-white p-4 sm:p-6 shadow-2xs">
            <Accordion items={accordionItems} />
          </div>

          <div className="mt-6 text-center text-[11px] text-[#71827a]">
            *Pratinjau interaktif menggunakan modul <code>@/components/ui/accordion</code> yang sama dengan halaman publik LUMORA.
          </div>
        </section>
      )}

      {/* 5. Detail Drawer: FAQ Full Q&A & Product Rationale */}
      <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-xl lg:max-w-2xl overflow-y-auto bg-[#fbfaf6] p-0 border-l border-[#d8d8cf]"
        >
          {selectedFaq && (
            <div className="divide-y divide-[#d8d8cf]">
              {/* Drawer Top Header */}
              <div className="p-6 bg-[#f0eee6]/60">
                <SheetHeader className="text-left space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex size-7 items-center justify-center rounded-lg bg-white border border-[#d8d8cf] text-xs font-bold font-mono text-[#123f32] shadow-2xs">
                      #{selectedFaq.order}
                    </span>
                    <Badge
                      variant="outline"
                      className={`font-semibold text-xs ${getTopicBadgeStyle(
                        selectedFaq.topic
                      )}`}
                    >
                      {selectedFaq.topic}
                    </Badge>
                  </div>

                  <SheetTitle className="text-xl font-bold text-[#123f32] leading-snug">
                    {selectedFaq.question}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-[#526059]">
                    LUMORA Knowledge Base · Kurasi PRD 10.12
                  </SheetDescription>
                </SheetHeader>
              </div>

              {/* Drawer Content */}
              <div className="p-6 space-y-6">
                {/* 1. Jawaban Resmi Platform */}
                <section className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                      <CheckCircle2 className="size-4 text-[#123f32]" />
                      <span>Jawaban Resmi Platform</span>
                    </div>
                    <span className="text-[11px] text-[#71827a] font-mono">
                      {selectedFaq.answer.length} karakter
                    </span>
                  </div>

                  <div className="rounded-2xl border border-[#d8d8cf] bg-[#f5f2e9]/80 p-5 shadow-2xs">
                    <p className="text-sm leading-relaxed text-[#1a2620] whitespace-pre-wrap">
                      {selectedFaq.answer}
                    </p>
                  </div>
                </section>

                {/* 2. Rationale & Latar Belakang Kebijakan Produk */}
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    <Sparkles className="size-4 text-[#123f32]" />
                    <span>Latar Belakang & Maksud Produk (PRD 10.12)</span>
                  </div>

                  <div className="rounded-xl border border-[#d8d8cf] bg-white p-4 text-xs leading-relaxed text-[#2d3832] shadow-2xs">
                    {selectedFaq.rationale}
                  </div>
                </section>

                {/* 3. Target Audiens */}
                <section className="space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#123f32]">
                    <Tag className="size-4 text-[#123f32]" />
                    <span>Sasaran Pengguna</span>
                  </div>

                  <div className="rounded-xl border border-[#d8d8cf] bg-white p-3.5 text-xs text-[#526059] shadow-2xs">
                    {selectedFaq.targetAudience}
                  </div>
                </section>

                {/* 4. Kebijakan Read-Only CMS Admin */}
                <div className="rounded-xl border border-[#d8d8cf] bg-[#f0eee6]/50 p-4 text-xs text-[#526059] space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-[#123f32]">
                    <Info className="size-3.5 text-[#123f32]" />
                    <span>Kebijakan Read-Only CMS Admin</span>
                  </div>
                  <p className="leading-relaxed">
                    Konten pertanyaan dan jawaban bersumber dari data kurasi repositori. Fitur mutasi FAQ dinamis dan sinkronisasi live basis data akan diintegrasikan pada tahap pengembangan API backend berikutnya.
                  </p>
                </div>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
