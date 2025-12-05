"use client";

import { useQuery } from "@tanstack/react-query";
import { get } from "@/lib/api";
import type { UserProfile } from "@/types/api";

export function useUserAccount() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => get<UserProfile>("/auth/profile"),
  });
}

