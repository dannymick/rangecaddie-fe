"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import type { OverviewMetrics } from "@/types/api";

type SessionPoint = OverviewMetrics["sessions"][number];

type Props = { sessions: SessionPoint[] };

export function OverviewMatchRateChart({ sessions }: Props) {
  const chartData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [] as Array<Record<string, number | string>>;
    const parsed = sessions.map((s) => ({
      ...s,
      matchRatePercent: Math.round((s.matchRate ?? 0) * 1000) / 10,
    }));
    return parsed.map((point, index) => {
      const windowStart = Math.max(0, index - 2);
      const slice = parsed.slice(windowStart, index + 1);
      const rolling =
        slice.reduce((sum, item) => sum + item.matchRatePercent, 0) / slice.length;
      return {
        date: point.date,
        matchRatePercent: point.matchRatePercent,
        rollingAvg: Math.round(rolling * 10) / 10,
      };
    });
  }, [sessions]);

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No session history yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis tick={{ fontSize: 12 }} unit="%" domain={[0, 100]} />
        <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, "Match rate"]} />
        <Legend />
        <Line type="monotone" dataKey="matchRatePercent" name="Match rate" stroke="#2563eb" strokeWidth={2} dot={false} />
        <Line type="monotone" dataKey="rollingAvg" name="3-session avg" stroke="#94a3b8" strokeWidth={2} strokeDasharray="6 4" dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
