"use client";

import { LocationCluster } from "@/types";
import { getRiskColor } from "@/lib/safety-score";
import Link from "next/link";
import { Share2, Download } from "lucide-react";
import { useRef } from "react";

interface ShareCardProps {
  location: LocationCluster;
  rank?: number;
}

export default function ShareCard({ location, rank }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    const text = `⚠️ ${location.name} in Brampton has a safety score of ${location.safetyScore}/100. Report dangerous spots on SafeTurn!`;
    if (navigator.share) {
      await navigator.share({ title: "Brampton SafeTurn", text, url: window.location.href });
    } else {
      await navigator.clipboard.writeText(text);
      alert("Copied to clipboard!");
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const link = document.createElement("a");
    link.download = `safeturn-${location.id}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  return (
    <div className="space-y-3">
      <div
        ref={cardRef}
        className="overflow-hidden rounded-xl shadow-lg"
        style={{
          background: `linear-gradient(135deg, ${getRiskColor(location.riskLevel)}22, #1a1a2e)`,
        }}
      >
        <div className="p-5 text-white">
          {rank && (
            <p className="mb-1 text-sm font-bold text-red-400">#{rank} Most Dangerous</p>
          )}
          <p className="mb-1 text-xs uppercase tracking-wider text-gray-400">
            Brampton SafeTurn
          </p>
          <h3 className="mb-3 text-lg font-bold leading-tight">{location.name}</h3>
          <div className="flex items-end gap-4">
            <div>
              <p
                className="text-4xl font-black"
                style={{ color: getRiskColor(location.riskLevel) }}
              >
                {location.safetyScore}
              </p>
              <p className="text-xs text-gray-400">Safety Score / 100</p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-300">
                {location.reports.length} community reports
              </p>
              <p className="text-xs capitalize text-gray-400">
                Trend: {location.trend}
              </p>
            </div>
          </div>
          <p className="mt-4 text-xs text-gray-500">
            bramptonsafeturn.ca · Community Road Safety
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={handleShare}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
        <button
          onClick={handleDownload}
          className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-medium hover:bg-gray-50"
        >
          <Download className="h-4 w-4" />
          Save Image
        </button>
        <Link
          href={`/location/${location.id}`}
          className="flex flex-1 items-center justify-center rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white hover:bg-red-600"
        >
          Details
        </Link>
      </div>
    </div>
  );
}
