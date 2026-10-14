"use client";

import { PROFILE_STEPS } from "@/lib/profile-management";

export function ProfileStepper({ step, busy, onStep }: { step: number; busy: boolean; onStep: (step: number) => void }) {
  return <nav aria-label="Langkah pembuatan profil" className="my-5 border-y border-line/60 py-4">
    <p className="text-xs font-medium text-accent" aria-live="polite">Langkah {step + 1} dari {PROFILE_STEPS.length} · {PROFILE_STEPS[step]}</p>
    <ol className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">{PROFILE_STEPS.map((label, index) => <li key={label}><button type="button" disabled={busy} aria-current={step === index ? "step" : undefined} onClick={() => onStep(index)} className={`flex min-h-11 w-full items-center gap-2 rounded-lg px-2 text-left text-xs disabled:opacity-60 ${step === index ? "bg-forest text-white" : "bg-ivory text-forest hover:bg-soft-green"}`}><span className={`flex size-6 shrink-0 items-center justify-center rounded-full ${step === index ? "bg-lime text-forest" : "border border-line"}`}>{index + 1}</span><span className="hidden leading-5 sm:block">{label}</span><span className="sr-only sm:hidden">{label}</span></button></li>)}</ol>
  </nav>;
}
