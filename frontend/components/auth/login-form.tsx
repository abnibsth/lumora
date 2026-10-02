"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { loginApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await loginApi({ email, password });
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Gagal masuk. Periksa email dan kata sandi.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(ROUTES.explore);
      router.refresh();
    }, 800);
  }

  return (
    <div>
      <h2 className="font-display text-3xl font-semibold text-ink">Masuk ke LUMORA</h2>
      <p className="mt-2 text-sm text-muted">
        Masuk dengan akun terdaftar untuk mengelola profil usahamu.
      </p>

      {error ? (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Berhasil masuk! Mengarahkan ke halaman jelajahi...
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-8 space-y-5">
        <div>
          <label htmlFor="email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            disabled={loading || success}
            className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base text-ink placeholder:text-muted focus:border-forest"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Kata sandi
            </label>
            <button type="button" className="min-h-11 text-sm font-medium text-accent">
              Lupa kata sandi?
            </button>
          </div>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
            className="min-h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base text-ink focus:border-forest"
          />
        </div>

        <button
          type="submit"
          disabled={loading || success}
          className={buttonStyles({
            variant: "primary",
            size: "lg",
            className: "w-full cursor-pointer disabled:opacity-60",
          })}
        >
          {loading ? "Memproses..." : success ? "Berhasil!" : "Masuk"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        Belum punya akun?{" "}
        <Link href={ROUTES.registerUmkm} className="font-semibold text-accent hover:text-forest">
          Buat profil bisnis
        </Link>
      </p>
    </div>
  );
}
