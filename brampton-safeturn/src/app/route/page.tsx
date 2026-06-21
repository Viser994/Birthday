"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useGoogleMaps } from "@/components/providers/GoogleMapsProvider";
import { useReports } from "@/hooks/useReports";
import { clusterReports, findNearbyClusters } from "@/lib/locations";
import { RouteWarning } from "@/types";
import { Navigation, AlertTriangle, MapPin, ArrowRight } from "lucide-react";
import RiskBadge from "@/components/ui/RiskBadge";

const RouteMap = dynamic(() => import("@/components/route/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-slate-900">
      <p className="text-sm text-slate-400">Loading route...</p>
    </div>
  ),
});

function getWarningMessage(loc: {
  name: string;
  riskLevel: string;
  reports: { type: string }[];
}): string {
  const hasNearMiss = loc.reports.some((r) => r.type === "near_miss");
  if (loc.riskLevel === "high" && hasNearMiss) {
    return `Frequent near-miss zone at ${loc.name}`;
  }
  if (loc.riskLevel === "high") {
    return `High-risk intersection ahead: ${loc.name}`;
  }
  if (loc.riskLevel === "medium") {
    return `Moderate risk area: ${loc.name}`;
  }
  return `Reported issue at ${loc.name}`;
}

export default function RoutePage() {
  const { isLoaded: mapsLoaded } = useGoogleMaps();
  const { reports, loading } = useReports();
  const locations = useMemo(() => clusterReports(reports), [reports]);

  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [warnings, setWarnings] = useState<RouteWarning[]>([]);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");

  const checkRoute = useCallback(async () => {
    if (!origin || !destination) {
      setError("Please enter both start and destination");
      return;
    }

    setChecking(true);
    setError("");
    setDirections(null);
    setWarnings([]);

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

    if (!apiKey || !mapsLoaded) {
      const mockWarnings: RouteWarning[] = locations
        .filter((l) => l.riskLevel !== "low")
        .slice(0, 4)
        .map((loc) => ({
          locationId: loc.id,
          locationName: loc.name,
          message: getWarningMessage(loc),
          riskLevel: loc.riskLevel,
          lat: loc.lat,
          lng: loc.lng,
        }));
      setWarnings(mockWarnings);
      setChecking(false);
      return;
    }

    try {
      const service = new google.maps.DirectionsService();
      const result = await service.route({
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      });

      setDirections(result);

      const routeWarnings: RouteWarning[] = [];
      const path = result.routes[0]?.overview_path || [];

      for (const point of path) {
        const nearby = findNearbyClusters(
          locations,
          point.lat(),
          point.lng(),
          0.3
        );
        for (const loc of nearby) {
          if (
            loc.riskLevel !== "low" &&
            !routeWarnings.some((w) => w.locationId === loc.id)
          ) {
            routeWarnings.push({
              locationId: loc.id,
              locationName: loc.name,
              message: getWarningMessage(loc),
              riskLevel: loc.riskLevel,
              lat: loc.lat,
              lng: loc.lng,
            });
          }
        }
      }

      setWarnings(routeWarnings);
    } catch {
      setError("Could not calculate route. Check your addresses.");
    } finally {
      setChecking(false);
    }
  }, [origin, destination, locations, mapsLoaded]);

  return (
    <div className="flex flex-1 flex-col lg:flex-row">
      <div className="w-full border-b border-white/10 bg-slate-900/80 p-6 lg:w-[420px] lg:border-b-0 lg:border-r">
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/20">
            <Navigation className="h-5 w-5 text-blue-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Route Risk Checker</h1>
        </div>
        <p className="mb-8 text-sm text-slate-400">
          Check your route for dangerous intersections and high-risk zones in
          Brampton.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-emerald-400" />
              Start
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Brampton City Hall"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
              <MapPin className="h-3.5 w-3.5 text-rose-400" />
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Bramalea City Centre"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50"
            />
          </div>

          <button
            onClick={checkRoute}
            disabled={checking || loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:shadow-blue-500/40 disabled:opacity-50"
          >
            <Navigation className="h-4 w-4" />
            {checking ? "Checking..." : "Check Route Safety"}
            {!checking && <ArrowRight className="h-4 w-4" />}
          </button>

          {error && (
            <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="mt-8">
            <div className="mb-4 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-400" />
              <h2 className="font-bold text-white">
                {warnings.length} Warning{warnings.length !== 1 ? "s" : ""} Along Route
              </h2>
            </div>
            <div className="space-y-2">
              {warnings.map((w) => (
                <div
                  key={w.locationId}
                  className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-4"
                >
                  <div className="mb-1.5">
                    <RiskBadge level={w.riskLevel} />
                  </div>
                  <p className="text-sm text-slate-200">{w.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length === 0 && directions && (
          <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
            <p className="font-medium text-emerald-300">
              No high-risk zones detected on this route!
            </p>
          </div>
        )}
      </div>

      <div className="relative z-0 min-h-[50dvh] flex-1 lg:min-h-0">
        {!loading && (
          <RouteMap
            directions={directions}
            warnings={warnings}
            locations={locations}
          />
        )}
      </div>
    </div>
  );
}
