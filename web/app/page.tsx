"use client";

import { useCallback, useMemo } from "react";
import { BottomNav, type Tab } from "@/components/bottom-nav";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { HomeTab } from "@/components/home-tab";
import { StatsTab } from "@/components/stats-tab";
import { ProfileTab } from "@/components/profile-tab";

export default function Home() {
  const router = useRouter();
  const { searchParams, updateQuery } = useQueryController();

  const tab = useMemo<Tab>(() => {
    const param = searchParams?.get("tab");
    if (param === "stats" || param === "profile") return param;
    return "home";
  }, [searchParams]);

  const sessionParam = searchParams?.get("session") ?? null;
  const clubParam = searchParams?.get("club") ?? "ALL";

  const handleTabChange = useCallback(
    (next: Tab) => {
      if (next === "new") {
        router.push("/new", { scroll: false });
        return;
      }
      updateQuery({
        tab: next,
        session: next === "stats" ? sessionParam ?? undefined : null,
      });
    },
    [router, updateQuery, sessionParam],
  );

  return (
    <div className="min-h-dvh pb-16">
      <main className="mx-auto max-w-screen-sm p-4 space-y-4">
        {tab === "home" && <HomeTab />}
        {tab === "stats" && (
          <StatsTab
            clubParam={clubParam}
            sessionId={sessionParam}
            onUpdateQuery={updateQuery}
          />
        )}
        {tab === "profile" && <ProfileTab />}
      </main>
      <BottomNav active={tab} onChange={handleTabChange} />
    </div>
  );
}

type QueryUpdates = Record<string, string | null | undefined>;

function useQueryController() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const updateQuery = useCallback(
    (updates: QueryUpdates) => {
      const current = new URLSearchParams(searchParams?.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null) {
          current.delete(key);
        } else if (value !== undefined) {
          current.set(key, value);
        }
      });
      const query = current.toString();
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  return { searchParams, updateQuery };
}
