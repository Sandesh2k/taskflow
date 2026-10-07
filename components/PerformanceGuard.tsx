"use client";

import { useEffect } from "react";
import { installPerformanceGuard } from "@/lib/performance-guard";

export default function PerformanceGuard() {
  useEffect(() => {
    installPerformanceGuard();
  }, []);

  return null;
}
