"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Handshake,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Building2,
  Store,
  ArrowRight,
} from "lucide-react";
import { buttonStyles } from "@/components/ui/button";
import { createCollaborationApi } from "@/lib/api";
import {
  MASTER_TAXONOMY_LIST,
  MASTER_TAXONOMY_REGISTRY,
  type MasterTaxonomyID,
} from "@/types/partner";
import type { CollaborationRequest } from "@/types/collaboration";
import type { User } from "@/types/user";

export function CollaborationModal({
  open,
  onOpenChange,
  targetUser,
  business,
  partnerProfile,
  currentUser,
  defaultCollaborationType,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetUser: { id: string; name: string; role: "umkm" | "mitra" };
  business?: { id: string; name: string; slug: string; category?: string };
  partnerProfile?: { id: string; companyName: string };
  currentUser: User;
  defaultCollaborationType?: string;
  onSuccess?: (req: CollaborationRequest) => void;
}) {
  const isMitraSender = currentUser.role === "mitra";
  const direction = isMitraSender ? "partner_to_umkm" : "umkm_to_partner";

  const [collaborationType, setCollaborationType] = useState<string>(
    defaultCollaborationType || "PRODUCT_DISTRIBUTION",
  );
  const [title, setTitle] = useState(
    business
      ? `Pengajuan Kemitraan dengan ${business.name}`
      : partnerProfile
        ? `Pengajuan Kolaborasi dengan ${partnerProfile.companyName}`
        : "Pengajuan Kolaborasi Kemitraan",
  );
  const [message, setMessage] = useState("");
  const [proposalDetail, setProposalDetail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    const result = await createCollaborationApi({
      receiverUserId: targetUser.id,
      businessId: business?.id,
      partnerProfileId: partnerProfile?.id,
      direction,
      collaborationType,
      title,
      message,
      proposalDetail,
    });

    setSubmitting(false);

    if (!result.ok || !result.request) {
      setError(result.error || "Gagal mengirim pengajuan kolaborasi.");
      return;
    }

    setSubmitted(true);
    if (onSuccess) {
      onSuccess(result.request);
    }

    setTimeout(() => {
      setSubmitted(false);
      onOpenChange(false);
    }, 1500);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl border border-line bg-surface p-5 sm:p-6 shadow-xl">
        <DialogHeader className="space-y-1 text-left border-b border-line/60 pb-3">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-forest/15 bg-soft-green/60 px-2.5 py-0.5 text-[11px] font-semibold text-forest w-fit">
            <Handshake className="size-3" />
            <span>Inisiasi Kemitraan Resmi</span>
          </div>
          <DialogTitle className="font-display text-xl sm:text-2xl font-semibold text-forest">
            Ajukan Kolaborasi
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted">
            Kirimkan proposal kemitraan terstruktur kepada{" "}
            <strong>{business?.name || partnerProfile?.companyName || targetUser.name}</strong>.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-10 text-center space-y-3">
            <div className="flex size-14 mx-auto items-center justify-center rounded-full bg-soft-green text-forest">
              <CheckCircle2 className="size-8" />
            </div>
            <h3 className="font-display text-lg font-semibold text-forest">
              Pengajuan Kolaborasi Berhasil Dikirim!
            </h3>
            <p className="text-xs sm:text-sm text-muted max-w-sm mx-auto">
              Pihak mitra akan menerima notifikasi di menu Permintaan Kolaborasi. Jalur percakapan Inbox akan terbuka otomatis saat disetujui.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 pt-2">
            {/* Target context banner */}
            <div className="flex items-center gap-3 rounded-xl border border-line bg-ivory/50 p-3 text-xs text-forest">
              {isMitraSender ? (
                <Store className="size-5 shrink-0 text-accent" />
              ) : (
                <Building2 className="size-5 shrink-0 text-accent" />
              )}
              <div className="min-w-0">
                <span className="font-semibold block truncate">
                  {business?.name || partnerProfile?.companyName || targetUser.name}
                </span>
                <span className="text-[11px] text-muted block truncate">
                  Penerima: {targetUser.name} ({targetUser.role === "umkm" ? "Pemilik UMKM" : "Mitra Bisnis"})
                </span>
              </div>
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-center gap-2 rounded-lg border border-red-300 bg-red-50 p-3 text-xs font-medium text-red-900"
              >
                <AlertCircle className="size-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Field: Jenis Kemitraan */}
            <div>
              <label
                htmlFor="collabType"
                className="block text-xs font-semibold text-forest mb-1"
              >
                Bentuk / Jenis Kemitraan (Master Taxonomy)
              </label>
              <select
                id="collabType"
                value={collaborationType}
                onChange={(e) => setCollaborationType(e.target.value)}
                className="block h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs sm:text-sm text-forest focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              >
                {MASTER_TAXONOMY_LIST.map((taxID) => {
                  const meta = MASTER_TAXONOMY_REGISTRY[taxID];
                  return (
                    <option key={taxID} value={taxID}>
                      {isMitraSender ? meta.partnerOfferLabel : meta.umkmSeekLabel} ({meta.cluster})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Field: Judul Pengajuan */}
            <div>
              <label
                htmlFor="title"
                className="block text-xs font-semibold text-forest mb-1"
              >
                Judul Pengajuan
              </label>
              <input
                id="title"
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Kemitraan Distribusi Produk Wilayah Jawa Barat"
                className="block h-10 w-full rounded-lg border border-line bg-white px-3 py-2 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest"
              />
            </div>

            {/* Field: Pesan Pengantar */}
            <div>
              <label
                htmlFor="message"
                className="block text-xs font-semibold text-forest mb-1"
              >
                Pesan Pengantar
              </label>
              <textarea
                id="message"
                rows={3}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Perkenalkan latar belakang Anda dan jelaskan secara singkat mengapa Anda tertarik berkolaborasi..."
                className="block w-full rounded-lg border border-line bg-white p-3 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
              />
            </div>

            {/* Field: Rincian Proposal */}
            <div>
              <label
                htmlFor="proposalDetail"
                className="block text-xs font-semibold text-forest mb-1"
              >
                Detail Proposal & Ekspektasi Kerjasama (Opsional)
              </label>
              <textarea
                id="proposalDetail"
                rows={3}
                value={proposalDetail}
                onChange={(e) => setProposalDetail(e.target.value)}
                placeholder="Rincian kuota, target kuartal, estimasi komitmen, atau skema bagi hasil awal yang ingin didiskusikan..."
                className="block w-full rounded-lg border border-line bg-white p-3 text-xs sm:text-sm text-forest placeholder:text-muted/60 focus:border-forest focus:outline-none focus:ring-1 focus:ring-forest leading-relaxed"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line/60">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className={buttonStyles({
                  variant: "secondary",
                  size: "sm",
                })}
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={submitting}
                className={buttonStyles({
                  variant: "primary",
                  size: "sm",
                  className: "gap-1.5 shadow-2xs font-semibold min-w-32",
                })}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    <span>Mengirim...</span>
                  </>
                ) : (
                  <>
                    <span>Kirim Pengajuan</span>
                    <ArrowRight className="size-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

