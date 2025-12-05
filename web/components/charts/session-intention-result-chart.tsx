"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Bar,
} from "recharts";

const FLIGHT_COLORS: Record<string, string> = {
  STRAIGHT: "#22c55e",
  DRAW: "#2563eb",
  FADE: "#fb7185",
  HOOK: "#7c3aed",
  SLICE: "#f97316",
  PUSH: "#0ea5e9",
  PULL: "#facc15",
};

type Pair = { intended: string | null; actual: string | null; count: number };

export type SessionIntentionResultChartProps = {
  data: Pair[];
};

export function SessionIntentionResultChart({ data }: SessionIntentionResultChartProps) {
  const { categories, actualKeys, chartData } = useMemo(() => {
    const byIntended = new Map<string, Map<string, number>>();
    const actualSet = new Set<string>();

    data.forEach(({ intended, actual, count }) => {
      const intendedKey = intended ?? "UNKNOWN";
      const actualKey = actual ?? "UNKNOWN";
      actualSet.add(actualKey);
      const bucket = byIntended.get(intendedKey) ?? new Map<string, number>();
      bucket.set(actualKey, (bucket.get(actualKey) ?? 0) + count);
      byIntended.set(intendedKey, bucket);
    });

    const sortedIntended = Array.from(byIntended.keys()).sort();
    const actualKeys = Array.from(actualSet.values()).sort();
    const chartData = sortedIntended.map((key) => {
      const bucket = byIntended.get(key)!;
      const entry: Record<string, number | string> = { intended: key === "UNKNOWN" ? "Unknown" : key };
      actualKeys.forEach((actualKey) => {
        entry[actualKey] = bucket.get(actualKey) ?? 0;
      });
      return entry;
    });

    return { categories: sortedIntended, actualKeys, chartData };
  }, [data]);

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No shot intention data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData} stackOffset="sign">
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="intended" tick={{ fontSize: 12 }} />
        <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
        <Tooltip
          formatter={(value: number, name: string) => [value, name === "UNKNOWN" ? "Unknown" : name]}
        />
        <Legend formatter={(value) => (value === "UNKNOWN" ? "Unknown" : value)} />
        {actualKeys.map((key) => (
          <Bar
            key={key}
            dataKey={key}
            stackId="flights"
            fill={FLIGHT_COLORS[key] ?? "#94a3b8"}
            name={key === "UNKNOWN" ? "Unknown" : key}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
