"use client";

import { useMemo } from "react";
import dynamic from "next/dynamic";
import { useReports } from "@/hooks/useReports";
import { clusterReports } from "@/lib/locations";
import Link from "next/link";
import { AlertTriangle, TrendingUp } from "lucide-react";
import TopDangerSpots from "@/components/viral/TopDangerSpots";

const SafetyMap = dynamic(() => import("@/components/map/SafetyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
    </div>
  ),
});

export default function HomePage() {
  const { reports, loading } = useReports();
  const locations = useMemo(() => clusterReports(reports), [reports]);

  const highRiskCount = locations.filter((l) => l.riskLevel === "high").length;

  return (
    <div className="flex flex-1 flex-col">
      <div className="relative flex-1 min-h-[calc(100vh-3.5rem)]">
        {!loading && (
          <SafetyMap locations={locations} showHeatmap />
        )}
        {loading && (
          <div className="flex h-full items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent" />
              <p className="text-sm text-gray-500">Loading safety data...</p>
            </div>
          </div>
        )}

        <div className="absolute left-4 top-16 z-10 max-w-xs rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur-sm sm:top-4">
          <h1 className="mb-1 text-lg font-bold text-gray-900">
            Brampton SafeTurn
          </h1>
          <p className="mb-3 text-xs text-gray-500">
            Community-powered road safety intelligence
          </p>
          <div className="flex gap-3 text-center">
            <div>
              <p className="text-2xl font-bold text-red-500">{highRiskCount}</p>
              <p className="text-xs text-gray-500">High Risk</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{locations.length}</p>
              <p className="text-xs text-gray-500">Hotspots</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{reports.length}</p>
              <p className="text-xs text-gray-500">Reports</p>
            </div>
          </div>
          <Link
            href="/report"
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600"
          >
            <AlertTriangle className="h-4 w-4" />
            Report a Danger Spot
          </Link>
        </div>
      </div>

      {!loading && locations.length > 0 && (
        <section className="border-t bg-white px-4 py-8">
          <div className="mx-auto max-w-7xl">
            <TopDangerSpots locations={locations} limit={3} />
            <div className="mt-4 text-center">
              <Link
                href="/insights"
                className="inline-flex items-center gap-1 text-sm font-medium text-red-600 hover:text-red-700"
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
