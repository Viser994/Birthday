"use client";

import { LocationCluster } from "@/types";
import { getNeighbourhoodForLocation } from "@/lib/mock-data";
import { getRiskColor } from "@/lib/safety-score";
import { Trophy, AlertCircle } from "lucide-react";

interface LeaderboardProps {
  locations: LocationCluster[];
}

export default function Leaderboard({ locations }: LeaderboardProps) {
  const neighbourhoodMap = new Map<
    string,
    { scores: number[]; count: number }
  >();

  for (const loc of locations) {
    const hood = getNeighbourhoodForLocation(loc.lat, loc.lng);
    const existing = neighbourhoodMap.get(hood) || { scores: [], count: 0 };
    existing.scores.push(loc.safetyScore);
    existing.count += loc.reports.length;
    neighbourhoodMap.set(hood, existing);
  }

  const stats = Array.from(neighbourhoodMap.entries()).map(([name, data]) => ({
    name,
    avgScore: Math.round(
      data.scores.reduce((a, b) => a + b, 0) / data.scores.length
    ),
    reportCount: data.count,
  }));

  const safest = [...stats].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
  const mostReported = [...stats]
    .sort((a, b) => b.reportCount - a.reportCount)
    .slice(0, 5);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-green-500" />
          <h3 className="font-bold text-gray-900">Safest Neighbourhoods</h3>
        </div>
        <div className="space-y-3">
          {safest.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100 text-xs font-bold text-green-700">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">{item.reportCount} reports</p>
              </div>
              <span
                className="rounded-full px-2 py-0.5 text-xs font-bold text-white"
                style={{ backgroundColor: getRiskColor("low") }}
              >
                {item.avgScore}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <h3 className="font-bold text-gray-900">Most Reported Areas</h3>
        </div>
        <div className="space-y-3">
          {mostReported.map((item, i) => (
            <div key={item.name} className="flex items-center gap-3">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-red-100 text-xs font-bold text-red-700">
                {i + 1}
              </span>
              <div className="flex-1">
                <p className="text-sm font-medium">{item.name}</p>
                <p className="text-xs text-gray-500">Avg score: {item.avgScore}</p>
              </div>
              <span className="text-sm font-bold text-red-600">
                {item.reportCount}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
