"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useReports } from "@/hooks/useReports";
import { clusterReports } from "@/lib/locations";
import Link from "next/link";
import { AlertTriangle, TrendingUp, MapPin, Activity } from "lucide-react";
import TopDangerSpots from "@/components/viral/TopDangerSpots";

const SafetyMap = dynamic(() => import("@/components/map/SafetyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-900">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
    </div>
  ),
});

export default function HomePage() {
  const { reports, loading } = useReports();
  const locations = useMemo(() => clusterReports(reports), [reports]);

  const highRiskCount = locations.filter((l) => l.riskLevel === "high").length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative z-0 min-h-[calc(100dvh-4rem)] flex-1 overflow-hidden sm:min-h-[calc(100dvh-4rem)]">
        {!loading && <SafetyMap locations={locations} showHeatmap />}
        {loading && (
          <div className="flex h-full items-center justify-center bg-slate-900">
            <div className="text-center">
              <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
              <p className="text-sm text-slate-400">Loading safety data...</p>
            </div>
          </div>
        )}

        {/* Floating stats panel */}
        <div className="pointer-events-none absolute left-4 right-4 top-4 z-10 sm:left-6 sm:right-auto sm:top-6 sm:max-w-sm">
          <div className="pointer-events-auto rounded-2xl border border-white/10 bg-slate-900/85 p-5 shadow-2xl backdrop-blur-xl">
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-orange-500">
                <MapPin className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Road Safety Map</h1>
                <p className="text-xs text-slate-400">
                  Live community reports across Brampton
                </p>
              </div>
            </div>

            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-rose-500/10 p-3 text-center">
                <p className="text-2xl font-bold text-rose-400">{highRiskCount}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  High Risk
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-bold text-white">{locations.length}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Hotspots
                </p>
              </div>
              <div className="rounded-xl bg-white/5 p-3 text-center">
                <p className="text-2xl font-bold text-white">{reports.length}</p>
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
                  Reports
                </p>
              </div>
            </div>

            <Link
              href="/report"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:shadow-rose-500/40"
            >
              <AlertTriangle className="h-4 w-4" />
              Report a Danger Spot
            </Link>
          </div>
        </div>
      </div>

      {!loading && locations.length > 0 && (
        <section className="border-t border-white/10 bg-slate-950 px-4 py-10 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex items-center gap-2">
              <Activity className="h-5 w-5 text-rose-400" />
              <h2 className="text-lg font-bold text-white">This Week&apos;s Hotspots</h2>
            </div>
            <TopDangerSpots locations={locations} limit={3} />
            <div className="mt-6 text-center">
              <Link
                href="/insights"
                className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <TrendingUp className="h-4 w-4" />
                View all insights
              </Link>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
