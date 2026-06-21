"use client";

import { useState, useMemo, useCallback } from "react";
import dynamic from "next/dynamic";
import { useJsApiLoader } from "@react-google-maps/api";
import { useReports } from "@/hooks/useReports";
import { clusterReports, findNearbyClusters } from "@/lib/locations";
import { RouteWarning } from "@/types";
import { Route, AlertTriangle, Navigation } from "lucide-react";
import RiskBadge from "@/components/ui/RiskBadge";

const RouteMap = dynamic(() => import("@/components/route/RouteMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center bg-gray-100">
      <p className="text-sm text-gray-500">Loading route...</p>
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
  const { isLoaded: mapsLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["visualization"],
  });
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
      <div className="w-full border-b bg-white p-4 lg:w-96 lg:border-b-0 lg:border-r">
        <div className="mb-4 flex items-center gap-2">
          <Route className="h-6 w-6 text-blue-500" />
          <h1 className="text-xl font-bold text-gray-900">Route Risk Checker</h1>
        </div>
        <p className="mb-6 text-sm text-gray-600">
          Check your route for dangerous intersections and high-risk zones in
          Brampton.
        </p>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Start
            </label>
            <input
              type="text"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="e.g. Brampton City Hall"
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Destination
            </label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              placeholder="e.g. Bramalea City Centre"
              className="w-full rounded-lg border px-3 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={checkRoute}
            disabled={checking || loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-3 font-medium text-white hover:bg-blue-600 disabled:opacity-50"
          >
            <Navigation className="h-4 w-4" />
            {checking ? "Checking..." : "Check Route Safety"}
          </button>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}
        </div>

        {warnings.length > 0 && (
          <div className="mt-6">
            <div className="mb-3 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <h2 className="font-bold text-gray-900">
                {warnings.length} Warning{warnings.length !== 1 ? "s" : ""} Along Route
              </h2>
            </div>
            <div className="space-y-2">
              {warnings.map((w) => (
                <div
                  key={w.locationId}
                  className="rounded-lg border bg-amber-50 p-3"
                >
                  <div className="mb-1 flex items-center gap-2">
                    <RiskBadge level={w.riskLevel} />
                  </div>
                  <p className="text-sm text-gray-800">{w.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {warnings.length === 0 && directions && (
          <div className="mt-6 rounded-lg bg-green-50 p-4 text-center">
            <p className="font-medium text-green-700">
              No high-risk zones detected on this route!
            </p>
          </div>
        )}
      </div>

      <div className="relative min-h-[400px] flex-1">
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
