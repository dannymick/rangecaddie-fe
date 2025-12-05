"use client";

// Simple client-side auth utilities for RangeCaddie Web

export type Tokens = {
  accessToken: string;
  refreshToken: string;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "http://localhost:3000";

const ACCESS_KEY = "rc_access";
const REFRESH_KEY = "rc_refresh";
const USER_ID_KEY = "rc_user";

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function getUserId(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(USER_ID_KEY);
}

function setTokens(tokens: Tokens) {
  if (!isBrowser()) return;
  localStorage.setItem(ACCESS_KEY, tokens.accessToken);
  localStorage.setItem(REFRESH_KEY, tokens.refreshToken);
  const userId = extractUserId(tokens.accessToken);
  if (userId) localStorage.setItem(USER_ID_KEY, userId);
}

export function clearTokens() {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_ID_KEY);
}

function baseUrl(url: string): string {
  if (/^https?:\/\//i.test(url)) return url;
  const path = url.startsWith("/") ? url : `/${url}`;
  return `${API_BASE_URL}${path}`;
}

// Decode base64url string -> JSON, and extract userId from JWT payload
function extractUserId(jwt: string): string | null {
  try {
    const parts = jwt.split(".");
    if (parts.length !== 3) return null;
    const b64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const json = JSON.parse(typeof atob === "function" ? atob(b64) : Buffer.from(b64, "base64").toString("utf8"));
    const id = json?.userId ?? json?.sub ?? null;
    return typeof id === "string" ? id : null;
  } catch {
    return null;
  }
}

async function parseJSON(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function login(email: string, password: string): Promise<void> {
  const res = await fetch(baseUrl("/auth/login"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await parseJSON(res);
    throw new Error(typeof body === "string" ? body : body?.message || "Login failed");
  }
  const tokens = (await res.json()) as Tokens;
  setTokens(tokens);
}

export async function signup(email: string, password: string, _name?: string): Promise<void> {
  const res = await fetch(baseUrl("/auth/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const body = await parseJSON(res);
    throw new Error(typeof body === "string" ? body : body?.message || "Signup failed");
  }
  const tokens = (await res.json()) as Tokens;
  setTokens(tokens);
}

export function logout(redirectTo: string = "/login") {
  clearTokens();
  if (isBrowser()) window.location.assign(redirectTo);
}

export async function refreshToken(): Promise<void> {
  const refreshToken = getRefreshToken();
  const userId = getUserId();
  if (!refreshToken || !userId) {
    throw new Error("Missing refresh credentials");
  }
  const res = await fetch(baseUrl("/auth/refresh"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ userId, refreshToken }),
  });
  if (!res.ok) {
    const body = await parseJSON(res);
    throw new Error(typeof body === "string" ? body : body?.message || "Refresh failed");
  }
  const tokens = (await res.json()) as Tokens;
  setTokens(tokens);
}

export async function fetchWithAuth(input: string | URL | Request, init: RequestInit = {}): Promise<Response> {
  const url = typeof input === "string" ? baseUrl(input) : input instanceof URL ? input.toString() : input;
  const access = getAccessToken();

  const headers = new Headers(init.headers || {});
  if (access) headers.set("Authorization", `Bearer ${access}`);

  const doFetch = () => fetch(url, { ...init, headers });

  let res = await doFetch();
  if (res.status !== 401) return res;

  // try a single refresh-then-retry
  try {
    await refreshToken();
    const newAccess = getAccessToken();
    if (newAccess) headers.set("Authorization", `Bearer ${newAccess}`);
    res = await doFetch();
    return res;
  } catch {
    // refresh failed -> force logout
    logout("/login");
    return res;
  }
}

export function startGoogleAuth() {
  if (!isBrowser()) return;
  // This will navigate away to the backend Google OAuth flow.
  window.location.href = baseUrl("/auth/google");
}

