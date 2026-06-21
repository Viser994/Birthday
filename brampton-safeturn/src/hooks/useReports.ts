"use client";

import { useEffect, useState } from "react";
import { Report } from "@/types";
import { subscribeToReports } from "@/lib/reports";

export function useReports() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = subscribeToReports((data) => {
      setReports(data);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  return { reports, loading };
}
