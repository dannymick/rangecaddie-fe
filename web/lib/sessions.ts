"use client";

import { get } from "@/lib/api";
import type { RangeSession, SessionListResponse } from "@/types/api";

export type SessionSummary = {
  id: string;
  date: string; // ISO string
  mode: "short" | "long" | "free" | "putting";
  title?: string;
  shots: number;
};

const SESSIONS_KEY = "rc_sessions";
const LAST_SESSION_KEY = "rc_last_session";
const STORAGE_LIMIT = 50;
const API_LIMIT = 50;

function readStore(): SessionSummary[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    return raw ? (JSON.parse(raw) as SessionSummary[]) : [];
  } catch {
    return [];
  }
}

function writeStore(sessions: SessionSummary[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
}

function mapMode(mode?: RangeSession["mode"]): SessionSummary["mode"] {
  switch (mode) {
    case "SHORT":
      return "short";
    case "LONG":
      return "long";
    case "PUTTING":
      return "putting";
    case "FREE":
    default:
      return "free";
  }
}

function toSummary(session: RangeSession): SessionSummary {
  return {
    id: session.id,
    date: session.createdAt ?? new Date().toISOString(),
    mode: mapMode(session.mode),
    shots: session._count?.shots ?? 0,
  };
}

export function getStoredSessions(): SessionSummary[] {
  return readStore();
}

export function addSession(session: SessionSummary) {
  const filtered = readStore().filter((existing) => existing.id !== session.id);
  filtered.unshift(session);
  writeStore(filtered.slice(0, STORAGE_LIMIT)); // keep last STORAGE_LIMIT
}

export function removeSession(id: string) {
  const filtered = readStore().filter((session) => session.id !== id);
  writeStore(filtered);
}

export async function getSessions(): Promise<SessionSummary[]> {
  const stored = readStore();
  try {
    const query = new URLSearchParams();
    query.set("limit", String(API_LIMIT));
    const response = await get<SessionListResponse>(`/sessions?${query.toString()}`);
    const mapped = response.map(toSummary);
    writeStore(mapped.slice(0, STORAGE_LIMIT));
    return mapped;
  } catch {
    return stored;
  }
}

export function getSessionById(id: string): SessionSummary | undefined {
  return readStore().find((s) => s.id === id);
}

export function setLastSessionId(id: string) {
  if (typeof window === "undefined") return;
  localStorage.setItem(LAST_SESSION_KEY, id);
}

export function takeLastSessionId(): string | null {
  if (typeof window === "undefined") return null;
  const id = localStorage.getItem(LAST_SESSION_KEY);
  if (id) localStorage.removeItem(LAST_SESSION_KEY);
  return id;
}
