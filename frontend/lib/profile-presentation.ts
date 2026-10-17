import type {
  Business,
  BusinessMilestone,
  BmcEntry,
  OwnedBusiness,
} from "@/types/business";

/**
 * Validates financial metric strings (e.g. revenueLabel or growthLabel).
 * Rejects values that evaluate to Infinity, NaN, undefined strings, or lack numbers.
 */
export function validFinancialLabel(value?: string | null): string | undefined {
  if (!value || typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;

  // Reject invalid mathematical artifacts
  if (/(?:infinity|nan|null|undefined|tak terhingga)/i.test(trimmed)) {
    return undefined;
  }

  // Must contain at least one digit or percentage or currency indicator
  if (!/\d/.test(trimmed)) {
    return undefined;
  }

  return trimmed;
}

/**
 * Validates and cleans numerical revenue chart series.
 * Requires at least 2 finite non-negative numbers to display a meaningful trend.
 */
export function cleanRevenueSeries(series?: unknown): number[] | undefined {
  if (!Array.isArray(series)) return undefined;

  const valid = series.filter(
    (item): item is number =>
      typeof item === "number" &&
      Number.isFinite(item) &&
      !Number.isNaN(item) &&
      item >= 0,
  );

  return valid.length >= 2 ? valid : undefined;
}

/**
 * Filters milestones that have meaningful content.
 */
export function cleanMilestones(
  milestones?: BusinessMilestone[] | null,
): BusinessMilestone[] {
  if (!Array.isArray(milestones)) return [];

  return milestones.filter(
    (item) => Boolean(item?.title?.trim()) || Boolean(item?.description?.trim()),
  );
}

/**
 * Filters BMC entries that have both a non-empty label and value.
 */
export function cleanBmc(bmc?: BmcEntry[] | null): BmcEntry[] {
  if (!Array.isArray(bmc)) return [];

  return bmc.filter(
    (item) => Boolean(item?.label?.trim()) && Boolean(item?.value?.trim()),
  );
}

/**
 * Filters partnership needs (seeking).
 */
export function cleanSeeking(seeking?: string[] | null): string[] {
  if (!Array.isArray(seeking)) return [];

  return seeking
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter(Boolean);
}

/**
 * Formats founded year safely.
 */
export function formatFoundedYear(year?: number | null): string | undefined {
  const currentYear = new Date().getFullYear();
  if (
    typeof year === "number" &&
    Number.isInteger(year) &&
    year >= 1800 &&
    year <= currentYear
  ) {
    return `Berdiri ${year}`;
  }
  return undefined;
}

/**
 * Checks whether the business has genuine performance metrics.
 * Does not invent data. If no valid metrics exist, the section will be omitted.
 */
export function hasPerformanceData(
  business: Pick<Business, "revenueLabel" | "growthLabel" | "revenueSeries">,
): boolean {
  const hasRevenue = Boolean(validFinancialLabel(business.revenueLabel));
  const hasGrowth = Boolean(validFinancialLabel(business.growthLabel));
  const hasSeries = Boolean(cleanRevenueSeries(business.revenueSeries));
  return hasRevenue || hasGrowth || hasSeries;
}

export interface PresentedProfile {
  name: string;
  category: string;
  location?: string;
  foundedYearLabel?: string;
  description?: string;
  coverImage?: string;
  coverPosition?: string;
  logo?: string;
  story?: string;
  ownerName?: string;
  ownerRole?: string;
  ownerBio?: string;
  milestones: BusinessMilestone[];
  bmc: BmcEntry[];
  seeking: string[];
  seekingObjective?: string;
  revenueLabel?: string;
  growthLabel?: string;
  revenueSeries?: number[];
  hasPerformance: boolean;
  status?: "draft" | "published";
  isDraft: boolean;
}

/**
 * Transforms a raw business or owned business into safe, sanitized presentation data.
 */
export function presentProfile(
  business: Business | OwnedBusiness,
): PresentedProfile {
  const milestones = cleanMilestones(business.milestones);
  const bmc = cleanBmc(business.bmc);
  const seeking = cleanSeeking(business.seeking);
  const revenueSeries = cleanRevenueSeries(business.revenueSeries);
  const revenueLabel = validFinancialLabel(business.revenueLabel);
  const growthLabel = validFinancialLabel(business.growthLabel);
  const hasPerformance = Boolean(revenueLabel || growthLabel || revenueSeries);
  const status = "status" in business ? business.status : undefined;

  return {
    name: business.name?.trim() || "Nama Usaha Belum Diisi",
    category: business.category || "UMKM",
    location: business.location?.trim() || undefined,
    foundedYearLabel: formatFoundedYear(business.foundedYear),
    description: business.description?.trim() || undefined,
    coverImage: business.coverImage?.trim() || undefined,
    coverPosition: business.coverPosition?.trim() || "center",
    logo: business.logo?.trim() || undefined,
    story: business.story?.trim() || undefined,
    ownerName: business.owner?.name?.trim() || undefined,
    ownerRole: business.owner?.role?.trim() || "Pemilik Usaha",
    ownerBio: business.owner?.bio?.trim() || undefined,
    milestones,
    bmc,
    seeking,
    seekingObjective: business.seekingObjective?.trim() || undefined,
    revenueLabel,
    growthLabel,
    revenueSeries,
    hasPerformance,
    status,
    isDraft: status === "draft",
  };
}
