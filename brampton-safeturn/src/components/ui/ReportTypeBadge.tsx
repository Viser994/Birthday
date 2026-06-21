import { ReportType, REPORT_TYPE_LABELS } from "@/types";

interface ReportTypeBadgeProps {
  type: ReportType;
}

const TYPE_COLORS: Record<ReportType, string> = {
  near_miss: "bg-red-100 text-red-700",
  confusing_traffic_light: "bg-yellow-100 text-yellow-800",
  unsafe_left_turn: "bg-orange-100 text-orange-700",
  sudden_braking_zone: "bg-purple-100 text-purple-700",
  general_issue: "bg-gray-100 text-gray-700",
};

export default function ReportTypeBadge({ type }: ReportTypeBadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TYPE_COLORS[type]}`}
    >
      {REPORT_TYPE_LABELS[type]}
    </span>
  );
}
