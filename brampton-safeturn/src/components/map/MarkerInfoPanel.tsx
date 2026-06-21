"use client";

import { LocationCluster } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import SafetyScoreBadge from "@/components/ui/SafetyScoreBadge";
import RiskBadge from "@/components/ui/RiskBadge";
import ReportTypeBadge from "@/components/ui/ReportTypeBadge";
import { summarizeIssues } from "@/lib/safety-score";
import { REPORT_TYPE_LABELS, ReportType } from "@/types";
import { TrendingUp, TrendingDown, Minus, ExternalLink } from "lucide-react";

interface MarkerInfoPanelProps {
  location: LocationCluster;
  onClose: () => void;
}

export default function MarkerInfoPanel({
  location,
  onClose,
}: MarkerInfoPanelProps) {
  const issueCounts = summarizeIssues(location.reports);
  const topIssues = (Object.entries(issueCounts) as [ReportType, number][])
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  const TrendIcon =
    location.trend === "rising"
      ? TrendingUp
      : location.trend === "improving"
        ? TrendingDown
        : Minus;

  const trendColor =
    location.trend === "rising"
      ? "text-red-500"
      : location.trend === "improving"
        ? "text-green-500"
        : "text-gray-400";

  return (
    <div className="absolute bottom-4 left-4 right-4 z-10 mx-auto max-w-md rounded-xl bg-white p-4 shadow-xl sm:left-auto sm:right-4 sm:w-96">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex-1 pr-2">
          <h3 className="font-semibold text-gray-900">{location.name}</h3>
          <div className="mt-1 flex items-center gap-2">
            <RiskBadge level={location.riskLevel} />
            <span className={`flex items-center gap-0.5 text-xs ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {location.trend}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <SafetyScoreBadge score={location.safetyScore} size="sm" showLabel={false} />
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
            aria-label="Close"
          >
            ✕
          </button>
        </div>
      </div>

      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-gray-500">Common Issues</p>
        <div className="flex flex-wrap gap-1">
          {topIssues.map(([type, count]) => (
            <span key={type} className="text-xs text-gray-600">
              {REPORT_TYPE_LABELS[type]} ({count})
            </span>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <p className="mb-1 text-xs font-medium text-gray-500">Recent Activity</p>
        <div className="space-y-1.5">
          {location.reports.slice(0, 3).map((report) => (
            <div key={report.id} className="flex items-center justify-between text-xs">
              <ReportTypeBadge type={report.type} />
              <span className="text-gray-400">
                {formatDistanceToNow(report.timestamp, { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Link
        href={`/location/${location.id}`}
        className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
      >
        View Details
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
