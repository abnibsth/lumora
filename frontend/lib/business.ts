import type { Business } from "@/types/business";

/**
 * Business age as a label, derived from the founding year rather than stored, so
 * it cannot silently go stale in the data file.
 */
export function businessAge(foundedYear: number, now: Date = new Date()): string {
  const years = now.getFullYear() - foundedYear;
  if (years <= 0) return "Baru berdiri";
  return `${years} tahun berjalan`;
}

export function businessInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export type { Business };
