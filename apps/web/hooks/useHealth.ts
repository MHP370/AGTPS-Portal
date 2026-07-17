"use client";

import { useQuery } from "@tanstack/react-query";

import {
  getReadinessReport,
  healthQueryKey,
} from "@/lib/health";

export function useReadinessReport() {
  return useQuery({
    queryKey: [...healthQueryKey, "readiness"],
    queryFn: getReadinessReport,
    refetchInterval: 60_000,
  });
}
