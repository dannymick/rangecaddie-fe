"use client";

// Unified API client for RangeCaddie web
// - Prefixes API base URL
// - Uses fetchWithAuth for Bearer + refresh
// - Normalizes errors to ApiError

import { fetchWithAuth } from "@/lib/auth";

const BASE = (process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000").replace(/\/$/, "");

export type ApiError = { status: number; message: string; details?: unknown };

async function handle<T>(res: Response): Promise<T> {
  if (res.ok) {
    if (res.status === 204) return undefined as T;
    return res.json() as Promise<T>;
  }
  let msg = "Request failed";
  let details: unknown;
  try {
    const data = await res.json();
    msg = (data as any)?.message ?? msg;
    details = data;
  } catch {
    try {
      msg = await res.text();
    } catch {}
  }
  const err: ApiError = { status: res.status, message: msg, details };
  throw err;
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  // Only set Content-Type when there is a JSON body
  const hasBody = typeof init.body !== 'undefined' && init.body !== null;
  const headers = new Headers(init.headers || {});
  if (hasBody && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');

  const res = await fetchWithAuth(`${BASE}${path}`, {
    credentials: 'include',
    ...init,
    headers,
  });
  return handle<T>(res);
}

export const get = <T>(path: string) => api<T>(path, { method: 'GET' });
export const post = <T>(path: string, body?: unknown) =>
  api<T>(path, body === undefined ? { method: 'POST' } : { method: 'POST', body: JSON.stringify(body) });
export const patch = <T>(path: string, body?: unknown) =>
  api<T>(path, body === undefined ? { method: 'PATCH' } : { method: 'PATCH', body: JSON.stringify(body) });
export const del = <T>(path: string) => api<T>(path, { method: 'DELETE' });
