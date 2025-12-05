"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecentSessionsList } from "@/components/sessions/recent-sessions-list";
import { StartNewCTA } from "@/components/start-new-cta";
import { AboutCard } from "@/components/about-card";

export function HomeTab() {
  const [isNewUser, setIsNewUser] = useState(true);

  useEffect(() => {
    const seen = typeof window !== "undefined" ? localStorage.getItem("rc_seen") : "1";
    if (!seen && typeof window !== "undefined") {
      localStorage.setItem("rc_seen", "1");
    }
    setIsNewUser(!seen);
  }, []);

  return (
    <div className="space-y-4">
      <StartNewCTA />
      {isNewUser ? (
        <AboutCard />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Recent sessions</CardTitle>
            <CardDescription>Quick look at your latest work</CardDescription>
          </CardHeader>
          <CardContent>
            <RecentSessionsList />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
