import { RiskLevel } from "@/types";
import { getRiskColor } from "@/lib/safety-score";

interface RiskBadgeProps {
  level: RiskLevel;
}

const LABELS: Record<RiskLevel, string> = {
  high: "High Risk",
  medium: "Medium Risk",
  low: "Low Risk",
};

export default function RiskBadge({ level }: RiskBadgeProps) {
  const color = getRiskColor(level);
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
      style={{ backgroundColor: color }}
    >
      {LABELS[level]}
    </span>
  );
}
