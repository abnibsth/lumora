"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AlertCircle, CheckCircle2, Loader2, Sparkles, Building2, Store, ShieldCheck } from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { PasswordInput } from "@/components/auth/password-input";
import { RoleSelector } from "@/components/auth/role-selector";
import { registerApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

export function RegisterForm({ initialRole = "umkm" }: { initialRole?: "umkm" | "mitra" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryRole = searchParams.get("role");

  const [role, setRole] = useState<"umkm" | "mitra">(() =>
    queryRole === "mitra" ? "mitra" : initialRole,
  );
  const [name, setName] = useState("");
  const [entityName, setEntityName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [, startTransition] = useTransition();

  // Sync state if URL query param changes externally
  useEffect(() => {
    if (queryRole === "mitra" || queryRole === "umkm") {
      setRole(queryRole);
    }
  }, [queryRole]);

  function handleRoleChange(newRole: "umkm" | "mitra") {
    setRole(newRole);
    setError(null);
    startTransition(() => {
      const url = newRole === "mitra" ? "/register?role=mitra" : "/register?role=umkm";
      router.replace(url, { scroll: false });
    });
  }

  const isUmkm = role === "umkm";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Kata sandi minimal harus terdiri dari 8 karakter.");
      return;
    }

    setLoading(true);
    const res = await registerApi({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
    });
    setLoading(false);

    if (!res.ok) {
      setError(res.error || "Pendaftaran akun gagal. Silakan periksa kembali data Anda.");
      return;
    }

    setSuccess(true);
    if (entityName.trim()) {
      try {
        if (role === "umkm") {
          sessionStorage.setItem("lumora_initial_business_name", entityName.trim());
        } else {
          sessionStorage.setItem("lumora_initial_company_name", entityName.trim());
        }
      } catch {
        // Ignore storage errors
      }
    }
    setTimeout(() => {
      router.push(ROUTES.dashboard);
      router.refresh();
    }, 900);
  }

  return (
    <div className="w-full max-w-[620px] sm:max-w-[640px] mx-auto space-y-6 sm:space-y-7">
      {/* Dynamic Role Selector */}
      <RoleSelector
        role={role}
        onSelect={handleRoleChange}
        disabled={loading || success}
      />

      {/* Role-Adaptive Header */}
      <div className="border-t border-line/60 pt-5 sm:pt-6">
        <div className="inline-flex items-center gap-2 rounded-full border border-forest/15 bg-forest/[0.05] px-3 py-1 text-xs font-semibold text-forest mb-2.5">
          {isUmkm ? (
            <>
              <Store className="size-3.5 text-forest" />
              <span>Pendaftaran Pemilik Usaha (UMKM)</span>
            </>
          ) : (
            <>
              <Building2 className="size-3.5 text-forest" />
              <span>Pendaftaran Mitra Bisnis & Investor</span>
            </>
          )}
        </div>
        <h2 className="font-display text-2xl sm:text-3xl font-semibold text-forest tracking-tight">
          {isUmkm
            ? "Bangun identitas bisnis yang lebih kuat."
            : "Temukan bisnis yang layak berkembang bersama."}
        </h2>
        <p className="mt-2 text-xs sm:text-sm text-muted leading-relaxed">
          {isUmkm
            ? "Mulai perkenalkan usaha, ceritakan perjalanan bisnis, dan buka peluang baru bersama LUMORA."
            : "Jelajahi UMKM potensial, temukan peluang kolaborasi, dan bangun koneksi bisnis melalui LUMORA."}
        </p>
      </div>

      {/* Error alert */}
      {error ? (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 p-4 text-xs sm:text-sm text-red-800"
        >
          <AlertCircle className="size-4.5 shrink-0 text-red-600 mt-0.5" />
          <span className="leading-relaxed">{error}</span>
        </div>
      ) : null}

      {/* Success alert */}
      {success ? (
        <div
          role="status"
          className="flex items-center gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800 font-medium"
        >
          <CheckCircle2 className="size-4.5 shrink-0 text-emerald-600" />
          <span>Akun {isUmkm ? "UMKM" : "Mitra"} berhasil dibuat. Membuka dashboard...</span>
        </div>
      ) : null}

      {/* Registration Form with responsive desktop 2-column layout */}
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-semibold uppercase tracking-wider text-forest/90 mb-2">
              Nama Lengkap
            </label>
            <input
              id="reg-name"
              name="name"
              type="text"
              autoComplete="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Contoh: Budi Santoso"
              disabled={loading || success}
              className="min-h-[50px] w-full rounded-xl border border-line bg-surface px-4 text-sm sm:text-base text-ink placeholder:text-muted/60 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="reg-entity" className="block text-xs font-semibold uppercase tracking-wider text-forest/90 mb-2">
              {isUmkm ? "Nama Usaha / Brand" : "Nama Organisasi / Perusahaan"}
              {!isUmkm ? <span className="ml-1 text-muted font-normal lowercase">(opsional)</span> : null}
            </label>
            <input
              id="reg-entity"
              name="entityName"
              type="text"
              required={isUmkm}
              value={entityName}
              onChange={(e) => setEntityName(e.target.value)}
              placeholder={isUmkm ? "Contoh: Kopi Ruang Senja" : "Contoh: PT Ventura Nusantara"}
              disabled={loading || success}
              className="min-h-[50px] w-full rounded-xl border border-line bg-surface px-4 text-sm sm:text-base text-ink placeholder:text-muted/60 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest disabled:opacity-50"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
          <div>
            <label htmlFor="reg-email" className="block text-xs font-semibold uppercase tracking-wider text-forest/90 mb-2">
              Alamat Email
            </label>
            <input
              id="reg-email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              disabled={loading || success}
              className="min-h-[50px] w-full rounded-xl border border-line bg-surface px-4 text-sm sm:text-base text-ink placeholder:text-muted/60 transition-colors focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-semibold uppercase tracking-wider text-forest/90 mb-2">
              Kata Sandi
            </label>
            <PasswordInput
              id="reg-password"
              name="password"
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              disabled={loading || success}
            />
          </div>
        </div>

        {/* Informative Step Note */}
        <div className="rounded-xl border border-forest/15 bg-forest/[0.04] p-3.5 sm:p-4 text-xs text-forest flex items-start gap-2.5">
          <Sparkles className="size-4 shrink-0 text-forest mt-0.5" />
          <p className="leading-relaxed">
            {isUmkm
              ? "Setelah akun aktif, Anda dapat langsung melengkapi Business Model Canvas (BMC), milestone perjalanan, dan metrik bisnis di dashboard usaha."
              : "Setelah akun aktif, Anda dapat langsung menentukan preferensi sektor UMKM prioritas dan kriteria kemitraan di partner workspace."}
          </p>
        </div>

        {/* Submit button */}
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
              <span>Mendaftarkan Akun...</span>
            </>
          ) : success ? (
            <>
              <CheckCircle2 className="size-4.5" />
              <span>Berhasil Terdaftar!</span>
            </>
          ) : (
            <span>{isUmkm ? "Buat Akun dan Mulai" : "Daftar sebagai Mitra"}</span>
          )}
        </button>
      </form>

      {/* Switch to Login */}
      <div className="pt-1 text-center text-xs sm:text-sm text-muted">
        Sudah memiliki akun di LUMORA?{" "}
        <Link
          href={ROUTES.login}
          className="font-semibold text-forest hover:text-forest-deep underline transition-colors"
        >
          Masuk ke akun
        </Link>
      </div>

      {/* Security note */}
      <div className="flex items-center justify-center gap-2 text-[11px] text-muted/80">
        <ShieldCheck className="size-3.5 text-forest/70" />
        <span>Data registrasi terlindungi dengan standar kepatuhan privasi LUMORA</span>
      </div>
    </div>
  );
}
