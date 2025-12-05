"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getSessions, getStoredSessions } from "@/lib/sessions";

export function RecentSessionsList() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [sessions, setSessions] = useState(() => getStoredSessions());

  // Refresh sessions on focus
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      const data = await getSessions();
      if (active) {
        setSessions(data);
      }
    };
    void refresh();
    const onFocus = () => {
      void refresh();
    };
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  if (sessions.length === 0) {
    return <p className="text-sm text-muted-foreground">No sessions yet.</p>;
  }

  return (
    <div className="divide-y">
      {sessions.map((s) => (
        <button
          key={s.id}
          className="w-full text-left py-3 cursor-pointer hover:bg-muted/50 rounded-bl-0 rounded-br-0 px-2 -mx-2"
          onClick={() => {
            const sp = new URLSearchParams(searchParams ?? undefined);
            sp.set("tab", "stats");
            sp.set("session", s.id);
            router.replace(`${pathname}?${sp.toString()}`, { scroll: false });
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{s.title ?? "Range session"}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(s.date).toLocaleString()} • {s.shots} shot
                {s.shots === 1 ? "" : "s"}
              </p>
            </div>
            <span className="text-xs text-muted-foreground">Open</span>
          </div>
        </button>
      ))}
    </div>
  );
}
