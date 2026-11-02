"use client";

import { Store, Building2, Check } from "lucide-react";

export function RoleSelector({
  role,
  onSelect,
  disabled = false,
}: {
  role: "umkm" | "mitra";
  onSelect: (role: "umkm" | "mitra") => void;
  disabled?: boolean;
}) {
  const options = [
    {
      id: "umkm" as const,
      label: "Pemilik UMKM",
      badge: "Usaha Mandiri",
      description: "Untuk pemilik usaha yang ingin memperkenalkan bisnis, menampilkan BMC, dan membuka peluang kerjasama.",
      icon: Store,
    },
    {
      id: "mitra" as const,
      label: "Mitra Bisnis",
      badge: "Partner / Investor",
      description: "Untuk investor, distributor, supplier, dan mitra korporat yang mencari UMKM potensial.",
      icon: Building2,
    },
  ];

  return (
    <div className="space-y-2.5">
      <label className="block text-xs font-semibold uppercase tracking-wider text-forest/90">
        Pilih Peran Akun Anda
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" role="radiogroup" aria-label="Pilihan Peran Akun">
        {options.map((opt) => {
          const isSelected = role === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(opt.id)}
              className={`group relative flex flex-col justify-between rounded-2xl border p-4 sm:p-5 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-forest disabled:cursor-not-allowed disabled:opacity-60 ${
                isSelected
                  ? "border-forest bg-forest/[0.04] ring-1.5 ring-forest shadow-xs"
                  : "border-line bg-surface hover:border-forest/40 hover:bg-forest/[0.02]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex size-9 items-center justify-center rounded-xl transition-colors ${
                        isSelected
                          ? "bg-forest text-lime"
                          : "bg-forest/10 text-forest"
                      }`}
                    >
                      <opt.icon className="size-4.5" />
                    </div>
                    <span className="text-sm font-semibold text-forest">
                      {opt.label}
                    </span>
                  </div>
                  <div
                    className={`flex size-5 items-center justify-center rounded-full border transition-colors ${
                      isSelected
                        ? "border-forest bg-forest text-lime"
                        : "border-line bg-surface"
                    }`}
                  >
                    {isSelected ? <Check className="size-3 stroke-[2.5]" /> : null}
                  </div>
                </div>

                <p className="mt-3 text-xs leading-relaxed text-muted line-clamp-3">
                  {opt.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-line/60">
                <span
                  className={`inline-block rounded-md px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${
                    isSelected
                      ? "bg-forest text-lime"
                      : "bg-forest/8 text-forest/75"
                  }`}
                >
                  {opt.badge}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
