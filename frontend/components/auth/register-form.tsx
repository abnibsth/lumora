"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { buttonStyles } from "@/components/ui/button";
import { registerApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export function RegisterForm({ asUmkm = true }: { asUmkm?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kata sandi minimal 8 karakter.");
      return;
    }

    setLoading(true);
    const res = await registerApi({
      name,
      email,
      password,
      role: asUmkm ? "umkm" : "mitra",
    });
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Pendaftaran gagal. Periksa input data.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      router.push(ROUTES.explore);
      router.refresh();
    }, 1200);
  }

  return (
    <div>
      {error ? (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
          Akun berhasil dibuat! Mengalihkan ke halaman jelajahi...
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="text-sm font-medium text-ink">
            Nama lengkap
          </label>
          <input
            id="name"
            name="name"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            disabled={loading || success}
            className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base focus:border-forest"
          />
        </div>

        <div>
          <label htmlFor="business-name" className="text-sm font-medium text-ink">
            Nama bisnis {asUmkm ? "" : "(Opsional)"}
          </label>
          <input
            id="business-name"
            name="businessName"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            disabled={loading || success}
            className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base focus:border-forest"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="register-email" className="text-sm font-medium text-ink">
            Email
          </label>
          <input
            id="register-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@email.com"
            disabled={loading || success}
            className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base placeholder:text-muted focus:border-forest"
          />
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="register-password" className="text-sm font-medium text-ink">
            Kata sandi
          </label>
          <input
            id="register-password"
            name="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading || success}
            className="mt-2 min-h-12 w-full rounded-xl border border-line-strong bg-surface px-4 text-base focus:border-forest"
          />
          <p className="mt-2 text-xs text-muted">Minimal 8 karakter.</p>
        </div>

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={loading || success}
            className={buttonStyles({
              variant: "primary",
              size: "lg",
              className: "w-full cursor-pointer disabled:opacity-60",
            })}
          >
            {loading ? "Mendaftarkan..." : success ? "Berhasil!" : "Buat akun dan lanjutkan"}
          </button>
        </div>
      </form>

      <p className="mt-7 text-center text-sm text-muted">
        Sudah punya akun?{" "}
        <Link href={ROUTES.login} className="font-semibold text-accent hover:text-forest">
          Masuk
        </Link>
      </p>
    </div>
  );
}
