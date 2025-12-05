"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { OverviewMetrics } from "@/types/api";

export function useOverviewMetrics(params?: {
  since?: string;
  club?: string;
  includeShots?: boolean;
  limitShots?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.since) qs.set("since", params.since);
  if (params?.club && params.club !== "ALL") qs.set("club", params.club);
  if (params?.includeShots) qs.set("includeShots", "true");
  if (params?.limitShots) qs.set("limitShots", String(params.limitShots));

  return useQuery({
    queryKey: [
      "overview",
      params?.since ?? "default",
      params?.club ?? "ALL",
      Boolean(params?.includeShots),
      params?.limitShots ?? 0,
    ],
    queryFn: () =>
      get<OverviewMetrics>(`/metrics/overview${qs.toString() ? `?${qs.toString()}` : ""}`),
  });
}
