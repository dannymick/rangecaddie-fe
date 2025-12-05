"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { SessionIntentionResultChart } from "@/components/charts/session-intention-result-chart";
import { SessionDispersionScatter } from "@/components/charts/session-dispersion-scatter";
import { SessionTrajectoryChart } from "@/components/charts/session-trajectory-chart";
import { SessionContactDonut } from "@/components/charts/session-contact-donut";
import { OverviewMatchRateChart } from "@/components/charts/overview-match-rate-chart";
import { OverviewGappingChart } from "@/components/charts/overview-gapping-chart";
import { OverviewPracticeVolumeChart } from "@/components/charts/overview-practice-volume-chart";
import { ClubFilter } from "@/components/club-filter";
import { RecentSessionsList } from "@/components/sessions/recent-sessions-list";
import { useSessions } from "@/hooks/useSessions";
import { useOverviewMetrics } from "@/hooks/useOverviewMetrics";
import { useSessionSummary } from "@/hooks/useSessionSummary";
import { takeLastSessionId } from "@/lib/sessions";

type StatsTabProps = {
  sessionId: string | null;
  clubParam: string;
  onUpdateQuery: (updates: Record<string, string | null | undefined>) => void;
};

export function StatsTab({ sessionId, clubParam, onUpdateQuery }: StatsTabProps) {
  const { data: sessionsData } = useSessions({ limit: 50 });
  const sessions = sessionsData ?? [];
  const [storedSessionId, setStoredSessionId] = useState<string | null>(null);

  useEffect(() => {
    setStoredSessionId(takeLastSessionId());
  }, []);

  const resolvedSessionId = useMemo(() => {
    if (sessionId) return sessionId;
    if (storedSessionId) return storedSessionId;
    return sessions[0]?.id ?? null;
  }, [sessionId, storedSessionId, sessions]);

  useEffect(() => {
    if (!sessionId && resolvedSessionId) {
      onUpdateQuery({ tab: "stats", session: resolvedSessionId });
    }
  }, [sessionId, resolvedSessionId, onUpdateQuery]);

  const overview = useOverviewMetrics({ club: clubParam });
  const summary = useSessionSummary(resolvedSessionId, {
    club: clubParam,
    includeShots: true,
    limitShots: 1000,
  });

  const selectedSession = sessions.find((s) => s.id === resolvedSessionId) ?? null;

  const clubOptions = useMemo(() => {
    const options = new Set<string>();
    overview.data?.gapping.forEach((g) => {
      if (g.club) options.add(g.club);
    });
    summary.data?.byClub.forEach((c) => {
      if (c.club) options.add(c.club);
    });
    return Array.from(options).sort((a, b) => a.localeCompare(b));
  }, [overview.data?.gapping, summary.data?.byClub]);

  const handleSessionChange = useCallback(
    (raw: string | null) => {
      const next = raw && raw.length > 0 ? raw : null;
      onUpdateQuery({ tab: "stats", session: next });
    },
    [onUpdateQuery],
  );

  const handleClubChange = useCallback(
    (next: string) => {
      onUpdateQuery({ tab: "stats", club: next === "ALL" ? null : next });
    },
    [onUpdateQuery],
  );

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_200px]">
        <div>
          <label
            className="text-xs font-medium text-muted-foreground"
            htmlFor="session-select"
          >
            Session
          </label>
          <select
            id="session-select"
            className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={resolvedSessionId ?? ""}
            onChange={(event) => handleSessionChange(event.target.value)}
          >
            {sessions.length === 0 ? (
              <option value="">No sessions yet</option>
            ) : null}
            {sessions.map((session) => (
              <option key={session.id} value={session.id}>
                {new Date(session.createdAt).toLocaleDateString()} (
                {session._count?.shots ?? 0} shots)
              </option>
            ))}
          </select>
        </div>
        <ClubFilter
          clubs={clubOptions}
          value={clubParam}
          onChange={handleClubChange}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overall performance</CardTitle>
          <CardDescription>Trends across your recent sessions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {overview.isLoading ? (
            <p className="text-sm text-muted-foreground">Loading overview…</p>
          ) : overview.data ? (
            <>
              <h3>Match rate</h3>
              <OverviewMatchRateChart sessions={overview.data.sessions} />
              <h3>Gapping</h3>
              <OverviewGappingChart data={overview.data.gapping} />
              <h3>Practice volume</h3>
              <OverviewPracticeVolumeChart
                data={overview.data.practiceCalendar}
              />
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Unable to load overview metrics.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle>Session summary</CardTitle>
            <CardDescription>
              {selectedSession
                ? `${new Date(selectedSession.createdAt).toLocaleString()} • ${
                    selectedSession._count?.shots ?? 0
                  } shots`
                : "Select a session to see shot-level analytics"}
            </CardDescription>
          </div>
          {selectedSession ? (
            <button
              aria-label="Clear session selection"
              className="h-8 w-8 rounded-md border text-xl leading-none flex items-center justify-center"
              onClick={() => handleSessionChange(null)}
            >
              ×
            </button>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-6">
          {!selectedSession ? (
            <p className="text-sm text-muted-foreground">
              Pick a session above to explore your shot analytics.
            </p>
          ) : summary.isLoading ? (
            <p className="text-sm text-muted-foreground">
              Loading session summary…
            </p>
          ) : summary.data ? (
            <div className="space-y-6">
              <SessionIntentionResultChart data={summary.data.pairs} />
              <h2>Dispersion</h2>
              <SessionDispersionScatter
                data={summary.data.scatter}
                shots={summary.data.shots}
              />
              <h2>Trajectory</h2>
              <SessionTrajectoryChart data={summary.data.trajectoryPairs} />
              <h2>Contact</h2>
              <SessionContactDonut data={summary.data.contact} />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Unable to load this session.
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent sessions</CardTitle>
          <CardDescription>
            Latest activity saved on this device
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RecentSessionsList />
        </CardContent>
      </Card>
    </div>
  );
}
