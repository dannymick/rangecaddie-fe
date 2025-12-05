"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Bar,
  Cell,
} from "recharts";

type Pair = { intended: string | null; actual: string | null; count: number };

type Props = { data?: Pair[] };

const TRAJECTORY_COLORS: Record<string, string> = {
  LOW: "#0ea5e9",
  MEDIUM: "#f59e0b",
  HIGH: "#22c55e",
  UNKNOWN: "#94a3b8",
};

const TRAJECTORY_ORDER = ["LOW", "MEDIUM", "HIGH"] as const;
type TrajectoryKey = (typeof TRAJECTORY_ORDER)[number];

const normalizeTrajectory = (value: string | null | undefined) => {
  const candidate = value?.toUpperCase() ?? "UNKNOWN";
  return TRAJECTORY_ORDER.includes(candidate as TrajectoryKey)
    ? (candidate as TrajectoryKey)
    : "UNKNOWN";
};

const formatLabel = (value: TrajectoryKey) => {
  if (value === "UNKNOWN") return "Unknown";
  return value.charAt(0) + value.slice(1).toLowerCase();
};

type ChartDatum = {
  key: TrajectoryKey;
  label: string;
  count: number;
};

export function SessionTrajectoryChart({ data }: Props) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];
    const counts = new Map<TrajectoryKey, number>();
    data.forEach(({ actual, count }) => {
      const key = normalizeTrajectory(actual);
      counts.set(key, (counts.get(key) ?? 0) + count);
    });
    return TRAJECTORY_ORDER.map((key) => ({
      key,
      label: formatLabel(key),
      count: counts.get(key) ?? 0,
    }));
  }, [data]);

  const totalShots = chartData.reduce((sum, entry) => sum + entry.count, 0);
  if (totalShots === 0) {
    return (
      <p className="text-sm text-muted-foreground">No trajectory data yet.</p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={chartData} barGap={16}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {chartData.map((entry) => (
            <Cell
              key={entry.key}
              fill={TRAJECTORY_COLORS[entry.key] ?? TRAJECTORY_COLORS.UNKNOWN}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
