"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { del, post } from "@/lib/api";
import type { PostShotInput, PreShotInput, Shot } from "@/types/api";

export function useCreatePreShot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, body }: { sessionId: string; body: PreShotInput }) =>
      post<Shot>(`/sessions/${sessionId}/shots/pre`, body),
    onSuccess: (_data, variables) => {
      const sid = variables.sessionId;
      qc.invalidateQueries({ queryKey: ["session", sid] });
      qc.invalidateQueries({ queryKey: ["session-summary", sid] });
    },
  });
}

export function useCreateOrUpdatePostShot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ shotId, body }: { shotId: string; body: PostShotInput; sessionId?: string }) =>
      post<Shot>(`/shots/${shotId}/post`, body),
    onSuccess: (_data, variables) => {
      const sid = (variables as any).sessionId as string | undefined;
      if (sid) {
        qc.invalidateQueries({ queryKey: ["session", sid] });
        qc.invalidateQueries({ queryKey: ["session-summary", sid] });
      }
    },
  });
}

export function useDeleteShot(shotId: string, sessionId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => del<{ ok: boolean }>(`/shots/${shotId}`),
    onSuccess: () => {
      if (sessionId) {
        qc.invalidateQueries({ queryKey: ["session", sessionId] });
        qc.invalidateQueries({ queryKey: ["session-summary", sessionId] });
      }
    },
  });
}
