import { api } from "./api";

export type HealthState = "UP" | "DEGRADED" | "DOWN";

export interface ReadinessCheck {
  key: string;
  title: string;
  status: HealthState;
  message?: string;
  error?: string | null;
  path?: string;
  responseTimeMs?: number;
  activeCount?: number;
  downCount?: number;
  degradedCount?: number;
  failedQueueCount?: number;
  usedPercent?: number;
  totalBytes?: number;
  availableBytes?: number;
  createdAt?: string;
  finishedAt?: string | null;
  missing?: string[];
  warnings?: string[];
}

export interface ReadinessReport {
  status: HealthState;
  service: string;
  timestamp: string;
  uptimeSeconds: number;
  checks: ReadinessCheck[];
}

export const healthQueryKey = ["health"];

export function getReadinessReport() {
  return api.get<ReadinessReport>("/health/readiness");
}
