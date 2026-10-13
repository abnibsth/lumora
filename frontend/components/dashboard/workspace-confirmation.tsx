"use client";

import { AlertDialog } from "radix-ui";
import { Button } from "@/components/ui/button";
import styles from "./workspace.module.css";

export function WorkspaceConfirmation({ title, description, confirmLabel, cancelLabel = "Batal", pending = false, onConfirm, onCancel }: { title: string; description: string; confirmLabel: string; cancelLabel?: string; pending?: boolean; onConfirm: () => void; onCancel: () => void }) {
  return <AlertDialog.Root open onOpenChange={(open) => { if (!open && !pending) onCancel(); }}><AlertDialog.Portal>
    <AlertDialog.Overlay className="fixed inset-0 z-50 bg-deep-forest/40" />
    <AlertDialog.Content className={`${styles.portal} fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-line p-6 shadow-xl`} onEscapeKeyDown={(event) => { if (pending) event.preventDefault(); }}>
      <AlertDialog.Title className="text-lg font-semibold text-forest">{title}</AlertDialog.Title>
      <AlertDialog.Description className="mt-3 text-sm leading-7 text-muted">{description}</AlertDialog.Description>
      <div className="mt-6 flex flex-wrap gap-3"><AlertDialog.Cancel asChild><Button disabled={pending} className="min-h-11 bg-forest px-4 text-white hover:bg-deep-forest">{cancelLabel}</Button></AlertDialog.Cancel><Button disabled={pending} onClick={onConfirm} variant="outline" className="min-h-11 border-line bg-surface px-4 text-red-700">{pending ? "Memproses..." : confirmLabel}</Button></div>
    </AlertDialog.Content>
  </AlertDialog.Portal></AlertDialog.Root>;
}
