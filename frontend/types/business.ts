export const BUSINESS_CATEGORIES = [
  "F&B",
  "Retail",
  "Jasa",
  "Kreatif",
  "Fashion",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

export interface BusinessMilestone {
  year: number;
  title: string;
  description?: string;
}

export interface BmcEntry {
  label: string;
  value: string;
}

export interface BusinessOwner {
  name: string;
  role: string;
  bio: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  category: BusinessCategory;
  location: string;
  description: string;
  story: string;
  coverImage?: string;
  coverPosition?: string;
  logo?: string;
  foundedYear: number;
  revenueLabel?: string;
  growthLabel?: string;
  revenueSeries?: number[];
  seeking?: string[];
  seekingObjective?: string;
  owner: BusinessOwner;
  milestones: BusinessMilestone[];
  bmc: BmcEntry[];
  verified?: boolean;
}
