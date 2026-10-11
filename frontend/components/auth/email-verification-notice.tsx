"use client";

import { useState } from "react";
import { resendVerificationApi } from "@/lib/api";
import type { User } from "@/types/user";

export function EmailVerificationNotice({ user }: { user: User }) {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "verified">("idle");
  const [error, setError] = useState<string | null>(null);

  if (user.emailVerified || status === "verified") return null;

  async function handleResend() {
    setStatus("sending");
    setError(null);

    const result = await resendVerificationApi();
    if (result.ok) {
      setStatus("sent");
      return;
    }
    if (result.code === "email_already_verified") {
      setStatus("verified");
      return;
    }

    setStatus("idle");
    setError(result.error || "Email verifikasi gagal dikirim ulang.");
  }

  return (
    <div className="border-b border-forest/10 bg-soft-green text-forest">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-2 px-5 py-3 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div>
          <p className="font-medium">Verifikasi email untuk menerbitkan profil dan memakai draf AI.</p>
          <p className="mt-0.5 text-xs text-muted" aria-live="polite">
            {status === "sent"
              ? `Tautan baru dikirim ke ${user.email}.`
              : error || `Buka tautan yang dikirim ke ${user.email}.`}
          </p>
        </div>
        <div className="flex shrink-0 items-center">
          <button
            type="button"
            onClick={handleResend}
            disabled={status === "sending" || status === "sent"}
            className="min-h-11 font-semibold text-accent underline decoration-accent/30 underline-offset-4 hover:decoration-accent disabled:cursor-wait disabled:opacity-60"
          >
            {status === "sending" ? "Mengirim..." : status === "sent" ? "Email terkirim" : "Kirim ulang"}
          </button>
        </div>
      </div>
    </div>
  );
}
