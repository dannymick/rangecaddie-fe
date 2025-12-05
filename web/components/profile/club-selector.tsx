"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { CLUB_TYPES, clubTypeLabel, type ClubTypeValue } from "@/lib/enums";
import { useUserClubs, saveUserClubs } from "@/lib/clubs";

export function ClubSelector() {
  const { clubs, setClubs, save, resetToDefault } = useUserClubs();
  const [working, setWorking] = useState<ClubTypeValue[] | null>(null);
  const current = working ?? clubs;

  const selected = new Set(current);
  const count = selected.size;

  const toggle = (c: ClubTypeValue) => {
    const next = new Set(selected);
    if (next.has(c)) next.delete(c);
    else next.add(c);
    setWorking(Array.from(next));
  };

  const all = CLUB_TYPES as unknown as ClubTypeValue[];

  const selectAll = () => setWorking(all);
  const selectNone = () => setWorking([]);

  const onSave = () => {
    const next = working ?? clubs;
    setClubs(next);
    saveUserClubs(next);
    setWorking(null);
  };

  const onCancel = () => setWorking(null);

  const dirty = useMemo(() => working !== null && JSON.stringify(working) !== JSON.stringify(clubs), [working, clubs]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Selected clubs</span>
        <span className="font-medium">{count}</span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {all.map((c) => (
          <button
            key={c}
            onClick={() => toggle(c)}
            className={`h-9 rounded-md border px-3 text-sm text-left cursor-pointer transition-colors ${
              selected.has(c)
                ? "border-primary bg-primary/10 text-foreground"
                : "hover:bg-muted/50"
            }`}
            aria-pressed={selected.has(c)}
          >
            {clubTypeLabel(c)}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={selectAll} className="cursor-pointer">Select all</Button>
          <Button variant="ghost" size="sm" onClick={selectNone} className="cursor-pointer">None</Button>
          <Button variant="ghost" size="sm" onClick={resetToDefault} className="cursor-pointer">Reset</Button>
        </div>
        <div className="flex gap-2">
          {dirty && (
            <Button variant="ghost" size="sm" onClick={onCancel} className="cursor-pointer">Cancel</Button>
          )}
          <Button size="sm" onClick={onSave} className="cursor-pointer">Save</Button>
        </div>
      </div>
    </div>
  );
}

export default ClubSelector;
