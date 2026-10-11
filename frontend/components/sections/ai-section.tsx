"use client";

import { useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import { Reveal, StaggerContainer, StaggerItem } from "@/components/ui/section";
import { Container } from "@/components/ui/container";
import { aiSection } from "@/data/landing";
import { SECTION_IDS } from "@/lib/constants";

const prompts = ["Ceritakan bisnis saya", "Buat Business Model Canvas", "Cari bisnis"] as const;
type Prompt = (typeof prompts)[number];

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
      <div className="flex h-10 items-center gap-1.5 rounded-[15px] rounded-bl-sm bg-soft-green px-4">
        {[0, 1, 2].map((dot) => (
          <span key={dot} className="h-1.5 w-1.5 rounded-full bg-forest/55 motion-safe:animate-pulse" style={{ animationDelay: `${dot * 140}ms` }} />
        ))}
      </div>
    </div>
  );
}

export function AiSection() {
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [error, setError] = useState("");
  const controllerRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, typing]);

  async function sendMessage(text: string) {
    if (controllerRef.current || !text.trim()) return;
    const history = [...messages.filter((m) => m.content.trim()), { role: "user" as const, content: text.trim() }].slice(-15);
    const controller = new AbortController();
    controllerRef.current = controller;
    setMessages([...history, { role: "assistant", content: "" }]);
    setInput("");
    setError("");
    setTyping(true);
    let reply = "";
    let finished = false;
    function append(chunk: string) {
      if (finished) return;
      reply += chunk;
      // Stop long, exact repeated blocks; ordinary repeated words remain valid.
      const repetition = /([\s\S]{100,}?)\1/.exec(reply);
      if (repetition) {
        reply = reply.slice(0, repetition.index + repetition[1].length).trimEnd();
        finished = true;
      }
      if (reply.length >= 6000) {
        reply = reply.slice(0, 6000);
        finished = true;
      }
      setMessages([...history, { role: "assistant", content: reply }]);
    }
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ messages: history }), signal: controller.signal });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "AI tidak dapat menjawab saat ini.");
      }
      if (response.headers.get("content-type")?.includes("application/json")) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content;
        if (typeof content === "string") append(content);
      } else {
        if (!response.body) throw new Error("Tidak ada respons dari AI.");
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        function consume(line: string) {
          if (finished || !line.startsWith("data:")) return;
          const payload = line.slice(5).trim();
          if (!payload) return;
          if (payload === "[DONE]") { finished = true; return; }
          const data = JSON.parse(payload);
          if (data.error) throw new Error("Provider AI mengalami kesalahan saat menjawab.");
          const choice = data?.choices?.[0];
          const content = choice?.delta?.content;
          if (typeof content === "string") append(content);
          if (choice?.finish_reason) finished = true;
        }
        try {
          while (!finished) {
            const { done, value } = await reader.read();
            buffer += done ? decoder.decode() : decoder.decode(value, { stream: true });
            const lines = buffer.split("\n");
            buffer = lines.pop() || "";
            lines.forEach((line) => consume(line.trimEnd()));
            if (done) { if (buffer) consume(buffer.trimEnd()); break; }
          }
        } finally {
          await reader.cancel().catch(() => {});
          reader.releaseLock();
          if (finished) controller.abort();
        }
      }
      if (!reply.trim()) throw new Error("AI belum mengirim jawaban. Silakan coba lagi.");
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Koneksi terputus. Coba lagi.");
      if (!reply) setMessages(history);
    } finally {
      controllerRef.current = null;
      setTyping(false);
    }
  }
  const runPrompt = (prompt: Prompt) => { void sendMessage(prompt); };
  const submitMessage = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); void sendMessage(input); };

  return (
    <section id={SECTION_IDS.ai} className="bg-background py-20 sm:py-28 lg:py-36">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-start lg:gap-20">
          <StaggerContainer className="lg:sticky lg:top-28" stagger={0.08}>
            <StaggerItem><p className="text-xs font-semibold tracking-[0.18em] text-accent uppercase">{aiSection.eyebrow}</p></StaggerItem>
            <StaggerItem><h2 className="mt-4 font-display text-section font-medium text-balance text-ink">{aiSection.heading}</h2></StaggerItem>
            <StaggerItem><p className="mt-6 max-w-lg text-base leading-8 text-muted">{aiSection.description}</p></StaggerItem>
            <StaggerItem>
              <div className="mt-8 border-t border-line pt-6">
                <p className="text-sm font-semibold text-ink">Batas yang kami jaga</p>
                <p className="mt-2 text-sm leading-6 text-muted">LUMORA tidak memberikan rekomendasi investasi atau menentukan kelayakan sebuah usaha.</p>
              </div>
            </StaggerItem>
          </StaggerContainer>

          <Reveal distance={30} scale={0.98} delay={0.08}>
            <div className="overflow-hidden rounded-[18px] border border-line bg-surface shadow-[0_18px_60px_rgba(13,45,35,0.08)]">
              <div className="flex min-h-16 items-center justify-between border-b border-line px-5 py-3 sm:px-6">
                <div className="flex items-center gap-3"><AiAvatar /><div><p className="text-sm font-semibold text-ink">LUMORA AI</p><p className="text-xs text-muted">Asisten Bisnis</p></div></div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted"><span className="h-2 w-2 rounded-full bg-green ring-2 ring-green/20" />{typing ? "Menjawab…" : "Chat AI"}</div>
              </div>

              <>
                  <div ref={scrollRef} className="lumora-chat-scroll h-[min(28rem,55dvh)] min-h-[22rem] space-y-5 overflow-y-auto px-4 py-5 sm:h-[28rem] sm:px-6 lg:h-[24rem]" role="log" aria-label="Percakapan LUMORA AI" aria-live="polite" aria-busy={typing}>
                    {!messages.length ? <div className="flex items-start gap-2"><AiAvatar /><p className="rounded-2xl bg-soft-green px-4 py-3 text-sm leading-6 text-ink">Halo! Saya LUMORA AI. Ceritakan usahamu atau tanyakan bantuan yang kamu perlukan.</p></div> : null}
                    {messages.filter((message) => message.content).map((message, index) => <div key={index} className={`flex items-start gap-2 ${message.role === "user" ? "justify-end" : ""}`}>
                      {message.role === "assistant" ? <AiAvatar /> : null}
                      <p className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-6 ${message.role === "user" ? "bg-forest text-surface" : "bg-soft-green text-ink"}`}>{message.content}</p>
                    </div>)}
                    {typing && !messages.at(-1)?.content ? <TypingIndicator /> : null}
                    {error ? <p role="alert" className="rounded-xl border border-line-strong p-3 text-sm text-ink">{error}</p> : null}
                  </div>
                  <div className="border-t border-line px-4 py-4 sm:px-6">
                    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-3" aria-label="Saran pertanyaan">
                      {prompts.map((prompt) => <button id={`ai-prompt-${prompts.indexOf(prompt) + 1}`} key={prompt} type="button" onClick={() => runPrompt(prompt)} disabled={typing} className="min-h-9 shrink-0 rounded-full border border-line bg-background px-3 text-xs font-medium text-forest hover:border-forest disabled:opacity-50">{prompt}</button>)}
                    </div>
                    <form onSubmit={submitMessage} className="flex items-center gap-2 rounded-[14px] border border-line-strong bg-surface p-1.5 pl-4 focus-within:border-forest">
                      <label htmlFor="lumora-chat-input" className="sr-only">Tanyakan tentang bisnismu</label>
                      <input id="lumora-chat-input" maxLength={2000} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Tanyakan tentang bisnismu..." className="min-h-11 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-muted" />
                      {typing ? <button id="lumora-chat-stop" type="button" onClick={() => controllerRef.current?.abort()} className="min-h-11 rounded-xl bg-forest px-3 text-sm text-white">Hentikan</button> : <button id="lumora-chat-send" type="submit" disabled={!input.trim()} aria-label="Kirim pesan" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest text-white disabled:opacity-50">↑</button>}
                    </form>
                    <p className="mt-2 text-xs text-muted">Jawaban AI bisa keliru. Periksa sebelum digunakan. Percakapan tidak disimpan setelah halaman dimuat ulang.</p>
                  </div>
              </>
            </div>
          </Reveal>
        </div>
        <p className="mt-4 text-xs leading-5 text-muted lg:ml-[calc(40%+2.5rem)]">Pesan dikirim ke penyedia AI untuk menghasilkan jawaban. Hindari membagikan kata sandi atau informasi sensitif. LUMORA AI tidak menentukan kelayakan sebuah bisnis.</p>
      </Container>
    </section>
  );
}
