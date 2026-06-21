"use client";

import { useMemo, useState } from "react";
import { useReports } from "@/hooks/useReports";
import { clusterReports } from "@/lib/locations";
import TopDangerSpots from "@/components/viral/TopDangerSpots";
import Leaderboard from "@/components/viral/Leaderboard";
import { getStreakData } from "@/lib/streak";
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
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-500/20">
              <BarChart3 className="h-5 w-5 text-rose-400" />
            </div>
            <h1 className="text-3xl font-bold text-white">Safety Insights</h1>
          </div>
          <p className="text-slate-400">
            Community road safety intelligence for Brampton
          </p>
        </div>
        {streak.currentStreak > 0 && (
          <div className="flex items-center gap-3 rounded-2xl border border-orange-500/30 bg-orange-500/10 px-5 py-3">
            <Flame className="h-6 w-6 text-orange-400" />
            <div>
              <p className="font-bold text-orange-300">
                {streak.currentStreak}-day streak
              </p>
              <p className="text-xs text-orange-400/80">{streak.totalPoints} points</p>
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
        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-rose-400" />
            <h3 className="font-bold text-white">Rising Risk Zones</h3>
          </div>
          {rising.length === 0 ? (
            <p className="text-sm text-slate-500">No rising risk zones detected</p>
          ) : (
            <div className="space-y-2">
              {rising.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/location/${loc.id}`}
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{loc.name}</p>
                    <p className="text-xs text-slate-500">
                      {loc.reports.length} reports
                    </p>
                  </div>
                  <RiskBadge level={loc.riskLevel} />
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
          <div className="mb-4 flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-emerald-400" />
            <h3 className="font-bold text-white">Recently Improved Areas</h3>
          </div>
          {improving.length === 0 ? (
            <p className="text-sm text-slate-500">No improving areas yet</p>
          ) : (
            <div className="space-y-2">
              {improving.map((loc) => (
                <Link
                  key={loc.id}
                  href={`/location/${loc.id}`}
                  className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-white/5"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-200">{loc.name}</p>
                    <p className="text-xs text-slate-500">
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

      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 backdrop-blur-sm">
        <h3 className="mb-4 font-bold text-white">Trending Reports</h3>
        <div className="space-y-3">
          {trendingReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0"
            >
              <div>
                <ReportTypeBadge type={report.type} />
                <p className="mt-1 text-sm text-slate-300">
                  {report.locationName || `${report.lat.toFixed(4)}, ${report.lng.toFixed(4)}`}
                </p>
                {report.description && (
                  <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                    {report.description}
                  </p>
                )}
              </div>
              <span className="shrink-0 text-xs text-slate-500">
                {formatDistanceToNow(report.timestamp, { addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
