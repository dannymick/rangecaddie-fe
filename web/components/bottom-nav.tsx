"use client";
import { House, CirclePlus, ChartColumnBig, User } from "lucide-react";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Tab = "home" | "sessions" | "new" | "stats" | "profile";

export interface BottomNavProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

const navigationButtons: { key: Tab; label: string; icon?: ReactNode }[] = [
  { key: "home", label: "Home", icon: <House /> },
  { key: "new", label: "New", icon: <CirclePlus /> },
  { key: "stats", label: "Stats", icon: <ChartColumnBig /> },
  { key: "profile", label: "Profile", icon: <User /> },
];

export function BottomNav({ active, onChange }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 inset-x-0 border-t bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-screen-sm grid grid-cols-4">
        {navigationButtons.map((it) => (
          <button
            key={it.key}
            className={cn(
              "h-14 flex flex-col items-center justify-center text-xs font-medium transition-colors cursor-pointer",
              active === it.key
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            onClick={() => onChange(it.key)}
            aria-current={active === it.key}
          >
            <span className="text-base leading-none mb-1" aria-hidden>
              {it.icon}
            </span>
            {it.label}
          </button>
        ))}
      </div>
    </nav>
  );
}

export type { Tab };
