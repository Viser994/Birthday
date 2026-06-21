"use client";

import { useState, useEffect } from "react";
import { ReportType, REPORT_TYPE_LABELS } from "@/types";
import { submitReport } from "@/lib/reports";
import { recordReportSubmission, getStreakData, StreakData } from "@/lib/streak";
import { BRAMPTON_CENTER } from "@/lib/constants";
import { MapPin, Camera, Send, Flame, CheckCircle2 } from "lucide-react";
import dynamic from "next/dynamic";

const SafetyMap = dynamic(() => import("@/components/map/SafetyMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-48 items-center justify-center rounded-xl bg-slate-800">
      <p className="text-sm text-slate-400">Loading map...</p>
    </div>
  ),
});

const inputClass =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-slate-500 focus:border-rose-500/50 focus:outline-none focus:ring-1 focus:ring-rose-500/50";

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
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center">
        <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-400" />
        <h2 className="mb-2 text-xl font-bold text-white">Report Submitted!</h2>
        <p className="mb-6 text-slate-300">
          Thank you for helping make Brampton roads safer.
        </p>
        {streak && (
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-500/30 bg-orange-500/10 px-5 py-2.5 text-orange-300">
            <Flame className="h-5 w-5" />
            <span className="font-semibold">
              {streak.currentStreak}-day streak · {streak.totalPoints} points
            </span>
          </div>
        )}
        <button
          onClick={() => setSuccess(false)}
          className="rounded-xl bg-emerald-500 px-6 py-2.5 font-medium text-white hover:bg-emerald-600"
        >
          Submit Another Report
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {streak && streak.currentStreak > 0 && (
        <div className="flex items-center gap-2 rounded-xl border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-orange-300">
          <Flame className="h-5 w-5" />
          <span className="text-sm font-medium">
            {streak.currentStreak}-day report streak · {streak.totalPoints} points
          </span>
        </div>
      )}

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Report Type
        </label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as ReportType)}
          className={inputClass}
        >
          {Object.entries(REPORT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value} className="bg-slate-900">
              {label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Location Name (optional)
        </label>
        <input
          type="text"
          value={locationName}
          onChange={(e) => setLocationName(e.target.value)}
          placeholder="e.g. Steeles Ave & Hurontario St"
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
          <MapPin className="h-4 w-4 text-rose-400" />
          Location (click map to set)
        </label>
        <div className="h-52 overflow-hidden rounded-xl border border-white/10">
          <SafetyMap
            locations={[]}
            onMapClick={handleMapClick}
            center={{ lat, lng }}
            zoom={14}
            showHeatmap={false}
          />
        </div>
        <p className="mt-1.5 text-xs text-slate-500">
          {lat.toFixed(5)}, {lng.toFixed(5)}
        </p>
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-300">
          Description (optional)
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Describe what happened..."
          className={inputClass}
        />
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-300">
          <Camera className="h-4 w-4" />
          Photo (optional)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files?.[0] || null)}
          className="w-full text-sm text-slate-400 file:mr-4 file:rounded-xl file:border-0 file:bg-rose-500/20 file:px-4 file:py-2 file:text-sm file:font-medium file:text-rose-300 hover:file:bg-rose-500/30"
        />
      </div>

      {error && (
        <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-500 to-orange-500 px-6 py-3.5 font-semibold text-white shadow-lg shadow-rose-500/25 disabled:opacity-50"
      >
        <Send className="h-4 w-4" />
        {submitting ? "Submitting..." : "Submit Report"}
      </button>
    </form>
  );
}
