"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { SessionSummary } from "@/types/api";

export function useSessionSummary(
  id: string | null,
  opts?: { club?: string; includeShots?: boolean; limitShots?: number },
) {
  const qs = new URLSearchParams();
  if (opts?.club && opts.club !== "ALL") qs.set("club", opts.club);
  if (opts?.includeShots) qs.set("includeShots", "true");
  if (opts?.limitShots) qs.set("limitShots", String(opts.limitShots));
  const suffix = qs.toString() ? `?${qs.toString()}` : "";

  return useQuery({
    queryKey: [
      "session-summary",
      id ?? "",
      opts?.club ?? "ALL",
      Boolean(opts?.includeShots),
      opts?.limitShots ?? 0,
    ],
    queryFn: () => get<SessionSummary>(`/sessions/${id}/summary${suffix}`),
    enabled: Boolean(id),
  });
}
