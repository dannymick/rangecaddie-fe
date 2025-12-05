"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, del } from "@/lib/api";
import type { RangeSession, SessionListResponse } from "@/types/api";

export function useCreateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => post<RangeSession>("/sessions"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useSessions(params?: { limit?: number; cursor?: string }) {
  const q = new URLSearchParams();
  if (params?.limit) q.set("limit", String(params.limit));
  if (params?.cursor) q.set("cursor", params.cursor);
  const suffix = q.toString() ? `?${q.toString()}` : "";
  return useQuery({
    queryKey: ["sessions", params],
    queryFn: () => get<SessionListResponse>(`/sessions${suffix}`),
  });
}

export function useSession(id: string) {
  return useQuery({
    queryKey: ["session", id],
    queryFn: () => get<RangeSession>(`/sessions/${id}`),
    enabled: !!id,
  });
}

export function useDeleteSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => del<{ ok: boolean }>(`/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}
