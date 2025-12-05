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
  ErrorBar,
} from "recharts";
import type { OverviewMetrics } from "@/types/api";

type GappingPoint = OverviewMetrics["gapping"][number];

type Props = { data: GappingPoint[] };

export function OverviewGappingChart({ data }: Props) {
  const chartData = useMemo(() => {
    return [...data]
      .filter((item) => item.avgCarry !== null && item.avgCarry !== undefined)
      .sort((a, b) => (a.avgCarry ?? 0) - (b.avgCarry ?? 0))
      .map((item) => ({
        club: item.club ?? "",
        avgCarry: item.avgCarry ?? 0,
        stdev: item.stdev ?? 0,
        errorTop: (item.avgCarry ?? 0) + (item.stdev ?? 0),
        errorBottom: Math.max(0, (item.avgCarry ?? 0) - (item.stdev ?? 0)),
      }));
  }, [data]);

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">Add distance data to see gapping insights.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={320}>
      <BarChart data={chartData} margin={{ top: 16, right: 24, left: 0, bottom: 32 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="club" angle={-45} textAnchor="end" interval={0} height={60} tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 12 }} unit="yd" />
        <Tooltip formatter={(value: number) => [`${value.toFixed(1)} yd`, "Avg carry"]} />
        <Bar dataKey="avgCarry" fill="#22c55e" radius={[4, 4, 0, 0]}>
          <ErrorBar
            dataKey="stdev"
            width={4}
            strokeWidth={2}
            stroke="#14532d"
            direction="y"
            data={chartData.map((item) => ({
              x: item.club,
              y: item.avgCarry,
              value: [item.errorBottom, item.errorTop],
            }))}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
