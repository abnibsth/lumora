"use client";

import { Dialog } from "radix-ui";
import { X } from "lucide-react";
import type { OwnedBusiness } from "@/types/business";
import { BusinessProfileView } from "@/components/business/business-profile-view";
import styles from "./workspace.module.css";

export function BusinessProfilePreview({
  business,
  unsaved,
  onClose,
}: {
  business: OwnedBusiness;
  unsaved: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-deep-forest/60 backdrop-blur-xs" />
        <Dialog.Content
          className={`${styles.portal} fixed inset-0 z-50 flex flex-col bg-surface sm:inset-6 sm:mx-auto sm:max-w-[960px] sm:rounded-2xl sm:border sm:border-line sm:shadow-2xl overflow-hidden`}
        >
          {/* Sticky/Fixed Modal Header */}
          <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line bg-surface p-4 sm:px-6">
            <div className="min-w-0">
              <Dialog.Title className="text-base font-semibold text-forest">
                Preview Profil Bisnis
              </Dialog.Title>
              <Dialog.Description className="mt-0.5 text-xs text-muted">
                Preview privat
                {unsaved
                  ? " · Perubahan belum disimpan"
                  : business.status === "draft"
                    ? " · Draft belum diterbitkan"
                    : " · Profil sudah terbit"}
                . Membuka preview tidak menyimpan atau menerbitkan profil.
              </Dialog.Description>
            </div>
            <Dialog.Close
              className="flex size-10 shrink-0 items-center justify-center rounded-lg text-forest hover:bg-soft-green transition-colors"
              aria-label="Tutup preview"
            >
              <X className="size-5" />
            </Dialog.Close>
          </header>

          {/* Scrollable Preview Body using the unified BusinessProfileView */}
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-ivory">
            <BusinessProfileView
              business={business}
              isModal={true}
              isUnsaved={unsaved}
            />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
