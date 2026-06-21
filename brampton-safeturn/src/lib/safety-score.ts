import {
  Report,
  ReportType,
  RiskLevel,
  SEVERITY_WEIGHTS,
} from "@/types";

export function getSeverityWeight(type: ReportType): number {
  return SEVERITY_WEIGHTS[type];
}

export function calculateSafetyScore(reports: Report[]): number {
  if (reports.length === 0) return 100;

  const now = Date.now();
  let totalRisk = 0;

  for (const report of reports) {
    const ageDays = (now - report.timestamp) / (1000 * 60 * 60 * 24);
    const recencyMultiplier = Math.exp(-ageDays / 30);
    const severity = report.severityWeight || SEVERITY_WEIGHTS[report.type];
    totalRisk += severity * recencyMultiplier;
  }

  const baseline = Math.max(reports.length * 2.5, 1);
  const normalizedRisk = Math.min(totalRisk / baseline, 1);
  return Math.max(0, Math.min(100, Math.round(100 - normalizedRisk * 85)));
}

export function getRiskLevel(score: number): RiskLevel {
  if (score < 40) return "high";
  if (score < 70) return "medium";
  return "low";
}

export function getRiskColor(level: RiskLevel): string {
  switch (level) {
    case "high":
      return "#ef4444";
    case "medium":
      return "#eab308";
    case "low":
      return "#22c55e";
  }
}

export function getTrend(
  reports: Report[]
): "rising" | "stable" | "improving" {
  const now = Date.now();
  const week = 7 * 24 * 60 * 60 * 1000;

  const recent = reports.filter((r) => now - r.timestamp < week);
  const previous = reports.filter(
    (r) => now - r.timestamp >= week && now - r.timestamp < week * 2
  );

  if (recent.length > previous.length * 1.3) return "rising";
  if (recent.length < previous.length * 0.7) return "improving";
  return "stable";
}

export function summarizeIssues(reports: Report[]): Record<ReportType, number> {
  const counts = {} as Record<ReportType, number>;
  for (const report of reports) {
    counts[report.type] = (counts[report.type] || 0) + 1;
  }
  return counts;
}

export function getTopIssue(reports: Report[]): ReportType | null {
  const counts = summarizeIssues(reports);
  const entries = Object.entries(counts) as [ReportType, number][];
  if (entries.length === 0) return null;
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}
