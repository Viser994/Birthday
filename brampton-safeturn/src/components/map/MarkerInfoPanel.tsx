"use client";

import { LocationCluster } from "@/types";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import SafetyScoreBadge from "@/components/ui/SafetyScoreBadge";
import RiskBadge from "@/components/ui/RiskBadge";
import ReportTypeBadge from "@/components/ui/ReportTypeBadge";
import { summarizeIssues } from "@/lib/safety-score";
import { REPORT_TYPE_LABELS, ReportType } from "@/types";
import { TrendingUp, TrendingDown, Minus, ExternalLink, X } from "lucide-react";

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
      ? "text-rose-400"
      : location.trend === "improving"
        ? "text-emerald-400"
        : "text-slate-500";

  return (
    <div className="absolute bottom-20 left-4 right-4 z-20 mx-auto max-w-md rounded-2xl border border-white/10 bg-slate-900/95 p-5 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:left-auto sm:right-6 sm:w-96">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex-1 pr-2">
          <h3 className="font-semibold text-white">{location.name}</h3>
          <div className="mt-2 flex items-center gap-2">
            <RiskBadge level={location.riskLevel} />
            <span className={`flex items-center gap-1 text-xs capitalize ${trendColor}`}>
              <TrendIcon className="h-3 w-3" />
              {location.trend}
            </span>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <SafetyScoreBadge score={location.safetyScore} size="sm" showLabel={false} />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Common Issues
        </p>
        <div className="flex flex-wrap gap-2">
          {topIssues.map(([type, count]) => (
            <span
              key={type}
              className="rounded-lg bg-white/5 px-2 py-1 text-xs text-slate-300"
            >
              {REPORT_TYPE_LABELS[type]} ({count})
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Recent Activity
        </p>
        <div className="space-y-2">
          {location.reports.slice(0, 3).map((report) => (
            <div key={report.id} className="flex items-center justify-between text-xs">
              <ReportTypeBadge type={report.type} />
              <span className="text-slate-500">
                {formatDistanceToNow(report.timestamp, { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </div>

      <Link
        href={`/location/${location.id}`}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/20"
      >
        View Details
        <ExternalLink className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
