"use client";

import { useState, useEffect } from "react";
import { ReportType, REPORT_TYPE_LABELS } from "@/types";
import { submitReport } from "@/lib/reports";
import { recordReportSubmission, getStreakData, StreakData } from "@/lib/streak";
import { BRAMPTON_CENTER } from "@/lib/constants";
import { MapPin, Camera, Send, Flame } from "lucide-react";
import dynamic from "next/dynamic";

const SafetyMap = dynamic(() => import("@/components/map/SafetyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded-lg bg-gray-100">
      <p className="text-sm text-gray-500">Loading map...</p>
    </div>
  ),
});

interface ReportFormProps {
  initialLat?: number;
  initialLng?: number;
}

export default function ReportForm({ initialLat, initialLng }: ReportFormProps) {
  const [type, setType] = useState<ReportType>("near_miss");
  const [description, setDescription] = useState("");
  const [lat, setLat] = useState(initialLat ?? BRAMPTON_CENTER.lat);
  const [lng, setLng] = useState(initialLng ?? BRAMPTON_CENTER.lng);
  const [locationName, setLocationName] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [streak, setStreak] = useState<StreakData | null>(() =>
    typeof window !== "undefined" ? getStreakData() : null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLat(pos.coords.latitude);
          setLng(pos.coords.longitude);
        },
        () => {}
      );
    }
  }, []);

  const handleMapClick = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = URL.createObjectURL(imageFile);
      }

      await submitReport({
        lat,
        lng,
        type,
        description: description || undefined,
        imageUrl,
        locationName: locationName || undefined,
      });

      const newStreak = recordReportSubmission();
      setStreak(newStreak);
      setSuccess(true);
      setDescription("");
      setImageFile(null);
      setLocationName("");
    } catch {
      setError("Failed to submit report. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center">
        <div className="mb-4 text-4xl">✅</div>
        <h2 className="mb-2 text-xl font-bold text-green-800">Report Submitted!</h2>
        <p className="mb-4 text-green-700">
          Thank you for helping make Brampton roads safer.
        </p>
        {streak && (
          <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2 text-orange-700">
            <Flame className="h-5 w-5" />
            <span className="font-semibold">
              {streak.currentStreak}-day streak · {streak.totalPoints} points
            </span>
          </div>
        )}
        <button
          onClick={() => setSuccess(false)}
          className="rounded-lg bg-green-600 px-6 py-2 text-white hover:bg-green-700"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {streak && streak.currentStreak > 0 && (
        <div className="flex items-center gap-2 rounded-lg bg-orange-50 px-4 py-3 text-orange-700">
          <Flame className="h-5 w-5" />
          <span className="text-sm font-medium">
            {streak.currentStreak}-day report streak · {streak.totalPoints} points
          </span>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Report Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ReportType)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        >
          {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Location Name (optional)
        </label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g. Steeles Ave & Hurontario St"
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <MapPin className="h-4 w-4" />
          Location (click map to set)
        </label>
        <div className="h-48 overflow-hidden rounded-lg border">
          <SafetyMap
            locations={[]}
            onMapClick={handleMapClick}
            center={{ lat, lng }}
            zoom={14}
            showHeatmap={false}
          />
        </div>
        <p className="mt-1 text-xs text-gray-500">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe what happened..."
          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
          <Camera className="h-4 w-4" />
          Photo (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-gray-500 file:mr-4 file:rounded-lg file:border-0 file:bg-red-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-red-600 hover:file:bg-red-100"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-red-500 px-6 py-3 font-medium text-white hover:bg-red-600 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}
