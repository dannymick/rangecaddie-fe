"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
import type { OverviewMetrics } from "@/types/api";

type PracticeEntry = OverviewMetrics["practiceCalendar"][number];

type Props = { data: PracticeEntry[] };

function isoWeek(date: Date) {
  const tmp = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = tmp.getUTCDay() || 7;
  tmp.setUTCDate(tmp.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((tmp.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

export function OverviewPracticeVolumeChart({ data }: Props) {
  const chartData = useMemo(() => {
    const buckets = new Map<string, number>();
    data.forEach((entry) => {
      const date = new Date(`${entry.date}T00:00:00Z`);
      if (Number.isNaN(date.getTime())) return;
      const key = isoWeek(date);
      buckets.set(key, (buckets.get(key) ?? 0) + entry.shots);
    });
    return Array.from(buckets.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([week, shots]) => ({ week, shots }));
  }, [data]);

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">Log more shots to build your practice history.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 32 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="week" angle={-45} height={60} textAnchor="end" tick={{ fontSize: 11 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip formatter={(value: number) => [`${value} shots`, "Shots"]} />
        <Bar dataKey="shots" fill="#2563eb" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
