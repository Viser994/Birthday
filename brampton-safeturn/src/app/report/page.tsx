import ReportForm from "@/components/report/ReportForm";
import { AlertTriangle } from "lucide-react";

export default function ReportPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 shadow-lg shadow-rose-500/25">
          <AlertTriangle className="h-7 w-7 text-white" />
        </div>
        <h1 className="text-3xl font-bold text-white">Report a Danger Spot</h1>
        <p className="mt-3 text-slate-400">
          Help your community by reporting unsafe intersections, near-misses, and
          confusing traffic signals in Brampton.
        </p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-6 shadow-xl backdrop-blur-sm sm:p-8">
        <ReportForm />
      </div>
    </div>
  );
}
