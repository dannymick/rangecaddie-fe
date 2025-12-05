"use client";

import { useEffect, useMemo, useState } from "react";
import { CLUB_TYPES, type ClubTypeValue } from "@/lib/enums";

const STORAGE_KEY = "rc_clubs";

function sanitizeClubs(input: unknown): ClubTypeValue[] | null {
  if (!Array.isArray(input)) return null;
  const set = new Set<ClubTypeValue>();
  for (const v of input) {
    if (typeof v === "string" && (CLUB_TYPES as readonly string[]).includes(v)) {
      set.add(v as ClubTypeValue);
    }
  }
  return set.size ? Array.from(set) : null;
}

export function loadUserClubs(): ClubTypeValue[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return sanitizeClubs(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveUserClubs(clubs: ClubTypeValue[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(clubs));
}

export function useUserClubs() {
  const [clubs, setClubs] = useState<ClubTypeValue[]>(CLUB_TYPES as unknown as ClubTypeValue[]);
  useEffect(() => {
    const stored = loadUserClubs();
    if (stored) setClubs(stored);
  }, []);
  const update = (next: ClubTypeValue[]) => setClubs(next);
  const save = () => saveUserClubs(clubs);
  const resetToDefault = () => setClubs(CLUB_TYPES as unknown as ClubTypeValue[]);
  return useMemo(() => ({ clubs, setClubs: update, save, resetToDefault }), [clubs]);
}

