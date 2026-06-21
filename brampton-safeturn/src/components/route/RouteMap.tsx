"use client";

import { useMemo } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  DirectionsRenderer,
  Marker,
} from "@react-google-maps/api";
import { LocationCluster, RouteWarning } from "@/types";
import { BRAMPTON_CENTER } from "@/lib/constants";
import { getRiskColor } from "@/lib/safety-score";

const MAP_CONTAINER_STYLE = { width: "100%", height: "100%" };

interface RouteMapProps {
  directions: google.maps.DirectionsResult | null;
  warnings: RouteWarning[];
  locations: LocationCluster[];
}

export default function RouteMap({
  directions,
  warnings,
  locations,
}: RouteMapProps) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["visualization"],
  });

  const warningLocationIds = useMemo(
    () => new Set(warnings.map((w) => w.locationId)),
    [warnings]
  );

  const routeLocations = useMemo(
    () => locations.filter((l) => warningLocationIds.has(l.id)),
    [locations, warningLocationIds]
  );

  if (!isLoaded || !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-gray-100 p-6">
        <p className="mb-4 text-center text-sm text-gray-600">
          {!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
            ? "Add Google Maps API key to enable route visualization"
            : "Loading route map..."}
        </p>
        {warnings.length > 0 && (
          <div className="w-full max-w-md space-y-2">
            {warnings.map((w) => (
              <div
                key={w.locationId}
                className="rounded-lg border bg-white p-3 text-sm"
              >
                <span
                  className="mr-2 inline-block h-2 w-2 rounded-full"
                  style={{ backgroundColor: getRiskColor(w.riskLevel) }}
                />
                {w.message}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      center={BRAMPTON_CENTER}
      zoom={12}
    >
      {directions && (
        <DirectionsRenderer
          directions={directions}
          options={{
            polylineOptions: { strokeColor: "#3b82f6", strokeWeight: 5 },
          }}
        />
      )}
      {routeLocations.map((loc) => (
        <Marker
          key={loc.id}
          position={{ lat: loc.lat, lng: loc.lng }}
          icon={{
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            scale: 6,
            fillColor: getRiskColor(loc.riskLevel),
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
          }}
        />
      ))}
    </GoogleMap>
  );
}
