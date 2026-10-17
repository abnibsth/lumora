"use client";

import type { FormEvent } from "react";
import type { AIDraftProfile, Business } from "@/types/business";
import type { ProfileForm } from "@/lib/dashboard";
import type { ProfileError } from "@/lib/profile-management";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIDraftPanel } from "./ai-draft-panel";
import { NineBlockCanvas } from "./nine-block-canvas";
import { PartnershipWorkspace } from "./partnership-workspace";
import { BusinessStoryEditor } from "./business-story-editor";

export function WorkspaceDomainEditor({
  view,
  form,
  disabled,
  dirty,
  creating,
  emailVerified,
  hasProfile = true,
  onCreateProfile,
  businessName,
  bookmarks = [],
  bookmarksError,
  onBookmarksChange,
  onReloadBookmarks,
  onChange,
  onSubmit,
  onPreview,
  onApply,
  onBusyChange,
  onSessionExpired,
  errors = [],
}: {
  view: "story" | "canvas" | "saved" | "ai";
  form: ProfileForm;
  disabled: boolean;
  dirty: boolean;
  creating: boolean;
  hasProfile?: boolean;
  onCreateProfile?: () => void;
  emailVerified: boolean;
  businessName?: string;
  bookmarks?: Business[];
  bookmarksError?: string | null;
  onBookmarksChange?: (businesses: Business[]) => void;
  onReloadBookmarks?: () => void;
  errors?: ProfileError[];
  onChange: (form: ProfileForm) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onPreview: () => void;
  onApply: (draft: AIDraftProfile) => void;
  onBusyChange: (busy: boolean) => void;
  onSessionExpired: () => void;
}) {
  if (view === "saved") {
    return (
      <PartnershipWorkspace
        form={form}
        disabled={disabled}
        dirty={dirty}
        creating={creating}
        hasProfile={hasProfile}
        onCreateProfile={onCreateProfile}
        businessName={businessName}
        errors={errors}
        bookmarks={bookmarks}
        bookmarksError={bookmarksError}
        onChange={onChange}
        onSubmit={onSubmit}
        onPreview={onPreview}
        onBookmarksChange={onBookmarksChange}
        onReloadBookmarks={onReloadBookmarks}
        onSessionExpired={onSessionExpired}
      />
    );
  }

  if (view === "story") {
    return (
      <BusinessStoryEditor
        form={form}
        disabled={disabled}
        dirty={dirty}
        creating={creating}
        hasProfile={hasProfile}
        onCreateProfile={onCreateProfile}
        businessName={businessName}
        errors={errors}
        onChange={onChange}
        onSubmit={onSubmit}
        onPreview={onPreview}
      />
    );
  }

  return (
    <Card className={`gap-5 border-line/60 shadow-none ${view === "canvas" ? "p-3.5 sm:p-5 lg:p-6" : "p-5 sm:p-6"}`}>
      <p className="text-xs leading-6 text-muted">
        {creating
          ? "Draft baru — belum tersimpan di server. Simpan pertama memerlukan data inti Profil Bisnis dan cerita."
          : dirty
          ? "Ada perubahan belum disimpan pada bisnis ini. Simpan halaman ini tidak membuang perubahan halaman lain."
          : "Data terhubung ke profil bisnis yang dipilih."}
      </p>
      {view === "ai" ? (
        <>
          <AIDraftPanel
            emailVerified={emailVerified}
            disabled={disabled}
            onApply={onApply}
            onSessionExpired={onSessionExpired}
            onBusyChange={onBusyChange}
          />
          <p className="text-xs leading-6 text-muted">
            Hasil AI belum disimpan. Tinjau setiap bagian melalui Profil Bisnis, Cerita Usaha, BMC, dan Peluang & Mitra.
          </p>
        </>
      ) : (
        <form noValidate onSubmit={onSubmit} className="space-y-5">
          <fieldset disabled={disabled} className="min-w-0">
            <legend className="sr-only">Editor model bisnis</legend>
            <NineBlockCanvas items={form.bmc} disabled={disabled} onChange={(bmc) => onChange({ ...form, bmc })} />
          </fieldset>
          <div className="flex flex-wrap gap-3 border-t border-line/60 pt-4">
            <Button type="submit" disabled={disabled} className="min-h-11 bg-forest px-4 text-white">
              {disabled ? "Memproses..." : creating ? "Simpan draft pertama" : "Simpan model bisnis"}
            </Button>
            <Button type="button" disabled={disabled} variant="outline" onClick={onPreview} className="min-h-11 border-line px-4 text-forest">
              Preview profil
            </Button>
          </div>
        </form>
      )}
    </Card>
  );
}
