"use client";

import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";

type Slice = { type: string; count: number };

type Props = { data?: Slice[] };

const CONTACT_COLORS: Record<string, string> = {
  PURE: "#22c55e",
  THIN: "#f59e0b",
  FAT: "#ef4444",
  TOE: "#6366f1",
  HEEL: "#0ea5e9",
  UNKNOWN: "#94a3b8",
};

export function SessionContactDonut({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No contact quality logged.
      </p>
    );
  }

  const total = data.reduce((sum, item) => sum + item.count, 0) || 1;

  const legendPayload = data.map((entry) => ({
    value: `${entry.type}: ${entry.count}`,
    type: "square" as const,
    color: CONTACT_COLORS[entry.type] ?? CONTACT_COLORS.UNKNOWN,
    payload: entry,
  }));

  return (
    <ResponsiveContainer width="100%" height={260}>
      <PieChart>
        <Pie
          dataKey="count"
          data={data}
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
        >
          {data.map((entry) => (
            <Cell
              key={entry.type}
              fill={CONTACT_COLORS[entry.type] ?? CONTACT_COLORS.UNKNOWN}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number, _name, { payload }) => {
            const percent = ((value / total) * 100).toFixed(1);
            return [`${value} shots (${percent}%)`, payload?.type ?? ""];
          }}
        />
        <Legend
          layout="horizontal"
          align="center"
          verticalAlign="bottom"
          iconType="square"
          payload={legendPayload}
          wrapperStyle={{ marginTop: 4 }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
