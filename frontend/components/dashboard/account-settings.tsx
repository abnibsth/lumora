"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { buttonStyles } from "@/components/ui/button";
import { changePasswordApi, deleteAccountApi, updateAccountApi } from "@/lib/api";
import { ROUTES } from "@/lib/constants";
import type { User } from "@/types/user";

export function AccountSettings({
  user,
  onUserChange,
}: {
  user: User;
  onUserChange: (user: User) => void;
}) {
  const router = useRouter();
  const [name, setName] = useState(user.name);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState<"name" | "password" | "delete" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleSessionError(code?: string) {
    if (code !== "unauthenticated") return false;
    router.push(`${ROUTES.login}?next=${ROUTES.dashboard}`);
    return true;
  }

  async function updateName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("name");
    setMessage(null);
    setError(null);
    const result = await updateAccountApi(name);
    setPending(null);
    if (!result.ok || !result.user) {
      if (!handleSessionError(result.code)) setError(result.error || "Nama akun gagal diperbarui.");
      return;
    }
    onUserChange(result.user);
    setMessage("Nama akun diperbarui.");
  }

  async function changePassword(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("password");
    setMessage(null);
    setError(null);
    const result = await changePasswordApi(currentPassword, newPassword);
    setPending(null);
    if (!result.ok) {
      if (!handleSessionError(result.code)) {
        setError(result.code === "rate_limited" ? "Terlalu banyak percobaan. Tunggu sebelum mencoba lagi." : result.error || "Kata sandi gagal diubah.");
      }
      return;
    }
    setCurrentPassword("");
    setNewPassword("");
    setMessage("Kata sandi diperbarui. Sesi pada perangkat lain sudah dihentikan.");
  }

  async function deleteAccount(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending("delete");
    setMessage(null);
    setError(null);
    const result = await deleteAccountApi(deletePassword);
    setPending(null);
    if (!result.ok) {
      if (!handleSessionError(result.code)) setError(result.error || "Akun gagal dihapus.");
      return;
    }
    router.push(ROUTES.home);
    router.refresh();
  }

  const fieldClass = "mt-2 min-h-12 w-full rounded-lg border border-line-strong bg-surface px-4 text-base text-ink focus:border-forest";

  return (
    <section className="mt-6 rounded-xl border border-line bg-surface p-5 sm:p-7" aria-labelledby="account-settings-heading">
      <p className="text-sm font-medium text-accent">Akun</p>
      <h2 id="account-settings-heading" className="mt-1 text-2xl font-semibold text-ink">Pengaturan akun</h2>
      <p className="mt-2 text-sm text-muted">Email login: {user.email}</p>

      {message ? <p className="mt-5 border border-forest/15 bg-soft-green px-4 py-3 text-sm text-forest" role="status">{message}</p> : null}
      {error ? <p className="mt-5 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800" role="alert">{error}</p> : null}

      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        <form onSubmit={updateName} className="rounded-xl border border-line bg-ivory/40 p-5 sm:p-7">
          <h3 className="text-lg font-semibold text-ink">Nama tampilan</h3>
          <label htmlFor="account-name" className="mt-5 block text-sm font-medium text-ink">Nama</label>
          <input id="account-name" required maxLength={100} value={name} onChange={(event) => setName(event.target.value)} className={fieldClass} />
          <button type="submit" disabled={pending !== null} className={buttonStyles({ variant: "primary", className: "mt-5" })}>
            {pending === "name" ? "Menyimpan..." : "Simpan nama"}
          </button>
        </form>

        <form onSubmit={changePassword} className="rounded-xl border border-line bg-ivory/40 p-5 sm:p-7">
          <h3 className="text-lg font-semibold text-ink">Ganti kata sandi</h3>
          <label htmlFor="current-password" className="mt-5 block text-sm font-medium text-ink">Kata sandi saat ini</label>
          <input id="current-password" type="password" required minLength={8} maxLength={128} autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} className={fieldClass} />
          <label htmlFor="new-password" className="mt-5 block text-sm font-medium text-ink">Kata sandi baru</label>
          <input id="new-password" type="password" required minLength={8} maxLength={128} autoComplete="new-password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} className={fieldClass} />
          <button type="submit" disabled={pending !== null} className={buttonStyles({ variant: "primary", className: "mt-5" })}>
            {pending === "password" ? "Mengubah..." : "Ubah kata sandi"}
          </button>
        </form>
      </div>

      <div className="mt-8 border border-red-200 bg-red-50 p-5 sm:p-7">
        <h3 className="text-lg font-semibold text-red-900">Hapus akun permanen</h3>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-red-800">
          Akun, seluruh profil bisnis, sesi, token verifikasi, dan bookmark akan dihapus. Profil yang sudah terbit juga hilang dari halaman publik. Tindakan ini tidak dapat dibatalkan.
        </p>
        {!confirmDelete ? (
          <button type="button" onClick={() => setConfirmDelete(true)} className="mt-5 min-h-11 border border-red-300 bg-white px-4 text-sm font-semibold text-red-800 hover:bg-red-100">
            Mulai hapus akun
          </button>
        ) : (
          <form onSubmit={deleteAccount} className="mt-5 max-w-xl">
            <label htmlFor="delete-password" className="block text-sm font-medium text-red-900">Masukkan kata sandi untuk konfirmasi</label>
            <input id="delete-password" type="password" required autoComplete="current-password" value={deletePassword} onChange={(event) => setDeletePassword(event.target.value)} className={fieldClass} />
            <div className="mt-4 flex flex-wrap gap-3">
              <button type="submit" disabled={pending !== null} className="min-h-11 border border-red-700 bg-red-700 px-4 text-sm font-semibold text-white hover:bg-red-800 disabled:opacity-60">
                {pending === "delete" ? "Menghapus..." : "Hapus akun dan semua profil"}
              </button>
              <button type="button" onClick={() => { setConfirmDelete(false); setDeletePassword(""); }} className={buttonStyles({ variant: "secondary" })}>
                Batal
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  );
}
