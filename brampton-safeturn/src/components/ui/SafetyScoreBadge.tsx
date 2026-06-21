import { RiskLevel } from "@/types";
import { getRiskColor } from "@/lib/safety-score";

interface SafetyScoreBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export default function SafetyScoreBadge({
  score,
  size = "md",
  showLabel = true,
}: SafetyScoreBadgeProps) {
  const level: RiskLevel =
    score < 40 ? "high" : score < 70 ? "medium" : "low";
  const color = getRiskColor(level);

  const sizeClasses = {
    sm: "h-10 w-10 text-sm",
    md: "h-14 w-14 text-lg",
    lg: "h-20 w-20 text-2xl",
  };

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex items-center justify-center rounded-full font-bold text-white shadow-md ${sizeClasses[size]}`}
        style={{ backgroundColor: color }}
      >
        {score}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-gray-500">Safety Score</span>
      )}
    </div>
  );
}
