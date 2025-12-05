"use client";

import { useMemo } from "react";

export type ClubFilterProps = {
  clubs: Array<string | null | undefined>;
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
};

export function ClubFilter({ clubs, value, onChange, label = "Club", disabled }: ClubFilterProps) {
  const options = useMemo(() => {
    const unique = Array.from(
      new Set(clubs.filter((c): c is string => Boolean(c && c.trim()))),
    ).sort((a, b) => a.localeCompare(b));
    return ["ALL", ...unique];
  }, [clubs]);

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-muted-foreground" htmlFor="club-filter">
        {label}
      </label>
      <select
        id="club-filter"
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      >
        {options.map((club) => (
          <option key={club} value={club}>
            {club === "ALL" ? "All clubs" : club}
          </option>
        ))}
      </select>
    </div>
  );
}
