# Brampton SafeTurn

A community-powered road safety intelligence map that reveals dangerous driving zones in Brampton, Ontario.

## Features

- **Interactive Safety Map** — Full-page Google Map with danger markers, heatmap layer, and risk colour coding (red/yellow/green)
- **Community Reports** — Submit near-misses, confusing signals, unsafe left turns, and more with GPS location
- **Safety Scoring** — Dynamic 0–100 scores based on report count, recency, and severity
- **Location Details** — Per-intersection breakdown with trends, issue summaries, and shareable cards
- **Route Risk Checker** — Enter start/destination to see risky intersections along your route
- **Viral Features** — Top 10 dangerous spots, neighbourhood leaderboard, report streak points, Instagram-ready share cards
- **Insights Dashboard** — Rising risk zones, improving areas, and trending reports

## Tech Stack

- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS 4**
- **Firebase** (Firestore, Auth, Storage)
- **Google Maps JavaScript API** (Maps, Heatmap, Directions)
- **html2canvas** for shareable image cards

## Getting Started

```bash
cd brampton-safeturn
npm install
cp .env.example .env.local
# Add your API keys to .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Maps JavaScript API key (Maps, Directions, Visualization) |
| `NEXT_PUBLIC_FIREBASE_*` | Firebase project configuration |

**Demo mode:** Without API keys, the app runs with mock Brampton intersection data and localStorage for submitted reports.

### Firebase Setup

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable Firestore and create a `reports` collection
3. Copy config values to `.env.local`

Firestore document schema (`reports` collection):

```
lat: number
lng: number
type: string (near_miss | confusing_traffic_light | unsafe_left_turn | sudden_braking_zone | general_issue)
timestamp: Timestamp
description: string (optional)
severityWeight: number
locationName: string (optional)
imageUrl: string (optional)
```

### Google Maps Setup

Enable these APIs in Google Cloud Console:

- Maps JavaScript API
- Directions API
- Geocoding API (optional)

## Pages

| Route | Description |
|---|---|
| `/` | Main safety map with heatmap and markers |
| `/report` | Submit a community safety report |
| `/location/[id]` | Intersection detail with score and trends |
| `/route` | Route risk checker |
| `/insights` | Top danger spots, leaderboard, trends |

## Safety Scoring

```
Score = 100 - normalized(risk)

Risk factors:
- Report count
- Recency (exponential decay, 30-day half-life)
- Severity weights:
  - Near miss: 5
  - Unsafe left turn: 4
  - Confusing signal / Sudden braking: 3
  - General issue: 2

Risk levels:
- High: score < 40
- Medium: 40–69
- Low: 70+
```

## License

MIT
