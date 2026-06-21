import { LocationCluster, Report } from "@/types";
import {
  calculateSafetyScore,
  getRiskLevel,
  getTrend,
} from "@/lib/safety-score";

const CLUSTER_PRECISION = 3;

export function getLocationId(lat: number, lng: number): string {
  return `${lat.toFixed(CLUSTER_PRECISION)}_${lng.toFixed(CLUSTER_PRECISION)}`;
}

export function clusterReports(reports: Report[]): LocationCluster[] {
  const clusters = new Map<string, Report[]>();

  for (const report of reports) {
    const id = getLocationId(report.lat, report.lng);
    const existing = clusters.get(id) || [];
    existing.push(report);
    clusters.set(id, existing);
  }

  return Array.from(clusters.entries()).map(([id, clusterReports]) => {
    const lat =
      clusterReports.reduce((s, r) => s + r.lat, 0) / clusterReports.length;
    const lng =
      clusterReports.reduce((s, r) => s + r.lng, 0) / clusterReports.length;
    const name =
      clusterReports.find((r) => r.locationName)?.locationName ||
      `Intersection near ${lat.toFixed(4)}, ${lng.toFixed(4)}`;
    const safetyScore = calculateSafetyScore(clusterReports);

    return {
      id,
      lat,
      lng,
      name,
      reports: clusterReports.sort((a, b) => b.timestamp - a.timestamp),
      safetyScore,
      riskLevel: getRiskLevel(safetyScore),
      trend: getTrend(clusterReports),
    };
  });
}

export function findNearbyClusters(
  clusters: LocationCluster[],
  lat: number,
  lng: number,
  radiusKm = 0.5
): LocationCluster[] {
  return clusters.filter((c) => {
    const dLat = c.lat - lat;
    const dLng = c.lng - lng;
    const dist = Math.sqrt(dLat * dLat + dLng * dLng) * 111;
    return dist <= radiusKm;
  });
}
