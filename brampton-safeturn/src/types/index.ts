export type ReportType =
  | "near_miss"
  | "confusing_traffic_light"
  | "unsafe_left_turn"
  | "sudden_braking_zone"
  | "general_issue";

export type RiskLevel = "high" | "medium" | "low";

export interface Report {
  id: string;
  lat: number;
  lng: number;
  type: ReportType;
  timestamp: number;
  description?: string;
  severityWeight: number;
  imageUrl?: string;
  locationName?: string;
  userId?: string;
}

export interface LocationCluster {
  id: string;
  lat: number;
  lng: number;
  name: string;
  reports: Report[];
  safetyScore: number;
  riskLevel: RiskLevel;
  trend: "rising" | "stable" | "improving";
}

export interface NeighbourhoodStats {
  name: string;
  reportCount: number;
  avgSafetyScore: number;
  topIssue: ReportType;
}

export interface RouteWarning {
  locationId: string;
  locationName: string;
  message: string;
  riskLevel: RiskLevel;
  lat: number;
  lng: number;
}

export const REPORT_TYPE_LABELS: Record<ReportType, string> = {
  near_miss: "Near Miss",
  confusing_traffic_light: "Confusing Traffic Light",
  unsafe_left_turn: "Unsafe Left Turn",
  sudden_braking_zone: "Sudden Braking Zone",
  general_issue: "General Issue",
};

export const SEVERITY_WEIGHTS: Record<ReportType, number> = {
  near_miss: 5,
  confusing_traffic_light: 3,
  unsafe_left_turn: 4,
  sudden_braking_zone: 3,
  general_issue: 2,
};
