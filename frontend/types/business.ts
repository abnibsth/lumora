export const BUSINESS_CATEGORIES = [
  "F&B",
  "Retail",
  "Jasa",
  "Kreatif",
  "Fashion",
] as const;

export type BusinessCategory = (typeof BUSINESS_CATEGORIES)[number];

/** One stop on a business's timeline. Year plus what happened. */
export interface BusinessMilestone {
  year: number;
  title: string;
}

/**
 * One block of a Business Model Canvas. The nine labels are fixed by the canvas
 * itself, so only the value is business-specific.
 */
export interface BmcEntry {
  label: string;
  value: string;
}

export interface Business {
  id: string;
  slug: string;
  name: string;
  category: BusinessCategory;
  location: string;
  description: string;
  /**
   * Optional because no real business photography exists yet, and inventing
   * stock photos of businesses that do not exist would be fabricated content
   * (R-23, R-38). When empty, the card renders an initial-based tile instead.
   */
  coverImage?: string;
  logo?: string;
  foundedYear: number;
  revenueLabel?: string;
  growthLabel?: string;
  /**
   * Demo monthly revenue, in millions of rupiah, oldest first. Exists because
   * PRD 10.2 asks the hero for a revenue mini chart, which needs a series rather
   * than a single figure. Demo data, shown only under a visible example label.
   */
  revenueSeries?: number[];
  seeking?: string[];
  /**
   * What the owner is trying to achieve with that partnership. PRD 10.8 lists
   * "business objective" alongside the partnership type, and the two are
   * different things: one is who, the other is why.
   */
  seekingObjective?: string;
  /**
   * The business journey, oldest first. PRD 10.9 asks for a timeline that makes a
   * profile feel like a story rather than a financial listing. It lives on the
   * business because it belongs to the business, not to the page that renders it.
   */
  milestones?: BusinessMilestone[];
  /**
   * Business Model Canvas in its nine standard blocks, for the profile showcase.
   * Demo content, shown only under the visible example label the showcase carries.
   */
  bmc?: BmcEntry[];
  /**
   * Present because PRD 15 defines it, but nothing renders a "Verified" badge.
   * PRD 24 forbids implying legal due diligence that does not exist yet, so the
   * field stays unused until a real verification process ships.
   */
  verified?: boolean;
}
