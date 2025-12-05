"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { get, post, patch, del } from "@/lib/api";
import type { Club, ClubType } from "@/types/api";

export function useClubs() {
  return useQuery({
    queryKey: ["clubs"],
    queryFn: () => get<Club[]>("/clubs"),
  });
}

export function useCreateClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Club>) => post<Club>("/clubs", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
}

export function useUpdateClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Club> }) => patch<Club>(`/clubs/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
}

export function useDeleteClub() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => del<{ ok: boolean }>(`/clubs/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["clubs"] }),
  });
}

export function useClubTypes() {
  return useQuery({
    queryKey: ["club-types"],
    queryFn: () => get<ClubType[]>("/clubs/types"),
  });
}

