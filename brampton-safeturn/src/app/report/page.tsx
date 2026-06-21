import ReportForm from "@/components/report/ReportForm";
import { Shield } from "lucide-react";

export default function ReportPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8">
      <div className="mb-8 text-center">
        <Shield className="mx-auto mb-3 h-10 w-10 text-red-500" />
        <h1 className="text-2xl font-bold text-gray-900">Report a Danger Spot</h1>
        <p className="mt-2 text-gray-600">
          Help your community by reporting unsafe intersections, near-misses, and
          confusing traffic signals in Brampton.
        </p>
      </div>
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <ReportForm />
      </div>
    </div>
  );
}
