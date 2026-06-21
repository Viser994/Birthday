"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useReports } from "@/hooks/useReports";
import { clusterReports } from "@/lib/locations";
import SafetyScoreBadge from "@/components/ui/SafetyScoreBadge";
import RiskBadge from "@/components/ui/RiskBadge";
import ReportTypeBadge from "@/components/ui/ReportTypeBadge";
import ShareCard from "@/components/viral/ShareCard";
import { summarizeIssues, getTopIssue } from "@/lib/safety-score";
import { REPORT_TYPE_LABELS } from "@/types";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowLeft,
  MapPin,
} from "lucide-react";

const SafetyMap = dynamic(() => import("@/components/map/SafetyMap"), {
  ssr: false,
});

export default function LocationDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { reports, loading } = useReports();
  const locations = useMemo(() => clusterReports(reports), [reports]);
  const location = locations.find((l) => l.id === id);

  const monthlyBuckets = useMemo(() => {
    if (!location) return [] as [string, number][];
    const buckets: Record<string, number> = {};
    for (const report of location.reports) {
      const key = format(report.timestamp, "MMM yyyy");
      buckets[key] = (buckets[key] || 0) + 1;
    }
    return Object.entries(buckets).slice(-6);
  }, [location]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  if (!location) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
        <MapPin className="h-12 w-12 text-gray-300" />
        <h1 className="text-xl font-bold text-gray-900">Location Not Found</h1>
        <p className="text-gray-600">No reports found for this location.</p>
        <Link
          href="/"
          className="rounded-lg bg-red-500 px-4 py-2 text-white hover:bg-red-600"
        >
          Back to Map
        </Link>
      </div>
    );
  }

  const issueCounts = summarizeIssues(location.reports);
  const topIssue = getTopIssue(location.reports);

  const TrendIcon =
    location.trend === "rising"
      ? TrendingUp
      : location.trend === "improving"
        ? TrendingDown
        : Minus;

  const trendLabel =
    location.trend === "rising"
      ? "Risk is rising — more reports this week"
      : location.trend === "improving"
        ? "Risk is improving — fewer recent reports"
        : "Risk is stable";

  const maxBucket = Math.max(...monthlyBuckets.map(([, v]) => v), 1);

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Map
      </Link>

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            {location.name}
          </h1>
          <div className="mb-4 flex items-center gap-3">
            <RiskBadge level={location.riskLevel} />
            <span
              className={`flex items-center gap-1 text-sm ${
                location.trend === "rising"
                  ? "text-red-500"
                  : location.trend === "improving"
                    ? "text-green-500"
                    : "text-gray-500"
              }`}
            >
              <TrendIcon className="h-4 w-4" />
              {trendLabel}
            </span>
          </div>

          <div className="mb-6 flex items-center gap-6">
            <SafetyScoreBadge score={location.safetyScore} size="lg" />
            <div>
              <p className="text-3xl font-bold text-gray-900">
                {location.reports.length}
              </p>
              <p className="text-sm text-gray-500">Total Reports</p>
            </div>
          </div>

          {topIssue && (
            <div className="mb-4 rounded-lg bg-gray-50 p-4">
              <p className="mb-1 text-sm font-medium text-gray-700">
                Most Common Issue
              </p>
              <ReportTypeBadge type={topIssue} />
            </div>
          )}

          <div className="mb-4">
            <p className="mb-2 text-sm font-medium text-gray-700">
              Issue Breakdown
            </p>
            <div className="space-y-2">
              {Object.entries(issueCounts).map(([type, count]) => (
                <div key={type} className="flex items-center gap-2">
                  <span className="w-40 text-xs text-gray-600">
                    {REPORT_TYPE_LABELS[type as keyof typeof REPORT_TYPE_LABELS]}
                  </span>
                  <div className="flex-1 rounded-full bg-gray-200 h-2">
                    <div
                      className="h-2 rounded-full bg-red-400"
                      style={{
                        width: `${(count / location.reports.length) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700">{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="h-64 overflow-hidden rounded-xl border">
            <SafetyMap
              locations={[location]}
              center={{ lat: location.lat, lng: location.lng }}
              zoom={15}
              showHeatmap={false}
            />
          </div>
          <ShareCard location={location} />
        </div>
      </div>

      <div className="mb-6 rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">Report Trend</h2>
        <div className="flex items-end gap-2 h-32">
          {monthlyBuckets.map(([month, count]) => (
            <div key={month} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-red-400 transition-all"
                style={{ height: `${(count / maxBucket) * 100}%`, minHeight: 4 }}
              />
              <span className="text-xs text-gray-500">{month}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-bold text-gray-900">
          All Reports ({location.reports.length})
        </h2>
        <div className="space-y-4">
          {location.reports.map((report) => (
            <div key={report.id} className="border-b pb-4 last:border-0">
              <div className="mb-1 flex items-center justify-between">
                <ReportTypeBadge type={report.type} />
                <span className="text-xs text-gray-400">
                  {formatDistanceToNow(report.timestamp, { addSuffix: true })}
                </span>
              </div>
              {report.description && (
                <p className="text-sm text-gray-700">{report.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
