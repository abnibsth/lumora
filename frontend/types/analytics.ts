export interface AnalyticsSummary {
  profileViews: number;
  uniqueVisitors: number;
  catalogImpressions: number;
  bookmarksCount: number;
  collabRequests: number;
  contactClicks: number;

  viewsChange: number;
  visitorsChange: number;
  impressionsChange: number;
  bookmarksChange: number;
  collabChange: number;
  contactChange: number;
}

export interface AnalyticsTimeSeriesPoint {
  date: string; // YYYY-MM-DD
  views: number;
  uniqueVisitors: number;
}

export interface AnalyticsFunnelStep {
  stage: string;
  count: number;
  conversion: number;
}

export interface AnalyticsTrafficSource {
  source: string;
  label: string;
  count: number;
  percentage: number;
}

export interface BusinessAnalytics {
  businessId: string;
  businessName: string;
  businessSlug: string;
  status: string;
  range: "7d" | "30d" | "90d";
  startDate: string;
  endDate: string;
  summary: AnalyticsSummary;
  timeSeries: AnalyticsTimeSeriesPoint[];
  funnel: AnalyticsFunnelStep[];
  trafficSource: AnalyticsTrafficSource[];
}

export interface RecordAnalyticsEventInput {
  eventType: "view" | "catalog_impression" | "contact_click";
  source?: "explore" | "search" | "matching" | "direct";
}

