import { Report, ReportType } from "@/types";
import { getSeverityWeight } from "@/lib/safety-score";

const MOCK_LOCATIONS: {
  name: string;
  lat: number;
  lng: number;
  neighbourhood: string;
}[] = [
  { name: "Steeles Ave & Hurontario St", lat: 43.7598, lng: -79.759, neighbourhood: "Downtown Brampton" },
  { name: "Queen St & Main St", lat: 43.6844, lng: -79.7597, neighbourhood: "Downtown Brampton" },
  { name: "Bovaird Dr & Chinguacousy Rd", lat: 43.7165, lng: -79.7995, neighbourhood: "Heart Lake" },
  { name: "Williams Pkwy & Bramalea Rd", lat: 43.702, lng: -79.662, neighbourhood: "Bramalea" },
  { name: "Gore Rd & Queen St E", lat: 43.691, lng: -79.715, neighbourhood: "Springdale" },
  { name: "McLaughlin Rd & Steeles Ave", lat: 43.758, lng: -79.789, neighbourhood: "Mount Pleasant" },
  { name: "Sandalwood Pkwy & Hurontario", lat: 43.741, lng: -79.758, neighbourhood: "Sandringham-Wellington" },
  { name: "Fletcher's Creek & Creditview", lat: 43.728, lng: -79.812, neighbourhood: "Fletcher's Creek" },
  { name: "Queen St W & Mississauga Rd", lat: 43.685, lng: -79.835, neighbourhood: "Queen Street Corridor" },
  { name: "Goreway Dr & Steeles Ave", lat: 43.757, lng: -79.695, neighbourhood: "Goreway Drive" },
  { name: "Airport Rd & Steeles Ave", lat: 43.756, lng: -79.725, neighbourhood: "McLaughlin Road" },
  { name: "Clark Blvd & Bramalea Rd", lat: 43.718, lng: -79.665, neighbourhood: "Bramalea" },
];

const REPORT_TYPES: ReportType[] = [
  "near_miss",
  "confusing_traffic_light",
  "unsafe_left_turn",
  "sudden_braking_zone",
  "general_issue",
];

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

function generateMockReports(): Report[] {
  const reports: Report[] = [];
  let id = 1;

  for (const loc of MOCK_LOCATIONS) {
    const count = 3 + Math.floor(Math.random() * 8);
    for (let i = 0; i < count; i++) {
      const type = REPORT_TYPES[Math.floor(Math.random() * REPORT_TYPES.length)];
      const days = Math.floor(Math.random() * 60);
      reports.push({
        id: `mock-${id++}`,
        lat: loc.lat + (Math.random() - 0.5) * 0.002,
        lng: loc.lng + (Math.random() - 0.5) * 0.002,
        type,
        timestamp: daysAgo(days),
        description: getMockDescription(type, loc.name),
        severityWeight: getSeverityWeight(type),
        locationName: loc.name,
      });
    }
  }

  return reports;
}

function getMockDescription(type: ReportType, location: string): string {
  const descriptions: Record<ReportType, string[]> = {
    near_miss: [
      `Almost hit a cyclist turning left at ${location}`,
      `Car ran red light — close call for pedestrians`,
      `Driver swerved last second to avoid collision`,
    ],
    confusing_traffic_light: [
      `Left turn arrow timing is confusing for drivers`,
      `Signal phases don't match traffic flow`,
      `Multiple signal heads show conflicting indications`,
    ],
    unsafe_left_turn: [
      `No protected left turn — gap in oncoming traffic too small`,
      `Left turn lane too short for volume of traffic`,
      `Drivers making illegal left turns during rush hour`,
    ],
    sudden_braking_zone: [
      `Traffic suddenly stops due to hidden speed camera`,
      `Frequent hard braking near school zone`,
      `Merge lane ends abruptly causing brake checks`,
    ],
    general_issue: [
      `Poor visibility due to overgrown trees`,
      `Potholes causing drivers to swerve`,
      `No crosswalk markings visible`,
    ],
  };
  const options = descriptions[type];
  return options[Math.floor(Math.random() * options.length)];
}

export const MOCK_REPORTS = generateMockReports();

export function getNeighbourhoodForLocation(lat: number, lng: number): string {
  let closest = MOCK_LOCATIONS[0];
  let minDist = Infinity;
  for (const loc of MOCK_LOCATIONS) {
    const d = Math.hypot(loc.lat - lat, loc.lng - lng);
    if (d < minDist) {
      minDist = d;
      closest = loc;
    }
  }
  return closest.neighbourhood;
}

export { MOCK_LOCATIONS };
