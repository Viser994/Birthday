"use client";

import { useCallback, useMemo, useState } from "react";
import { GoogleMap, Marker, HeatmapLayer } from "@react-google-maps/api";
import { LocationCluster } from "@/types";
import { BRAMPTON_CENTER } from "@/lib/constants";
import { getRiskColor } from "@/lib/safety-score";
import { useGoogleMaps } from "@/components/providers/GoogleMapsProvider";
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
    { elementType: "geometry", stylers: [{ color: "#1d2c4d" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#1a3646" }] },
    { featureType: "road", elementType: "geometry", stylers: [{ color: "#304a7d" }] },
    { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#255763" }] },
    { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#2c6675" }] },
    { featureType: "water", elementType: "geometry", stylers: [{ color: "#0e1626" }] },
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
  const { isLoaded, loadError } = useGoogleMaps();

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
      <div className="flex h-full items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-rose-500 border-t-transparent" />
          <p className="text-sm text-slate-400">Loading map...</p>
        </div>
      </div>
    );
  }

  const hasApiKey = Boolean(process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);

  if (!hasApiKey) {
    return <MapFallback locations={locations} onSelect={setSelected} selected={selected} onClose={() => setSelected(null)} />;
  }

  return (
    <div className="relative z-0 h-full w-full">
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
              radius: 30,
              opacity: 0.65,
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
              scale: 11,
              fillColor: getRiskColor(loc.riskLevel),
              fillOpacity: 0.95,
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

      {showHeatmap && (
        <div className="pointer-events-none absolute left-4 top-4 z-10 rounded-2xl border border-white/10 bg-slate-900/80 p-3 shadow-xl backdrop-blur-md">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Risk Level
          </p>
          <div className="space-y-1.5">
            {(["high", "medium", "low"] as const).map((level) => (
              <div key={level} className="flex items-center gap-2 text-xs">
                <span
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: getRiskColor(level) }}
                />
                <span className="capitalize text-slate-300">{level}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MapFallback({
  locations,
  onSelect,
  selected,
  onClose,
}: {
  locations: LocationCluster[];
  onSelect: (loc: LocationCluster) => void;
  selected?: LocationCluster | null;
  onClose?: () => void;
}) {
  return (
    <div className="relative z-0 h-full w-full overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-900/20 via-transparent to-transparent" />
      <div className="relative flex h-full items-center justify-center overflow-y-auto p-6">
        <div className="w-full max-w-2xl text-center">
          <p className="mb-1 text-xl font-bold text-white">Brampton Safety Map</p>
          <p className="mb-6 text-sm text-slate-400">
            Demo mode — add a Google Maps API key for the live interactive map
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {locations.slice(0, 8).map((loc) => (
              <button
                key={loc.id}
                onClick={() => onSelect(loc)}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left backdrop-blur-sm transition-all hover:border-rose-500/50 hover:bg-white/10"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/20"
                    style={{ backgroundColor: getRiskColor(loc.riskLevel) }}
                  />
                  <span className="truncate text-sm font-medium text-white">
                    {loc.name}
                  </span>
                </div>
                <p className="mt-2 text-xs text-slate-400">
                  Score {loc.safetyScore} · {loc.reports.length} reports
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>
      {selected && onClose && (
        <MarkerInfoPanel location={selected} onClose={onClose} />
      )}
    </div>
  );
}
