"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Info, X, ShieldCheck } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/password-input";
import { loginApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export function LoginForm({
  redirectTo = ROUTES.dashboard,
}: {
  redirectTo?: string;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showForgotNotice, setShowForgotNotice] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await loginApi({ email: email.trim(), password });
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Gagal masuk. Periksa kembali email dan kata sandi Anda.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(redirectTo);
      router.refresh();
    }, 700);
  }

  return (
    <div className="w-full max-w-[440px] sm:max-w-[460px] mx-auto space-y-6 sm:space-y-7">
      {/* Header Copy */}
      <div>
        <div className="lg:hidden mb-3 inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-forest/[0.05] px-3 py-1 text-xs font-semibold text-forest">
          <span className="size-1.5 rounded-full bg-forest" />
          <span>LUMORA Platform</span>
        </div>
        <h2 className="font-display text-2xl sm:text-3xl lg:text-[2rem] font-semibold text-forest tracking-tight leading-tight">
          Selamat datang kembali.
        </h2>
        <p className="mt-2 text-sm text-muted leading-relaxed">
          Masuk untuk melanjutkan aktivitas dan mengelola kemitraan di LUMORA.
        </p>
      </div>

      {/* Forgot Password Notice Alert */}
      {showForgotNotice ? (
        <div
          role="region"
          aria-label="Bantuan Lupa Kata Sandi"
          className="relative rounded-2xl border border-forest/20 bg-forest/[0.04] p-4 text-xs text-forest animate-in fade-in slide-in-from-top-1 duration-200"
        >
          <button
            type="button"
            onClick={() => setShowForgotNotice(false)}
            aria-label="Tutup pemberitahuan"
            className="absolute right-3 top-3 text-muted hover:text-forest transition-colors"
          >
            <X className="size-4" />
          </button>
          <div className="flex items-start gap-2.5 pr-4">
            <Info className="size-4 shrink-0 text-forest mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold text-forest">Bantuan Kata Sandi Akun</p>
              <p className="leading-relaxed text-muted">
                Untuk menjaga privasi dan integritas data bisnis, penggantian kata sandi dapat
                dilakukan melalui menu <strong>Pengaturan Akun</strong> setelah masuk, atau hubungi
                bantuan dukungan resmi di{" "}
                <a
                  href="mailto:support@lumora.id"
                  className="font-semibold text-forest underline hover:text-forest-deep"
                >
                  support@lumora.id
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Error message */}
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800"
        >
          <AlertCircle className="size-4.5 shrink-0 text-red-600 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      ) : null}

      {/* Success message */}
      {success ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-medium"
        >
          <CheckCircle2 className="size-4.5 shrink-0 text-emerald-600" />
          <span>Berhasil masuk. Mengalihkan ke dashboard...</span>
        </div>
      ) : null}

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-forest/90 mb-2">
            Alamat Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@organisasi.com"
            disabled={loading || success}
            className="min-h-[50px] w-full rounded-xl border border-line bg-surface px-4 text-sm sm:text-base text-ink placeholder:text-muted/60 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest disabled:opacity-50"
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-forest/90">
              Kata Sandi
            </label>
            <button
              type="button"
              onClick={() => setShowForgotNotice((prev) => !prev)}
              className="text-xs font-medium text-forest hover:text-forest-deep transition-colors focus-visible:outline-2 focus-visible:outline-forest rounded"
            >
              Lupa kata sandi?
            </button>
          </div>
          <PasswordInput
            id="password"
            name="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Masukkan kata sandi akun"
            disabled={loading || success}
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={buttonStyles({
            variant: "primary",
            size: "lg",
            className: "w-full gap-2 font-semibold shadow-xs hover:shadow-md transition-all min-h-[50px] rounded-xl text-base",
          })}
        >
          {loading ? (
            <>
              <Loader2 className="size-4.5 animate-spin" />
              <span>Memverifikasi akun...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="size-4.5" />
              <span>Berhasil Masuk!</span>
            </>
          ) : (
            <span>Masuk ke Akun</span>
          )}
        </button>
      </form>

      {/* Switch to Register */}
      <div className="pt-2 text-center text-xs sm:text-sm text-muted">
        Belum memiliki akun di LUMORA?{" "}
        <Link
          href={ROUTES.register}
          className="font-semibold text-forest hover:text-forest-deep underline transition-colors"
        >
          Daftar sekarang
        </Link>
      </div>

      {/* Security badge footer */}
      <div className="pt-2 flex items-center justify-center gap-2 text-[11px] text-muted/80">
        <ShieldCheck className="size-3.5 text-forest/70" />
        <span>Koneksi aman dengan enkripsi data standar industri</span>
      </div>
    </div>
  );
}
