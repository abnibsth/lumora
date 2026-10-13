"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmailVerificationNotice } from "@/components/auth/email-verification-notice";
import { AccountSettings } from "./account-settings";
import { SavedBusinesses } from "./saved-businesses";
import { WorkspaceShell } from "./workspace-shell";
import { DashboardOverview } from "./dashboard-overview";
import { BusinessList } from "./business-list";
import { BusinessEditor } from "./business-editor";
import { useBusinessEditor } from "./use-business-editor";
import { WorkspaceConfirmation } from "./workspace-confirmation";
import { archiveBusinessApi, createBusinessApi, fetchBookmarks, fetchMyBusinesses, getMeApi, logoutApi, publishBusinessApi, updateBusinessApi, type OwnedBusinessListResponse } from "@/lib/api";
import { dashboardHref, inputFromForm, resolveView, type EditorSection, type WorkspaceView } from "@/lib/dashboard";
import type { Business, OwnedBusiness } from "@/types/business";
import type { User } from "@/types/user";

function sectionFor(view: WorkspaceView): EditorSection { return view === "story" ? "story" : view === "canvas" ? "canvas" : view === "ai" ? "ai" : "identity"; }
const editorViews = ["story", "canvas", "ai"];

export function OwnerDashboard({ user, initialBusinesses, initialBookmarks, profilesError: initialProfilesError, bookmarksError: initialBookmarksError, defaultSidebarOpen = true }: {
  user: User; initialBusinesses: OwnedBusinessListResponse; initialBookmarks: Business[]; profilesError?: string; bookmarksError?: string; defaultSidebarOpen?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const view = resolveView(search.get("view"));
  const [accountUser, setAccountUser] = useState(user);
  const [listing, setListing] = useState(initialBusinesses);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [profilesError, setProfilesError] = useState(initialProfilesError);
  const [bookmarksError, setBookmarksError] = useState(initialBookmarksError);
  const [selectedId, setSelectedId] = useState(() => initialBusinesses.items.find((item) => item.id === search.get("business"))?.id || initialBusinesses.items[0]?.id || "");
  const selected = listing.items.find((item) => item.id === selectedId) || listing.items[0] || null;
  const urlBusiness = search.get("business");
  const urlProfile = listing.items.find((item) => item.id === urlBusiness) || null;
  const initialEditorProfile = urlBusiness ? urlProfile : selected;
  const editor = useBusinessEditor(user.name, initialEditorProfile, sectionFor(view), (editorViews.includes(view) || (view === "profiles" && !!urlBusiness)) && !!initialEditorProfile && !initialProfilesError);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<OwnedBusiness | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const busy = loading || saving || acting || editor.busy;

  function expired() { router.push("/login?next=%2Fdashboard"); }
  function navigate(next: WorkspaceView, businessId?: string) {
    const url = new URL(dashboardHref(next, businessId), window.location.origin);
    if (listing.page > 1) url.searchParams.set("page", String(listing.page));
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
  }
  function edit(business: OwnedBusiness, section: EditorSection = "identity") {
    if (busy) return;
    editor.start(business, section, () => { setSelectedId(business.id); navigate(section === "story" ? "story" : section === "canvas" ? "canvas" : section === "ai" ? "ai" : "profiles", business.id); });
  }
  function changeView(next: WorkspaceView) {
    if (editorViews.includes(next) && selected && !profilesError) edit(selected, sectionFor(next));
    else navigate(next);
  }
  function create() { if (busy) return; editor.create(() => { setNotice(null); navigate("profiles"); }); }

  async function reloadProfiles(page = listing.page) {
    setLoading(true);
    const result = await fetchMyBusinesses(undefined, { page, limit: 50 });
    setLoading(false);
    if (!result.ok || !result.data) {
      if (result.code === "unauthenticated") return expired();
      setProfilesError(result.error || "Profil gagal dimuat."); return;
    }
    setListing(result.data); setProfilesError(undefined);
    const url = new URL(window.location.href);
    if (page > 1) url.searchParams.set("page", String(page)); else url.searchParams.delete("page");
    window.history.replaceState(null, "", `${url.pathname}${url.search}`);
  }
  async function reloadBookmarks() {
    const result = await fetchBookmarks();
    if (result.ok && result.data) { setBookmarks(result.data.items); setBookmarksError(undefined); }
    else { if (result.code === "unauthenticated") return expired(); setBookmarksError(result.error); }
  }
  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (busy) return;
    setSaving(true); setNotice(null);
    const result = editor.editing ? await updateBusinessApi(editor.editing.id, inputFromForm(editor.form)) : await createBusinessApi(inputFromForm(editor.form));
    setSaving(false);
    if (!result.ok || !result.business) {
      if (result.code === "unauthenticated") return expired();
      setNotice({ text: result.error || "Profil gagal disimpan.", error: true }); return;
    }
    const created = !editor.editing;
    const item = result.business;
    setListing((current) => ({ ...current, total: current.total + (created ? 1 : 0), items: created ? [item, ...current.items].slice(0, 50) : current.items.map((business) => business.id === item.id ? item : business) }));
    setSelectedId(item.id); editor.saved(); navigate("profiles");
    setNotice({ text: created ? "Draft profil berhasil disimpan. Profil belum tampil ke publik." : "Perubahan profil berhasil disimpan.", error: false });
    if (created) await reloadProfiles(1);
  }
  async function publish(business: OwnedBusiness) {
    if (busy) return; setActing(true); setNotice(null);
    const result = await publishBusinessApi(business.id); setActing(false);
    if (!result.ok || !result.business) {
      if (result.code === "unauthenticated") return expired();
      setNotice({ text: result.code === "email_not_verified" ? "Verifikasi email sebelum menerbitkan profil." : result.error || "Profil gagal diterbitkan.", error: true }); return;
    }
    setListing((current) => ({ ...current, items: current.items.map((item) => item.id === business.id ? result.business! : item) }));
    setNotice({ text: `${business.name} sudah terbit.`, error: false });
  }
  async function archive() {
    if (!archiveTarget || busy) return; setActing(true);
    const result = await archiveBusinessApi(archiveTarget.id); setActing(false);
    if (!result.ok) { if (result.code === "unauthenticated") return expired(); setNotice({ text: result.error || "Arsip gagal.", error: true }); return; }
    setArchiveTarget(null);
    if (editor.editing?.id === archiveTarget.id) editor.saved();
    setNotice({ text: `${archiveTarget.name} diarsipkan.`, error: false });
    setListing((current) => ({ ...current, total: Math.max(0, current.total - 1), items: current.items.filter((item) => item.id !== archiveTarget.id) }));
    await reloadProfiles(listing.items.length === 1 && listing.page > 1 ? listing.page - 1 : listing.page);
  }
  async function logout() {
    editor.guard(() => { void (async () => { setLogoutPending(true); const ok = await logoutApi(); setLogoutPending(false); if (ok) { router.push("/"); router.refresh(); } else setNotice({ text: "Gagal keluar. Coba lagi.", error: true }); })(); });
  }

  useEffect(() => {
    if (accountUser.emailVerified) return;
    function refreshUser() { void getMeApi().then((next) => { if (next) setAccountUser(next); }); }
    window.addEventListener("focus", refreshUser);
    return () => window.removeEventListener("focus", refreshUser);
  }, [accountUser.emailVerified]);

  const listProps = { businesses: listing.items, total: listing.total, page: listing.page, busy, error: profilesError, onPageChange: (page: number) => { void reloadProfiles(page); }, onRetry: () => { void reloadProfiles(); }, onCreate: create, onEdit: (business: OwnedBusiness) => edit(business, sectionFor(view)), onPublish: (business: OwnedBusiness) => editor.guardLeaving(() => { void publish(business); }), onArchive: (business: OwnedBusiness) => editor.guardLeaving(() => setArchiveTarget(business)) };
  const editorVisible = editor.open && ["profiles", ...editorViews].includes(view);

  return <WorkspaceShell user={accountUser} view={view} onViewChange={changeView} onLogout={logout} logoutPending={logoutPending} defaultSidebarOpen={defaultSidebarOpen}>
    {!accountUser.emailVerified ? <div className="mb-6 overflow-hidden rounded-lg border border-line"><EmailVerificationNotice user={accountUser} /></div> : null}
    {notice ? <p role={notice.error ? "alert" : "status"} className={`mb-6 rounded-lg border p-4 text-sm ${notice.error ? "border-red-200 bg-red-50 text-red-800" : "border-line bg-soft-green text-forest"}`}>{notice.text}</p> : null}
    {editor.open && !editorVisible ? <Card className="mb-6 flex-row flex-wrap items-center justify-between gap-3 border-line p-4 shadow-none"><p className="text-sm text-muted">{editor.dirty ? "Draft memiliki perubahan belum disimpan." : "Editor profil masih terbuka."}</p><Button onClick={() => navigate("profiles", editor.editing?.id)} className="min-h-11 bg-forest px-4 text-white">Kembali ke editor</Button></Card> : null}
    {view === "overview" ? <><DashboardOverview name={accountUser.name} total={listing.total} savedCount={bookmarks.length} profile={selected} businesses={listing.items} profilesError={profilesError} bookmarksError={bookmarksError} onSelect={setSelectedId} onCreate={create} onEdit={(section) => { if (selected) edit(selected, section); }} onSaved={() => navigate("saved")} onRetry={() => { void reloadProfiles(1); }} busy={busy} />{!profilesError && listing.total > 0 ? <BusinessList {...listProps} preview /> : null}{!profilesError && listing.total > 3 ? <Button variant="ghost" onClick={() => navigate("profiles")} className="mt-4 min-h-11 text-forest">Lihat semua profil</Button> : null}</> : null}
    <div hidden={!["profiles", ...editorViews].includes(view)}><div className="mb-6"><h1 className="text-2xl font-semibold tracking-tight text-forest">{view === "story" ? "Cerita dan perjalanan usaha" : view === "canvas" ? "Business Model Canvas" : view === "ai" ? "Susun profil dengan Lumora AI" : "Profil bisnis"}</h1><p className="mt-2 text-sm leading-6 text-muted">{view === "profiles" ? "Draft tetap privat sampai kamu menerbitkannya." : "Pilih profil bisnis, lalu lanjutkan mengisi bagian yang ingin kamu kelola."}</p></div>
      {editorViews.includes(view) && listing.items.length > 1 ? <div className="mb-5"><label htmlFor="workspace-profile" className="mr-3 text-sm text-muted">Profil bisnis</label><select id="workspace-profile" value={editor.editing?.id || selected?.id || ""} disabled={busy} onChange={(event) => { const target = listing.items.find((item) => item.id === event.target.value); if (target) edit(target, sectionFor(view)); }} className="min-h-11 max-w-full rounded-lg border border-line bg-surface px-3 text-sm">{listing.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div> : null}
      <div hidden={!editorVisible}>{editor.open ? <BusinessEditor key={editor.generation} form={editor.form} section={editorViews.includes(view) ? sectionFor(view) : editor.section} editingName={editor.editing?.name} dirty={editor.dirty} saving={saving} emailVerified={accountUser.emailVerified} onChange={editor.setForm} onSection={(section) => { editor.setSection(section); navigate(section === "story" ? "story" : section === "canvas" ? "canvas" : section === "ai" ? "ai" : "profiles", editor.editing?.id); }} onApply={editor.apply} onSubmit={save} onCancel={editor.close} onSessionExpired={expired} onBusyChange={editor.setBusy} /> : null}</div>
      {!editorVisible || view === "profiles" ? <BusinessList {...listProps} /> : null}
    </div>
    <div hidden={view !== "saved"}><h1 className="text-2xl font-semibold text-forest">Peluang & Mitra</h1><p className="mt-2 text-sm leading-6 text-muted">Temukan kembali bisnis yang kamu simpan. Daftar ini adalah profil tersimpan, bukan daftar peluang kemitraan.</p>{bookmarksError ? <Card role="alert" className="mt-6 border-line p-5 shadow-none"><p className="text-sm text-red-700">{bookmarksError}</p><Button onClick={reloadBookmarks} className="min-h-11 w-fit bg-forest px-4 text-white">Coba lagi</Button></Card> : <SavedBusinesses businesses={bookmarks} onBusinessesChange={setBookmarks} />}</div>
    <div hidden={view !== "settings"}><h1 className="text-2xl font-semibold text-forest">Pengaturan Akun</h1><AccountSettings user={accountUser} onUserChange={setAccountUser} /></div>
    {editor.pendingDiscard ? <WorkspaceConfirmation title="Buang perubahan yang belum disimpan?" description="Perubahan pada editor akan hilang. Profil yang sudah tersimpan tidak berubah." confirmLabel="Buang perubahan" cancelLabel="Lanjutkan mengedit" onConfirm={editor.acceptDiscard} onCancel={editor.cancelDiscard} /> : null}
    {archiveTarget ? <WorkspaceConfirmation title={`Arsipkan ${archiveTarget.name}?`} description="Profil hilang dari publik dan dashboard. Saat ini belum ada pemulihan arsip." confirmLabel="Ya, arsipkan" pending={acting} onConfirm={() => { void archive(); }} onCancel={() => setArchiveTarget(null)} /> : null}
  </WorkspaceShell>;
}
