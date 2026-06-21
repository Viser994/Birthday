"use client";

import { useMemo } from "react";
import { useReports } from "@/hooks/useReports";
import { clusterReports } from "@/lib/locations";
import TopDangerSpots from "@/components/viral/TopDangerSpots";
import Leaderboard from "@/components/viral/Leaderboard";
import { getStreakData } from "@/lib/streak";
import { useMemo } from "react";
import Link from "next/link";
import RiskBadge from "@/components/ui/RiskBadge";
import { TrendingUp, TrendingDown, Flame, BarChart3 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import ReportTypeBadge from "@/components/ui/ReportTypeBadge";

export default function InsightsPage() {
  const { reports, loading } = useReports();
  const locations = useMemo(() => clusterReports(reports), [reports]);
  const [streak] = useState(() =>
    typeof window !== "undefined" ? getStreakData() : { currentStreak: 0, totalPoints: 0 }
  );

  const rising = useMemo(
    () => locations.filter((l) => l.trend === "rising").slice(0, 5),
    [locations]
  );

  const improving = useMemo(
    () => locations.filter((l) => l.trend === "improving").slice(0, 5),
    [locations]
  );

  const trendingReports = useMemo(
    () => [...reports].sort((a, b) => b.timestamp - a.timestamp).slice(0, 10),
    [reports]
  );

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="mb-1 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">Safety Insights</h1>
          </div>
          <p className="text-gray-600">
            Community road safety intelligence for Brampton
          </p>
        </div>
        {streak.currentStreak > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-orange-50 px-4 py-3">
            <Flame className="h-6 w-6 text-orange-500" />
            <div>
              <p className="font-bold text-orange-700">
                {streak.currentStreak}-day streak
              </p>
              <p className="text-xs text-orange-600">{streak.totalPoints} points</p>
            </div>
          </div>
        )}
      </div>

      <div className="mb-10">
        <TopDangerSpots locations={locations} />
      </div>

      <div className="mb-10">
        <Leaderboard locations={locations} />
      </div>

      <div className="mb-10 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-red-500" />
            <h3 className="font-bold text-gray-900">Rising Risk Zones</h3>
          </div>
          {rising.length === 0 ? (
            <p className="text-sm text-gray-500">No rising risk zones detected</p>
          ) : (
            <div className="space-y-3">
              {rising.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/location/${loc.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium">{loc.name}</p>
                    <p className="text-xs text-gray-500">
                      {loc.reports.length} reports
                    </p>
                  </div>
                  <RiskBadge level={loc.riskLevel} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-green-500" />
            <h3 className="font-bold text-gray-900">Recently Improved Areas</h3>
          </div>
          {improving.length === 0 ? (
            <p className="text-sm text-gray-500">No improving areas yet</p>
          ) : (
            <div className="space-y-3">
              {improving.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/location/${loc.id}`}
                  className="flex items-center justify-between rounded-lg p-2 hover:bg-gray-50"
                >
                  <div>
                    <p className="text-sm font-medium">{loc.name}</p>
                    <p className="text-xs text-gray-500">
                      Score: {loc.safetyScore}
                    </p>
                  </div>
                  <RiskBadge level={loc.riskLevel} />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-gray-900">Trending Reports</h3>
        <div className="space-y-3">
          {trendingReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between border-b pb-3 last:border-0"
            >
              <div>
                <ReportTypeBadge type={report.type} />
                <p className="mt-1 text-sm text-gray-700">
                  {report.locationName || `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}
                </p>
                {report.description && (
                  <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                    {report.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-gray-400">
                {formatDistanceToNow(report.timestamp, { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
