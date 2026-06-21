import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  onSnapshot,
  Timestamp,
} from "firebase/firestore";
import { db, isFirebaseConfigured } from "@/lib/firebase";
import { Report, ReportType } from "@/types";
import { getSeverityWeight } from "@/lib/safety-score";
import { MOCK_REPORTS } from "@/lib/mock-data";

const LOCAL_STORAGE_KEY = "safeturn_reports";

function getLocalReports(): Report[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveLocalReports(reports: Report[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
}

export async function fetchReports(): Promise<Report[]> {
  if (isFirebaseConfigured() && db) {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        lat: data.lat,
        lng: data.lng,
        type: data.type as ReportType,
        timestamp:
          data.timestamp instanceof Timestamp
            ? data.timestamp.toMillis()
            : data.timestamp,
        description: data.description,
        severityWeight: data.severityWeight,
        imageUrl: data.imageUrl,
        locationName: data.locationName,
        userId: data.userId,
      };
    });
  }

  const local = getLocalReports();
  return [...MOCK_REPORTS, ...local];
}

export function subscribeToReports(
  callback: (reports: Report[]) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    const q = query(collection(db, "reports"), orderBy("timestamp", "desc"));
    return onSnapshot(q, (snapshot) => {
      const reports = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          lat: data.lat,
          lng: data.lng,
          type: data.type as ReportType,
          timestamp:
            data.timestamp instanceof Timestamp
              ? data.timestamp.toMillis()
              : data.timestamp,
          description: data.description,
          severityWeight: data.severityWeight,
          imageUrl: data.imageUrl,
          locationName: data.locationName,
          userId: data.userId,
        };
      });
      callback(reports);
    });
  }

  callback([...MOCK_REPORTS, ...getLocalReports()]);
  const interval = setInterval(() => {
    callback([...MOCK_REPORTS, ...getLocalReports()]);
  }, 5000);
  return () => clearInterval(interval);
}

export interface SubmitReportInput {
  lat: number;
  lng: number;
  type: ReportType;
  description?: string;
  imageUrl?: string;
  locationName?: string;
}

export async function submitReport(input: SubmitReportInput): Promise<Report> {
  const report: Omit<Report, "id"> = {
    lat: input.lat,
    lng: input.lng,
    type: input.type,
    timestamp: Date.now(),
    description: input.description,
    severityWeight: getSeverityWeight(input.type),
    imageUrl: input.imageUrl,
    locationName: input.locationName,
  };

  if (isFirebaseConfigured() && db) {
    const docRef = await addDoc(collection(db, "reports"), {
      ...report,
      timestamp: Timestamp.fromMillis(report.timestamp),
    });
    return { ...report, id: docRef.id };
  }

  const newReport: Report = { ...report, id: `local-${Date.now()}` };
  const local = getLocalReports();
  local.unshift(newReport);
  saveLocalReports(local);
  return newReport;
}
