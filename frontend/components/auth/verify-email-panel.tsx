"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { resendVerificationApi, verifyEmailApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

type VerificationState = "missing" | "verifying" | "verified" | "invalid" | "rate-limited" | "failed";

export function VerifyEmailPanel({ token }: { token?: string }) {
  const [state, setState] = useState<VerificationState>(token ? "verifying" : "missing");
  const [message, setMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  useEffect(() => {
    if (!token) return;

    let active = true;
    verifyEmailApi(token).then((result) => {
      if (!active) return;
      if (result.ok) {
        setState("verified");
        return;
      }

      setMessage(result.error || "Verifikasi email gagal.");
      setState(
        result.code === "invalid_token"
          ? "invalid"
          : result.code === "rate_limited"
            ? "rate-limited"
            : "failed",
      );
    });

    return () => {
      active = false;
    };
  }, [token]);

  async function handleResend() {
    setResending(true);
    setResendError(null);
    const result = await resendVerificationApi();
    setResending(false);

    if (result.ok) {
      setResent(true);
      return;
    }
    if (result.code === "email_already_verified") {
      setState("verified");
      return;
    }

    setResendError(result.error || "Email verifikasi gagal dikirim ulang.");
  }

  const content = {
    missing: {
      title: "Token verifikasi tidak ditemukan.",
      body: "Buka tautan lengkap dari email LUMORA, atau masuk untuk meminta tautan baru.",
    },
    verifying: {
      title: "Memeriksa tautan verifikasi...",
      body: "Tunggu sebentar. Halaman ini sedang mengirim token ke server LUMORA.",
    },
    verified: {
      title: "Email berhasil diverifikasi.",
      body: "Akunmu sekarang dapat menerbitkan profil bisnis dan menggunakan draf AI.",
    },
    invalid: {
      title: "Tautan tidak berlaku.",
      body: message || "Token sudah dipakai, kedaluwarsa, atau bukan token yang dikenali.",
    },
    "rate-limited": {
      title: "Terlalu banyak percobaan.",
      body: message || "Tunggu sebelum mencoba tautan verifikasi lagi.",
    },
    failed: {
      title: "Verifikasi belum berhasil.",
      body: message || "Server tidak dapat memproses verifikasi saat ini.",
    },
  }[state];

  const canResend = state === "missing" || state === "invalid";

  return (
    <div className="mx-auto max-w-xl rounded-2xl bg-surface p-6 shadow-panel sm:p-10">
      <p className="text-sm font-medium text-accent">Verifikasi email</p>
      <h1 className="mt-3 font-display text-3xl font-semibold leading-tight text-ink sm:text-4xl">
        {content.title}
      </h1>
      <p className="mt-4 leading-7 text-muted" aria-live="polite">
        {resent ? "Tautan verifikasi baru sudah dikirim. Periksa inbox dan folder spam." : content.body}
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        {state === "verified" ? (
          <Link href={ROUTES.dashboard} className={buttonStyles({ variant: "primary", size: "lg" })}>
            Buka dashboard
          </Link>
        ) : null}
        {canResend && !resent ? (
          <button
            type="button"
            onClick={handleResend}
            disabled={resending}
            className={buttonStyles({ variant: "primary", size: "lg" })}
          >
            {resending ? "Mengirim..." : "Kirim tautan baru"}
          </button>
        ) : null}
        {state !== "verifying" ? (
          <Link href={ROUTES.login} className={buttonStyles({ variant: "secondary", size: "lg" })}>
            Masuk ke akun
          </Link>
        ) : null}
      </div>

      {resendError ? <p className="mt-4 text-sm text-red-700">{resendError}</p> : null}
    </div>
  );
}
