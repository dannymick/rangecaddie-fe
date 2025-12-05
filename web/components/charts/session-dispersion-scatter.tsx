"use client";

import { useMemo } from "react";
import {
  ResponsiveContainer,
  ScatterChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Scatter,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import type { SessionSummary } from "@/types/api";

type ScatterOnly = { distance: number | null; lateral: number | null };

type Props = {
  data: ScatterOnly[];
  shots?: NonNullable<SessionSummary["shots"]>;
};

export function SessionDispersionScatter({ data, shots }: Props) {
  const points = useMemo(() => {
    if (shots && shots.length > 0) {
      return shots
        .filter((shot) => shot.distance !== null && shot.distance !== undefined && shot.lateral !== null && shot.lateral !== undefined)
        .map((shot) => ({
          x: shot.lateral as number,
          y: shot.distance as number,
          club: shot.club ?? "",
          intendedFlight: shot.intendedFlight ?? "",
          actualFlight: shot.actualFlight ?? "",
        }));
    }
    return data
      .filter((point) => point.distance !== null && point.distance !== undefined && point.lateral !== null && point.lateral !== undefined)
      .map((point) => ({ x: point.lateral as number, y: point.distance as number }));
  }, [data, shots]);

  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">No post-shot data captured yet.</p>;
  }

  const tooltip = ({ active, payload }: TooltipProps<number, string>) => {
    if (!active || !payload || payload.length === 0) return null;
    const point = payload[0].payload as {
      x: number;
      y: number;
      club?: string;
      intendedFlight?: string;
      actualFlight?: string;
    };
    return (
      <div className="rounded-md border bg-background/95 px-3 py-2 text-xs shadow">
        <div className="font-medium">Carry: {point.y.toFixed(1)} yd</div>
        <div>Lateral: {point.x.toFixed(1)} yd</div>
        {point.club ? <div>Club: {point.club}</div> : null}
        {point.intendedFlight || point.actualFlight ? (
          <div>
            {point.intendedFlight ? `Intended: ${point.intendedFlight}` : ""}
            {point.actualFlight ? ` • Actual: ${point.actualFlight}` : ""}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <ScatterChart margin={{ top: 16, right: 24, bottom: 24, left: 8 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis
          type="number"
          dataKey="x"
          name="Lateral miss (yds)"
          unit="yd"
          tick={{ fontSize: 12 }}
          label={{ value: "Lateral miss (yds)", position: "bottom", offset: 0 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name="Carry (yds)"
          unit="yd"
          tick={{ fontSize: 12 }}
          label={{ value: "Carry (yds)", angle: -90, position: "insideLeft" }}
        />
        <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="4 4" />
        <Tooltip cursor={{ strokeDasharray: "3 3" }} content={tooltip} />
        <Scatter
          data={points}
          name="Shots"
          fill="#2563eb"
          shape="circle"
          legendType="circle"
        />
      </ScatterChart>
    </ResponsiveContainer>
  );
}
