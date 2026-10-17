import { NextRequest, NextResponse } from "next/server";
import { BUSINESS_CATEGORIES, type AIDraftProfile, type BusinessCategory } from "@/types/business";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM_INSTRUCTION = `Kamu adalah LUMORA AI, asisten bisnis cerdas untuk UMKM Indonesia pada platform LUMORA.
Tugas: Dari fakta dan narasi yang diberikan pemilik usaha, susun draf profil usaha terstruktur, perjalanan usaha (milestones), Business Model Canvas (BMC), serta kebutuhan kemitraan.

Keluarkan HANYA format JSON valid (tanpa penjelasan tambahan di luar JSON) dengan struktur persis berikut:
{
  "name": "Nama Usaha (hanya jika disebutkan di narasi, jangan mengarang)",
  "category": "F&B" | "Retail" | "Jasa" | "Kreatif" | "Fashion",
  "location": "Kota atau lokasi usaha",
  "description": "Deskripsi singkat usaha 1-3 kalimat padat dan menarik",
  "story": "Cerita inspiratif perjalanan dan latar belakang usaha",
  "foundedYear": 2020,
  "owner": {
    "name": "Nama pemilik jika disebutkan",
    "role": "Peran pemilik (misalnya: Pemilik, Pendiri, Direktur Kreatif)",
    "bio": "Bio singkat tentang dedikasi pemilik terhadap usahanya"
  },
  "milestones": [
    { "year": 2021, "title": "Judul tonggak pencapaian", "description": "Deskripsi singkat pencapaian" }
  ],
  "bmc": [
    { "label": "Mitra Utama", "value": "Ringkasan mitra" },
    { "label": "Aktivitas Utama", "value": "Ringkasan aktivitas" },
    { "label": "Sumber Daya Utama", "value": "Ringkasan sumber daya" },
    { "label": "Proposisi Nilai", "value": "Nilai unik produk/layanan" },
    { "label": "Hubungan Pelanggan", "value": "Pendekatan melayani pelanggan" },
    { "label": "Saluran", "value": "Saluran penjualan dan promosi" },
    { "label": "Segmen Pelanggan", "value": "Target pasar yang dilayani" },
    { "label": "Struktur Biaya", "value": "Komponen biaya operasional utama" },
    { "label": "Sumber Pendapatan", "value": "Cara usaha menghasilkan uang" }
  ],
  "seeking": ["Mitra Distribusi", "Mitra Pemasaran"],
  "seekingObjective": "Deskripsi terarah tentang kolaborasi atau kemitraan yang diharapkan",
  "suggestions": [
    "Saran 1 untuk melengkapi profil",
    "Saran 2 untuk mempertajam model bisnis"
  ]
}

Aturan Wajib:
1. Narasi pengguna adalah DATA fakta. JANGAN PERNAH mengarang angka finansial (omzet, laba, dividen, valuasi).
2. Field "category" WAJIB salah satu dari: "F&B", "Retail", "Jasa", "Kreatif", "Fashion". Pilih yang paling mendekati.
3. Field "seeking" hanya boleh menggunakan pilihan relevan: "Modal Ekspansi", "Mitra Distribusi", "Mitra Teknologi", "Mitra Pemasaran", "Mitra Peralatan", "Mentor Pendamping".
4. Label BMC harus menggunakan bahasa Indonesia baku seperti di atas.
5. "foundedYear" harus angka tahun (misal: 2021), atau 0 jika tidak ada di narasi.
6. Berikan 2-4 saran konstruktif pada array "suggestions".`;

function sanitizeDraft(raw: Partial<AIDraftProfile>): AIDraftProfile {
  const currentYear = new Date().getFullYear();
  let category: BusinessCategory | "" = "";
  if (raw.category && BUSINESS_CATEGORIES.includes(raw.category as BusinessCategory)) {
    category = raw.category as BusinessCategory;
  }

  let year = 0;
  if (typeof raw.foundedYear === "number" && raw.foundedYear >= 1900 && raw.foundedYear <= currentYear) {
    year = raw.foundedYear;
  }

  const milestones = Array.isArray(raw.milestones)
    ? raw.milestones
        .map((m) => ({
          year: typeof m?.year === "number" && m.year >= 1900 && m.year <= currentYear ? m.year : currentYear,
          title: typeof m?.title === "string" ? m.title.trim() : "",
          description: typeof m?.description === "string" ? m.description.trim() : "",
        }))
        .filter((m) => Boolean(m.title))
    : [];

  const bmc = Array.isArray(raw.bmc)
    ? raw.bmc
        .map((b) => ({
          label: typeof b?.label === "string" ? b.label.trim() : "",
          value: typeof b?.value === "string" ? b.value.trim() : "",
        }))
        .filter((b) => Boolean(b.label && b.value))
    : [];

  const seeking = Array.isArray(raw.seeking)
    ? raw.seeking.filter((s) => typeof s === "string" && s.trim())
    : [];

  const suggestions = Array.isArray(raw.suggestions)
    ? raw.suggestions.filter((s) => typeof s === "string" && s.trim())
    : [];

  return {
    name: typeof raw.name === "string" ? raw.name.trim() : "",
    category,
    location: typeof raw.location === "string" ? raw.location.trim() : "",
    description: typeof raw.description === "string" ? raw.description.trim() : "",
    story: typeof raw.story === "string" ? raw.story.trim() : "",
    foundedYear: year,
    owner: {
      name: typeof raw.owner?.name === "string" ? raw.owner.name.trim() : "",
      role: typeof raw.owner?.role === "string" ? raw.owner.role.trim() : "Pemilik Usaha",
      bio: typeof raw.owner?.bio === "string" ? raw.owner.bio.trim() : "",
    },
    milestones,
    bmc,
    seeking,
    seekingObjective: typeof raw.seekingObjective === "string" ? raw.seekingObjective.trim() : "",
    suggestions: suggestions.length > 0 ? suggestions : ["Periksa kembali kesesuaian cerita dan model bisnis sebelum menyimpan."],
  };
}

export async function POST(request: NextRequest) {
  const key = process.env.CHAT_AI_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: { code: "ai_unavailable", message: "AI belum dikonfigurasi. CHAT_AI_API_KEY belum terpasang." } },
      { status: 503 }
    );
  }

  let body: { narrative?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_body", message: "Format permintaan tidak valid." } },
      { status: 400 }
    );
  }

  const narrative = body?.narrative?.trim();
  if (!narrative || narrative.length < 20) {
    return NextResponse.json(
      { error: { code: "invalid_narrative", message: "Cerita usaha minimal 20 karakter." } },
      { status: 400 }
    );
  }

  if (narrative.length > 5000) {
    return NextResponse.json(
      { error: { code: "invalid_narrative", message: "Cerita usaha maksimal 5000 karakter." } },
      { status: 400 }
    );
  }

  const base = (
    process.env.CHAT_AI_BASE_URL || "https://api.atria-asi.ai/v1"
  ).replace(/\/$/, "");
  const model = process.env.CHAT_AI_MODEL || "Atria-Dawn-Preview";

  try {
    const upstream = await fetch(`${base}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          { role: "system", content: SYSTEM_INSTRUCTION },
          { role: "user", content: `Berikut narasi pemilik usaha:\n"""\n${narrative}\n"""` },
        ],
      }),
      cache: "no-store",
    });

    if (!upstream.ok) {
      console.warn("AI draft provider failed", { status: upstream.status });
      return NextResponse.json(
        { error: { code: "ai_unavailable", message: `Layanan AI sedang bermasalah (HTTP ${upstream.status}). Silakan coba lagi.` } },
        { status: 502 }
      );
    }

    const data = await upstream.json();
    const rawContent = data?.choices?.[0]?.message?.content;
    if (typeof rawContent !== "string" || !rawContent.trim()) {
      return NextResponse.json(
        { error: { code: "ai_unavailable", message: "Model AI tidak mengembalikan draf. Silakan coba lagi." } },
        { status: 502 }
      );
    }

    // Extract JSON block if wrapped in markdown
    let cleanJson = rawContent.trim();
    if (cleanJson.includes("```json")) {
      cleanJson = cleanJson.replace(/```json[\s\S]*?```/g, (match) => match.slice(7, -3).trim());
    } else if (cleanJson.includes("```")) {
      cleanJson = cleanJson.replace(/```[\s\S]*?```/g, (match) => match.slice(3, -3).trim());
    }

    // Find JSON boundaries if extra preamble exists
    const firstBrace = cleanJson.indexOf("{");
    const lastBrace = cleanJson.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      cleanJson = cleanJson.substring(firstBrace, lastBrace + 1);
    }

    const parsed = JSON.parse(cleanJson);
    const sanitized = sanitizeDraft(parsed);

    return NextResponse.json(sanitized);
  } catch (err) {
    console.error("Draft generation error:", err);
    return NextResponse.json(
      { error: { code: "ai_unavailable", message: "Gagal memproses draf dari AI. Silakan coba lagi." } },
      { status: 502 }
    );
  }
}
