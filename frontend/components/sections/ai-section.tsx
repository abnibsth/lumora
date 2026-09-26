"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Container } from "@/components/ui/container";
import { aiSection } from "@/data/landing";
import { ROUTES, SECTION_IDS } from "@/lib/constants";

const prompts = ["Ceritakan bisnis saya", "Buat Business Model Canvas", "Cari bisnis"] as const;
type Prompt = (typeof prompts)[number];
type View = "chat" | "draft";

function AiAvatar() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-forest font-display text-sm font-semibold text-green" aria-hidden="true">
      L
    </span>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2" role="status" aria-label="LUMORA AI sedang menulis">
      <AiAvatar />
      <div className="flex h-10 items-center gap-1.5 rounded-[15px] rounded-bl-sm bg-[#e7efe7] px-4">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="h-1.5 w-1.5 rounded-full bg-forest/55 motion-safe:animate-pulse" style={{ animationDelay: `${dot * 140}ms` }} />
        ))}
      </div>
    </div>
  );
}

function ProfileConversation({ onCreateDraft, onEdit }: { onCreateDraft: () => void; onEdit: () => void }) {
  return (
    <>
      <div className="flex items-end gap-2">
        <AiAvatar />
        <p className="max-w-[82%] rounded-[16px] rounded-bl-sm bg-[#e7efe7] px-4 py-3 text-sm leading-6 text-ink">
          Halo! Ceritakan sedikit tentang bisnismu. Tidak perlu menggunakan bahasa formal.
        </p>
      </div>
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-[16px] rounded-br-sm bg-forest px-4 py-3 text-sm leading-6 text-[#fffdf8] sm:max-w-[75%]">
          Saya punya kedai kopi di Bandung sejak 2023. Pelanggan kebanyakan warga sekitar dan pekerja remote. Sekarang saya sedang mencari mitra untuk membuka cabang kedua.
        </p>
      </div>
      <div className="flex items-start gap-2">
        <AiAvatar />
        <div className="max-w-[88%] rounded-[16px] rounded-bl-sm bg-[#e7efe7] px-4 py-3 text-sm leading-6 text-ink">
          <p>Oke, saya menangkap beberapa informasi dari ceritamu.</p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {["F&B", "Bandung", "Sejak 2023", "Mencari Mitra"].map((item) => (
              <span key={item} className="rounded-full border border-forest/15 bg-surface px-2.5 py-1 text-xs font-medium text-forest">{item}</span>
            ))}
          </div>
          <dl className="mt-3 space-y-1 text-xs leading-5 text-muted">
            <div><dt className="inline font-semibold text-ink">Target: </dt><dd className="inline">warga lokal &amp; pekerja remote</dd></div>
            <div><dt className="inline font-semibold text-ink">Kebutuhan: </dt><dd className="inline">mitra ekspansi</dd></div>
          </dl>
          <p className="mt-3">Saya bisa membantu menyusunnya menjadi profil bisnis.</p>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button id="ai-create-draft" type="button" onClick={onCreateDraft} className="min-h-10 rounded-xl bg-forest px-4 text-xs font-semibold text-white transition-colors hover:bg-forest-deep">
              Buat Draft Profil <span aria-hidden="true">→</span>
            </button>
            <button id="ai-edit-information" type="button" onClick={onEdit} className="min-h-10 text-xs font-semibold text-accent underline-offset-4 hover:underline">Edit informasi</button>
          </div>
        </div>
      </div>
    </>
  );
}

function CanvasConversation() {
  return (
    <>
      <div className="flex justify-end"><p className="max-w-[85%] rounded-[16px] rounded-br-sm bg-forest px-4 py-3 text-sm leading-6 text-[#fffdf8] sm:max-w-[75%]">Bantu buat Business Model Canvas dari informasi bisnis saya.</p></div>
      <div className="flex items-start gap-2">
        <AiAvatar />
        <div className="max-w-[88%] rounded-[16px] rounded-bl-sm bg-[#e7efe7] px-4 py-3 text-sm leading-6 text-ink">
          <p>Saya bisa mulai dari informasi yang sudah kamu berikan.</p>
          <dl className="mt-4 divide-y divide-forest/10 border-y border-forest/10">
            <div className="py-2.5"><dt className="text-xs font-semibold text-accent">Value Proposition</dt><dd className="mt-1">Kopi lokal dengan suasana komunitas.</dd></div>
            <div className="py-2.5"><dt className="text-xs font-semibold text-accent">Customer Segment</dt><dd className="mt-1">Warga sekitar dan pekerja remote.</dd></div>
            <div className="py-2.5"><dt className="text-xs font-semibold text-accent">Channels</dt><dd className="mt-1">Toko fisik dan media sosial.</dd></div>
          </dl>
          <button id="ai-view-canvas" type="button" className="mt-4 min-h-10 rounded-xl bg-forest px-4 text-xs font-semibold text-white transition-colors hover:bg-forest-deep">Lihat Business Model Canvas <span aria-hidden="true">→</span></button>
        </div>
      </div>
    </>
  );
}

function SearchConversation() {
  return (
    <>
      <div className="flex justify-end"><p className="max-w-[85%] rounded-[16px] rounded-br-sm bg-forest px-4 py-3 text-sm leading-6 text-[#fffdf8] sm:max-w-[75%]">Cari UMKM F&amp;B di Bandung yang sedang berkembang.</p></div>
      <div className="flex items-start gap-2">
        <AiAvatar />
        <div className="max-w-[88%] rounded-[16px] rounded-bl-sm bg-[#e7efe7] px-4 py-3 text-sm leading-6 text-ink">
          <p>Saya menemukan profil yang sesuai dengan pencarianmu.</p>
          <div className="mt-3 border-y border-forest/10 py-3">
            <p className="font-display text-lg font-semibold">Kopi Ruang Senja</p>
            <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-muted"><span>F&amp;B · Bandung</span><span className="font-semibold text-accent">+23% / 6 bulan</span></div>
          </div>
          <Link href={ROUTES.business("kopi-ruang-senja")} className="mt-3 inline-flex min-h-10 items-center text-xs font-semibold text-accent underline underline-offset-4">Lihat Profil <span aria-hidden="true" className="ml-1">→</span></Link>
          <p className="mt-2 text-xs text-muted">Ringkasan berdasarkan informasi yang tersedia di profil.</p>
        </div>
      </div>
    </>
  );
}

function DraftProfile({ onBack }: { onBack: () => void }) {
  return (
    <div className="ai-result-enter flex min-h-[27rem] flex-col p-5 sm:p-7">
      <button id="ai-back-to-chat" type="button" onClick={onBack} className="self-start text-sm font-semibold text-accent hover:underline"><span aria-hidden="true">←</span> Kembali ke percakapan</button>
      <div className="my-auto rounded-2xl bg-[#edf2ec] p-6 sm:p-8">
        <p className="text-xs font-semibold tracking-[0.14em] text-accent uppercase">Draf Profil</p>
        <h3 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink sm:text-3xl">Kedai kopi yang tumbuh bersama lingkungan sekitar.</h3>
        <p className="mt-5 text-sm leading-7 text-muted">Kopi Ruang Senja adalah kedai independen di Bandung yang dibuka sejak 2023. Ruang komunitas dan hubungan dengan pelanggan lokal menjadi bagian penting dari cara bisnis ini berkembang.</p>
        <div className="mt-7 flex flex-wrap gap-3">
          <button id="ai-edit-draft" type="button" onClick={onBack} className="min-h-11 rounded-xl border border-line-strong bg-surface px-4 text-sm font-semibold text-ink hover:bg-background">Edit Informasi</button>
          <Link href={ROUTES.business("kopi-ruang-senja")} className="inline-flex min-h-11 items-center rounded-xl bg-forest px-4 text-sm font-semibold text-white hover:bg-forest-deep">Lihat Profil Lengkap <span aria-hidden="true" className="ml-1">→</span></Link>
        </div>
      </div>
    </div>
  );
}

export function AiSection() {
  const [active, setActive] = useState<Prompt>(prompts[0]);
  const [typing, setTyping] = useState(false);
  const [view, setView] = useState<View>("chat");
  const [input, setInput] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  const runPrompt = (prompt: Prompt) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setView("chat");
    setActive(prompt);
    setCustomMessage("");
    setTyping(true);
    timerRef.current = setTimeout(() => setTyping(false), 750);
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const message = input.trim();
    if (!message) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    setCustomMessage(message);
    setInput("");
    setTyping(true);
    timerRef.current = setTimeout(() => setTyping(false), 750);
  };

  return (
    <section id={SECTION_IDS.ai} className="bg-background py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
          <div className="lg:sticky lg:top-28">
            <p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{aiSection.eyebrow}</p>
            <h2 className="mt-4 font-display text-section font-medium text-balance text-ink">{aiSection.heading}</h2>
            <p className="mt-6 max-w-lg text-base leading-8 text-muted">{aiSection.description}</p>
            <div className="mt-8 border-t border-line pt-6">
              <p className="text-sm font-semibold text-ink">Batas yang kami jaga</p>
              <p className="mt-2 text-sm leading-6 text-muted">LUMORA tidak memberikan rekomendasi investasi atau menentukan kelayakan sebuah usaha.</p>
            </div>
          </div>

          <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_18px_60px_rgba(13,45,35,0.08)]">
            <div className="flex min-h-16 items-center justify-between border-b border-line px-5 py-3 sm:px-6">
              <div className="flex items-center gap-3"><AiAvatar /><div><p className="text-sm font-semibold text-ink">LUMORA AI</p><p className="text-xs text-muted">Asisten Bisnis</p></div></div>
              <div className="flex items-center gap-2 text-xs font-medium text-muted"><span className="h-2 w-2 rounded-full bg-green ring-2 ring-green/20" />Online</div>
            </div>

            {view === "draft" ? <DraftProfile onBack={() => setView("chat")} /> : (
              <>
                <div className="lumora-chat-scroll h-[350px] space-y-5 overflow-y-auto px-4 py-5 sm:h-[380px] sm:px-6" aria-live="polite">
                  {customMessage ? <div className="flex justify-end"><p className="max-w-[85%] rounded-[16px] rounded-br-sm bg-forest px-4 py-3 text-sm leading-6 text-[#fffdf8] sm:max-w-[75%]">{customMessage}</p></div> : null}
                  {typing ? <TypingIndicator /> : customMessage ? <div className="ai-result-enter flex items-end gap-2"><AiAvatar /><p className="max-w-[82%] rounded-[16px] rounded-bl-sm bg-[#e7efe7] px-4 py-3 text-sm leading-6 text-ink">Saya sudah menerima ceritamu. Pilih salah satu saran di bawah agar saya dapat membantu menyusunnya.</p></div> : active === "Ceritakan bisnis saya" ? <ProfileConversation onCreateDraft={() => setView("draft")} onEdit={() => setInput("Saya ingin memperbarui informasi bisnis saya.")} /> : active === "Buat Business Model Canvas" ? <CanvasConversation /> : <SearchConversation />}
                </div>

                <div className="border-t border-line px-4 py-4 sm:px-6">
                  <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3" aria-label="Saran pertanyaan">
                    {prompts.map((prompt) => <button id={`ai-prompt-${prompts.indexOf(prompt) + 1}`} key={prompt} type="button" onClick={() => runPrompt(prompt)} disabled={typing} className="min-h-9 shrink-0 rounded-full border border-line bg-background px-3 text-xs font-medium text-forest transition-colors hover:border-forest hover:bg-mint/40 disabled:opacity-50">{prompt}</button>)}
                  </div>
                  <form onSubmit={submitMessage} className="flex items-center gap-2 rounded-[14px] border border-line-strong bg-[#fffdf8] p-1.5 pl-4 focus-within:border-forest">
                    <label htmlFor="lumora-chat-input" className="sr-only">Tanyakan atau ceritakan tentang bisnismu</label>
                    <input id="lumora-chat-input" value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tanyakan atau ceritakan tentang bisnismu..." className="min-h-10 min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted" />
                    <button id="lumora-chat-send" type="submit" aria-label="Kirim pesan" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-forest text-white transition-colors hover:bg-forest-deep"><svg aria-hidden="true" viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 16V4M5.5 8.5 10 4l4.5 4.5" /></svg></button>
                  </form>
                </div>
              </>
            )}
          </div>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted lg:ml-[calc(40%+2.5rem)]">Pratinjau menggunakan data contoh. LUMORA AI membantu menyusun informasi yang diberikan pengguna dan tidak menentukan kelayakan sebuah bisnis.</p>
      </Container>
    </section>
  );
}
