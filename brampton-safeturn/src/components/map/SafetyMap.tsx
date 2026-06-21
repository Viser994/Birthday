"use client";

import { useCallback, useMemo, useState } from "react";
import {
  GoogleMap,
  useJsApiLoader,
  Marker,
  HeatmapLayer,
} from "@react-google-maps/api";
import { LocationCluster } from "@/types";
import { BRAMPTON_CENTER } from "@/lib/constants";
import { getRiskColor } from "@/lib/safety-score";
import MarkerInfoPanel from "@/components/map/MarkerInfoPanel";

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
};

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  streetViewControl: false,
  mapTypeControl: false,
  fullscreenControl: true,
  styles: [
    { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
  ],
};

interface SafetyMapProps {
  locations: LocationCluster[];
  onMapClick?: (lat: number, lng: number) => void;
  center?: google.maps.LatLngLiteral;
  zoom?: number;
  showHeatmap?: boolean;
  children?: React.ReactNode;
}

export default function SafetyMap({
  locations,
  onMapClick,
  center = BRAMPTON_CENTER,
  zoom = 12,
  showHeatmap = true,
  children,
}: SafetyMapProps) {
  const [selected, setSelected] = useState<LocationCluster | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: ["visualization"],
  });

  const heatmapData = useMemo(() => {
    if (!isLoaded || typeof google === "undefined") return [];
    return locations.flatMap((loc) =>
      loc.reports.map((r) => ({
        location: new google.maps.LatLng(r.lat, r.lng),
        weight: r.severityWeight,
      }))
    );
  }, [locations, isLoaded]);

  const handleMapClick = useCallback(
    (e: google.maps.MapMouseEvent) => {
      if (e.latLng && onMapClick) {
        onMapClick(e.latLng.lat(), e.latLng.lng());
      }
    },
    [onMapClick]
  );

  if (loadError) {
    return <MapFallback locations={locations} onSelect={setSelected} />;
  }

  if (!isLoaded) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="mb-2 h-8 w-8 animate-spin rounded-full border-4 border-red-500 border-t-transparent mx-auto" />
          <p className="text-sm text-gray-500">Loading map...</p>
        </div>
      </div>
    );
  }

  const hasApiKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  if (!hasApiKey) {
    return <MapFallback locations={locations} onSelect={setSelected} />;
  }

  return (
    <div className="relative h-full w-full">
      <GoogleMap
        mapContainerStyle={MAP_CONTAINER_STYLE}
        center={center}
        zoom={zoom}
        options={MAP_OPTIONS}
        onClick={handleMapClick}
      >
        {showHeatmap && heatmapData.length > 0 && (
          <HeatmapLayer
            data={heatmapData}
            options={{
              radius: 25,
              opacity: 0.6,
              gradient: [
                "rgba(0, 255, 0, 0)",
                "rgba(34, 197, 94, 0.5)",
                "rgba(234, 179, 8, 0.7)",
                "rgba(239, 68, 68, 0.9)",
                "rgba(185, 28, 28, 1)",
              ],
            }}
          />
        )}

        {locations.map((loc) => (
          <Marker
            key={loc.id}
            position={{ lat: loc.lat, lng: loc.lng }}
            icon={{
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: getRiskColor(loc.riskLevel),
              fillOpacity: 0.9,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            }}
            onClick={() => setSelected(loc)}
          />
        ))}

        {children}
      </GoogleMap>

      {selected && (
        <MarkerInfoPanel location={selected} onClose={() => setSelected(null)} />
      )}

      <div className="absolute left-4 top-4 z-10 rounded-lg bg-white/95 p-3 shadow-md backdrop-blur-sm">
        <p className="mb-2 text-xs font-semibold text-gray-700">Risk Level</p>
        <div className="space-y-1">
          {(["high", "medium", "low"] as const).map((level) => (
            <div key={level} className="flex items-center gap-2 text-xs">
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: getRiskColor(level) }}
              />
              <span className="capitalize text-gray-600">{level}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MapFallback({
  locations,
  onSelect,
}: {
  locations: LocationCluster[];
  onSelect: (loc: LocationCluster) => void;
}) {
  return (
    <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-green-50 via-yellow-50 to-red-50">
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center p-6">
          <p className="mb-1 text-lg font-semibold text-gray-800">Brampton Safety Map</p>
          <p className="mb-4 text-sm text-gray-500">
            Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to enable the interactive map
          </p>
          <div className="mx-auto grid max-w-lg grid-cols-2 gap-2">
            {locations.slice(0, 8).map((loc) => (
              <button
                key={loc.id}
                onClick={() => onSelect(loc)}
                className="rounded-lg border bg-white p-3 text-left shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: getRiskColor(loc.riskLevel) }}
                  />
                  <span className="truncate text-xs font-medium">{loc.name}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  Score: {loc.safetyScore} · {loc.reports.length} reports
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
