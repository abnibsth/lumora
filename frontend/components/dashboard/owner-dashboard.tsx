"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
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
import { BusinessProfilePreview } from "./business-profile-preview";
import { previewFromForm, SECTION_FOR_STEP, type ProfileError } from "@/lib/profile-management";
import { BUSINESS_VIEWS, scopedPatch, validateWorkspace, viewForField, resolveOwnedSelection, type BusinessWorkspace } from "@/lib/workspace-management";
import { WorkspaceDomainEditor } from "./workspace-domain-editor";
import { WorkspacePageHeader } from "./workspace-header";
import { archiveBusinessApi, createBusinessApi, fetchBookmarks, fetchMyBusinesses, getMeApi, logoutApi, publishBusinessApi, updateBusinessApi, type OwnedBusinessListResponse } from "@/lib/api";
import { dashboardHref, inputFromForm, resolveView, type EditorSection, type WorkspaceView } from "@/lib/dashboard";
import type { Business, OwnedBusiness } from "@/types/business";
import type { User } from "@/types/user";

function sectionFor(view: WorkspaceView): EditorSection { return view === "story" ? "story" : view === "canvas" ? "canvas" : view === "ai" ? "ai" : view === "saved" ? "partners" : "identity"; }
const editorViews = ["story", "canvas", "saved", "ai"];

export function OwnerDashboard({ user, initialBusinesses, initialBookmarks, profilesError: initialProfilesError, bookmarksError: initialBookmarksError, defaultSidebarOpen = true }: {
  user: User; initialBusinesses: OwnedBusinessListResponse; initialBookmarks: Business[]; profilesError?: string; bookmarksError?: string; defaultSidebarOpen?: boolean;
}) {
  const router = useRouter();
  const search = useSearchParams();
  const [viewState, setViewState] = useState<WorkspaceView>(() => resolveView(search.get("view")));
  const view = viewState;
  const [accountUser, setAccountUser] = useState(user);
  const [listing, setListing] = useState(initialBusinesses);
  const [bookmarks, setBookmarks] = useState(initialBookmarks);
  const [profilesError, setProfilesError] = useState(initialProfilesError);
  const [bookmarksError, setBookmarksError] = useState(initialBookmarksError);
  const [resolvedBusinesses, setResolvedBusinesses] = useState<OwnedBusiness[]>([]);
  const ownedItems = useMemo(() => [...listing.items, ...resolvedBusinesses.filter((item) => !listing.items.some((row) => row.id === item.id))], [listing.items, resolvedBusinesses]);
  const [selectedId, setSelectedId] = useState(() => initialBusinesses.items.find((item) => item.id === search.get("business"))?.id || initialBusinesses.items[0]?.id || "");
  const selected = resolveOwnedSelection(ownedItems, search.get("business") || selectedId || null);
  const urlBusiness = search.get("business");
  const urlProfile = ownedItems.find((item) => item.id === urlBusiness) || null;
  const initialEditorProfile = urlBusiness ? urlProfile : selected;
  const editor = useBusinessEditor(user.name, initialEditorProfile, sectionFor(view), (editorViews.includes(view) || (view === "profiles" && !!urlBusiness)) && !!initialEditorProfile && !initialProfilesError);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [acting, setActing] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<OwnedBusiness | null>(null);
  const [preview, setPreview] = useState<{ business: OwnedBusiness; unsaved: boolean } | null>(null);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [validationErrors, setValidationErrors] = useState<ProfileError[]>([]);
  const busy = loading || saving || acting || editor.busy;
  const currentUrl = useRef<string | null>(null);
  const invalidBusiness = !!urlBusiness && !urlProfile && editor.editing?.id !== urlBusiness;
  const editorRef = useRef(editor);
  useEffect(() => { editorRef.current = editor; }, [editor]);

  useEffect(() => {
    if (!urlBusiness || ownedItems.some((item) => item.id === urlBusiness) || profilesError) return;
    let cancelled = false;
    async function resolveOwnedBusiness() {
      const pages = Math.ceil(listing.total / 50);
      for (let page = 1; page <= pages; page++) {
        if (page === listing.page || cancelled) continue;
        const result = await fetchMyBusinesses(undefined, { page, limit: 50 });
        if (cancelled || !result.ok || !result.data) return;
        const found = result.data.items.find((item) => item.id === urlBusiness);
        if (found) {
          setResolvedBusinesses((current) => [...current.filter((item) => item.id !== found.id), found]);
          editorRef.current.start(found, sectionFor(view), () => setSelectedId(found.id));
          return;
        }
      }
    }
    void resolveOwnedBusiness();
    return () => { cancelled = true; };
  }, [urlBusiness, listing.total, listing.page, profilesError, view, ownedItems]);

  useEffect(() => {
    const nextView = resolveView(search.get("view"));
    setViewState(nextView);
    const businessParam = search.get("business");
    if (businessParam) setSelectedId(businessParam);
    currentUrl.current = window.location.pathname + window.location.search;
  }, [search]);

  useEffect(() => {
    function restoreHistory() {
      const url = new URL(window.location.href);
      const nextView = resolveView(url.searchParams.get("view"));
      setViewState(nextView);
      const id = url.searchParams.get("business");
      if (id) setSelectedId(id);
      const previous = currentUrl.current;
      if (busy && previous) { window.history.replaceState(null, "", previous); return; }
      const target = resolveOwnedSelection(ownedItems, id);
      if (!target || editor.editing?.id === target.id || (editor.open && !editor.editing && !id)) return;
      const destination = url.pathname + url.search;
      if (editor.dirty && previous) window.history.replaceState(null, "", previous);
      editor.start(target, sectionFor(nextView), () => { setSelectedId(target.id); window.history.replaceState(null, "", destination); });
    }
    window.addEventListener("popstate", restoreHistory);
    return () => window.removeEventListener("popstate", restoreHistory);
  }, [editor, ownedItems, busy]);

  function expired() { router.push("/login?next=%2Fdashboard"); }
  function navigate(next: WorkspaceView, businessId: string | null | undefined = editor.open ? editor.editing?.id : selected?.id) {
    setViewState(next);
    const targetId = businessId || (editor.open ? editor.editing?.id : selected?.id);
    if (targetId) setSelectedId(targetId);
    const url = new URL(dashboardHref(next, targetId || undefined), window.location.origin);
    if (listing.page > 1) url.searchParams.set("page", String(listing.page));
    window.history.pushState(null, "", `${url.pathname}${url.search}`);
  }
  function edit(business: OwnedBusiness, section: EditorSection = "identity") {
    if (busy) return;
    const targetView = section === "story" ? "story" : section === "canvas" ? "canvas" : section === "ai" ? "ai" : section === "partners" ? "saved" : "profiles";
    editor.start(business, section, () => {
      setSelectedId(business.id);
      navigate(targetView, business.id);
    });
  }
  function changeView(next: WorkspaceView) {
    if (busy) return;
    if (editor.open) {
      editor.setSection(sectionFor(next));
      navigate(next);
    } else if (editorViews.includes(next) && selected && !profilesError) {
      edit(selected, sectionFor(next));
    } else {
      navigate(next);
    }
  }
  function create() {
    if (busy) return;
    editor.create(() => {
      setNotice(null);
      navigate("profiles", null);
    });
  }

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
    const domain = (BUSINESS_VIEWS.includes(view) ? view : "profiles") as BusinessWorkspace;
    const issues = validateWorkspace(editor.form, domain, !editor.editing);
    setValidationErrors(issues);
    if (issues.length) {
      const first = issues[0];
      const targetView = viewForField(first.field);
      editor.setSection(targetView === "profiles" ? SECTION_FOR_STEP[Math.min(first.step, 3)] : sectionFor(targetView));
      navigate(targetView);
      setNotice({ text: issues.map((issue) => issue.message).join(" "), error: true });
      requestAnimationFrame(() => document.getElementById(first.field.startsWith("bmc-") || first.field.startsWith("milestone-") ? first.field : `profile-${first.field}`)?.focus());
      return;
    }
    setSaving(true); setNotice(null);
    const result = editor.editing ? await updateBusinessApi(editor.editing.id, scopedPatch(editor.form, editor.baselineForm, domain)) : await createBusinessApi(inputFromForm(editor.form));
    setSaving(false);
    if (!result.ok || !result.business) {
      if (result.code === "unauthenticated") return expired();
      setNotice({ text: result.error || "Profil gagal disimpan.", error: true }); return;
    }
    const created = !editor.editing;
    const item = result.business;
    setListing((current) => ({ ...current, total: current.total + (created ? 1 : 0), items: created ? [item, ...current.items].slice(0, 50) : current.items.map((business) => business.id === item.id ? item : business) }));
    setResolvedBusinesses((current) => current.map((row) => row.id === item.id ? item : row));
    setSelectedId(item.id); editor.acceptSaved(item, domain); navigate(view, item.id);
    setNotice({ text: created ? "Draft profil berhasil disimpan. Profil belum tampil ke publik." : domain === "story" ? "Cerita usaha berhasil disimpan." : domain === "canvas" ? "Model bisnis berhasil disimpan." : domain === "saved" ? "Kebutuhan kerja sama berhasil disimpan." : "Perubahan profil berhasil disimpan.", error: false });
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

  const listProps = { emailVerified: accountUser.emailVerified, onPreview: (business: OwnedBusiness) => setPreview({ business, unsaved: false }), businesses: listing.items, total: listing.total, page: listing.page, busy, error: profilesError, onPageChange: (page: number) => { void reloadProfiles(page); }, onRetry: () => { void reloadProfiles(); }, onCreate: create, onEdit: (business: OwnedBusiness) => edit(business, sectionFor(view)), onPublish: (business: OwnedBusiness) => editor.guardLeaving(() => { void publish(business); }), onArchive: (business: OwnedBusiness) => editor.guardLeaving(() => setArchiveTarget(business)) };
  const editorVisible = editor.open && !invalidBusiness && ["profiles", ...editorViews].includes(view);

  return <WorkspaceShell user={accountUser} view={view} onViewChange={changeView} onLogout={logout} logoutPending={logoutPending} defaultSidebarOpen={defaultSidebarOpen}>
    {!accountUser.emailVerified ? <div className="mb-6 overflow-hidden rounded-lg border border-line"><EmailVerificationNotice user={accountUser} /></div> : null}
    {notice ? <p role={notice.error ? "alert" : "status"} className={`mb-6 rounded-lg border p-4 text-sm ${notice.error ? "border-red-200 bg-red-50 text-red-800" : "border-line bg-soft-green text-forest"}`}>{notice.text}</p> : null}
    {editor.open && !editorVisible ? <Card className="mb-6 flex-row flex-wrap items-center justify-between gap-3 border-line p-4 shadow-none"><p className="text-sm text-muted">{editor.dirty ? "Draft memiliki perubahan belum disimpan." : "Editor profil masih terbuka."}</p><Button onClick={() => navigate("profiles", editor.editing?.id)} className="min-h-11 bg-forest px-4 text-white">Kembali ke editor</Button></Card> : null}
    {view === "overview" ? <><DashboardOverview name={accountUser.name} total={listing.total} savedCount={bookmarks.length} profile={selected} businesses={listing.items} profilesError={profilesError} bookmarksError={bookmarksError} onSelect={(id) => { const target = ownedItems.find((item) => item.id === id); if (target) editor.start(target, "identity", () => { setSelectedId(id); navigate("overview", id); }); }} onCreate={create} onEdit={(section) => { if (selected) edit(selected, section); }} onSaved={() => changeView("saved")} onRetry={() => { void reloadProfiles(1); }} busy={busy} />{!profilesError && listing.total > 0 ? <BusinessList {...listProps} preview /> : null}{!profilesError && listing.total > 3 ? <Button variant="ghost" onClick={() => navigate("profiles")} className="mt-4 min-h-11 text-forest">Lihat semua profil</Button> : null}</> : null}
    <div hidden={!["profiles", ...editorViews].includes(view)} className="w-full min-w-0"><WorkspacePageHeader view={view} />
      {ownedItems.length > 0 ? <div className="mb-5"><label htmlFor="workspace-profile" className="mr-3 text-sm text-muted">Profil bisnis</label><select id="workspace-profile" value={invalidBusiness ? "" : editor.open ? editor.editing?.id || "new" : selected?.id || ""} disabled={busy} onChange={(event) => { const target = ownedItems.find((item) => item.id === event.target.value); if (target) edit(target, sectionFor(view)); }} className="min-h-11 max-w-full rounded-lg border border-line bg-surface px-3 text-sm">{editor.open && !editor.editing ? <option value="new">Draft baru — belum tersimpan</option> : null}<option value="" disabled>Pilih profil bisnis</option>{ownedItems.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div> : editor.open ? <p className="mb-5 text-sm font-medium text-accent">Draft baru — belum tersimpan</p> : null}
      {invalidBusiness ? <p role="alert" className="mb-5 rounded-lg bg-red-50 p-4 text-sm text-red-700">Profil pada URL tidak ditemukan dalam data milik akun ini. Pilih profil yang tersedia; tidak ada profil lain yang dibuka otomatis.</p> : null}
      <div hidden={!editorVisible} className="w-full min-w-0">{editor.open ? <>
        <div hidden={view !== "profiles"} className="w-full min-w-0">{view === "profiles" ? <BusinessEditor validationErrors={validationErrors} key={editor.generation} form={editor.form} section={editor.section} editingName={editor.editing?.name} dirty={editor.dirty} saving={saving} onChange={editor.setForm} onSection={editor.setSection} onSubmit={save} onCancel={editor.close} onSessionExpired={expired} onBusyChange={editor.setBusy} onPreview={() => setPreview({ business: previewFromForm(editor.form, editor.editing), unsaved: editor.dirty || !editor.editing })} onWorkspace={changeView} /> : null}</div>
        {editorViews.map((domain) => (
          <div key={`${editor.generation}-${domain}`} hidden={view !== domain} className="w-full min-w-0">
            {domain === "ai" || view === domain ? (
              <WorkspaceDomainEditor
                errors={validationErrors}
                view={domain as "story" | "canvas" | "saved" | "ai"}
                form={editor.form}
                disabled={busy}
                dirty={editor.dirty}
                creating={!editor.editing}
                businessName={editor.editing?.name}
                bookmarks={bookmarks}
                bookmarksError={bookmarksError}
                onBookmarksChange={setBookmarks}
                onReloadBookmarks={reloadBookmarks}
                emailVerified={accountUser.emailVerified}
                onChange={editor.setForm}
                onSubmit={save}
                onPreview={() => setPreview({ business: previewFromForm(editor.form, editor.editing), unsaved: editor.dirty || !editor.editing })}
                onApply={editor.apply}
                onBusyChange={editor.setBusy}
                onSessionExpired={expired}
              />
            ) : null}
          </div>
        ))}
      </> : null}</div>
      {view === "profiles" ? (
        <BusinessList {...listProps} />
      ) : !editorVisible ? (
        view === "saved" || view === "story" ? (
          <WorkspaceDomainEditor
            errors={validationErrors}
            view={view}
            form={editor.form}
            disabled={busy}
            dirty={false}
            creating={false}
            hasProfile={false}
            onCreateProfile={create}
            bookmarks={bookmarks}
            bookmarksError={bookmarksError}
            onBookmarksChange={setBookmarks}
            onReloadBookmarks={reloadBookmarks}
            emailVerified={accountUser.emailVerified}
            onChange={editor.setForm}
            onSubmit={save}
            onPreview={() => {}}
            onApply={editor.apply}
            onBusyChange={editor.setBusy}
            onSessionExpired={expired}
          />
        ) : (
          <Card className="gap-3 border-line/60 p-5 shadow-none">
            <h2 className="text-lg font-semibold text-forest">Pilih profil untuk dikelola</h2>
            <p className="text-sm leading-6 text-muted">
              {profilesError || "Pilih bisnis pada menu di atas. Jika belum ada, mulai dari Profil Bisnis; semua bagian akan memakai draft yang sama."}
            </p>
            {profilesError ? (
              <Button disabled={busy} onClick={() => { void reloadProfiles(); }} className="min-h-11 w-fit bg-forest px-4 text-white">
                Coba lagi
              </Button>
            ) : (
              <Button disabled={busy} onClick={create} className="min-h-11 w-fit bg-forest px-4 text-white">
                Buat profil bisnis
              </Button>
            )}
          </Card>
        )
      ) : null}
    </div>
    <div hidden={view !== "settings"}><h1 className="text-2xl font-semibold text-forest">Pengaturan Akun</h1><AccountSettings user={accountUser} onUserChange={setAccountUser} /></div>
    {preview ? <BusinessProfilePreview business={preview.business} unsaved={preview.unsaved} onClose={() => setPreview(null)} /> : null}
    {editor.pendingDiscard ? <WorkspaceConfirmation title="Buang perubahan yang belum disimpan?" description="Perubahan pada editor akan hilang. Profil yang sudah tersimpan tidak berubah." confirmLabel="Buang perubahan" cancelLabel="Lanjutkan mengedit" onConfirm={editor.acceptDiscard} onCancel={editor.cancelDiscard} /> : null}
    {archiveTarget ? <WorkspaceConfirmation title={`Arsipkan ${archiveTarget.name}?`} description="Profil hilang dari publik dan dashboard. Saat ini belum ada pemulihan arsip." confirmLabel="Ya, arsipkan" pending={acting} onConfirm={() => { void archive(); }} onCancel={() => setArchiveTarget(null)} /> : null}
  </WorkspaceShell>;
}
