"use client";

import { useQuery } from "@tanstack/react-query";

import {
  auditLogsQueryKey,
  getAuditLogs,
} from "@/lib/audit-logs";

export function useAuditLogs() {
  return useQuery({
    queryKey: auditLogsQueryKey,
    queryFn: getAuditLogs,
    refetchInterval: 60_000,
  });
}
