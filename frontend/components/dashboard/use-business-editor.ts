"use client";

import { useEffect, useState } from "react";
import { applyDraft, emptyForm, formFromBusiness, type EditorSection, type ProfileForm } from "@/lib/dashboard";
import type { AIDraftProfile, OwnedBusiness } from "@/types/business";

export function useBusinessEditor(ownerName: string, initialBusiness: OwnedBusiness | null, initialSection: EditorSection, initiallyOpen: boolean) {
  const [editing, setEditing] = useState<OwnedBusiness | null>(initialBusiness);
  const [form, setForm] = useState<ProfileForm>(() => initialBusiness ? formFromBusiness(initialBusiness) : emptyForm(ownerName));
  const [baseline, setBaseline] = useState(() => JSON.stringify(initialBusiness ? formFromBusiness(initialBusiness) : emptyForm(ownerName)));
  const [open, setOpen] = useState(initiallyOpen);
  const [section, setSection] = useState<EditorSection>(initialSection);
  const [busy, setBusy] = useState(false);
  const [generation, setGeneration] = useState(0);
  const [pendingDiscard, setPendingDiscard] = useState<{ action: () => void } | null>(null);
  const dirty = open && JSON.stringify(form) !== baseline;

  useEffect(() => {
    if (!dirty) return;
    function warn(event: BeforeUnloadEvent) { event.preventDefault(); }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function guard(action: () => void) {
    if (busy) return;
    if (dirty) setPendingDiscard({ action });
    else action();
  }
  function guardLeaving(action: () => void) {
    guard(() => { setOpen(false); setEditing(null); action(); });
  }
  function load(business: OwnedBusiness | null, target: EditorSection) {
    const next = business ? formFromBusiness(business) : emptyForm(ownerName);
    setEditing(business); setForm(next); setBaseline(JSON.stringify(next)); setSection(target); setOpen(true); setGeneration((value) => value + 1);
  }
  function start(business: OwnedBusiness | null, target: EditorSection, after?: () => void) {
    if (busy) return;
    if (open && editing?.id === business?.id && (business !== null || editing === null)) { setSection(target); after?.(); return; }
    guard(() => { load(business, target); after?.(); });
  }
  function create(after?: () => void) { guard(() => { load(null, "identity"); after?.(); }); }
  function close() { guard(() => { setOpen(false); setEditing(null); setForm(emptyForm(ownerName)); }); }
  function saved() { setOpen(false); setEditing(null); setBaseline(JSON.stringify(form)); }
  function acceptDiscard() { const action = pendingDiscard?.action; setPendingDiscard(null); action?.(); }
  function apply(draft: AIDraftProfile) { setForm((current) => applyDraft(current, draft)); }
  return { editing, form, setForm, open, section, setSection, busy, setBusy, generation, dirty, pendingDiscard, cancelDiscard: () => setPendingDiscard(null), acceptDiscard, guard, guardLeaving, start, create, close, saved, apply };
}
