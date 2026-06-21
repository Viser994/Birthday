"use client";

import { LocationCluster } from "@/types";
import ShareCard from "@/components/viral/ShareCard";
import { AlertTriangle } from "lucide-react";

interface TopDangerSpotsProps {
  locations: LocationCluster[];
  limit?: number;
}

export default function TopDangerSpots({
  locations,
  limit = 10,
}: TopDangerSpotsProps) {
  const top = [...locations]
    .sort((a, b) => a.safetyScore - b.safetyScore)
    .slice(0, limit);

  return (
    <section>
      <div className="mb-4 flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-red-500" />
        <h2 className="text-lg font-bold text-gray-900">
          Top {limit} Dangerous Spots in Brampton This Week
        </h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {top.map((loc, i) => (
          <ShareCard key={loc.id} location={loc} rank={i + 1} />
        ))}
      </div>
    </section>
  );
}
