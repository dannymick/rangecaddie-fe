"use client";

import React, { useMemo } from "react";
import { WheelPicker, WheelPickerWrapper } from "@ncdai/react-wheel-picker";
import { cn } from "@/lib/utils";
import { OPTION_ITEM_HEIGHT } from "@/lib/constants";

export type WheelOption = { value: string; label: React.ReactNode };

type WheelSelectProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: WheelOption[];
  className?: string;
  disabled?: boolean;
  // Visual tuning
  infinite?: boolean;
  visibleCount?: number; // must be a multiple of 4 per library docs
  optionItemHeight?: number;
};

export function WheelSelect({
  id,
  label,
  placeholder = "Select",
  value,
  onChange,
  options,
  className,
  disabled,
  infinite = false,
  visibleCount = 0,
  optionItemHeight = OPTION_ITEM_HEIGHT,
}: WheelSelectProps) {
  // Build options; if no current value match and value is empty/undefined,
  // prepend a placeholder option so the WheelPicker always has a valid value.
  const wheelOptions = useMemo(() => {
    const has = value != null && options.some((o) => o.value === value);
    const isEmpty = value === "" || value == null;
    if (!has && isEmpty) {
      return [{ value: "", label: placeholder } as WheelOption, ...options];
    }
    return options;
  }, [options, value, placeholder]);

  const classNames = useMemo(
    () => ({
      optionItem: "text-sm text-muted-foreground text-white",
      // highlightWrapper:
      // "rounded-lg border bg-muted/30 shadow-inner backdrop-blur-sm overflow-hidden",
      highlightWrapper:
        "bg-zinc-100 text-zinc-950 dark:bg-zinc-900 dark:text-zinc-50",
      highlightItem: "text-foreground text-sm font-medium text-green-500",
    }),
    []
  );

  const resolvedVisibleCount = useMemo(() => {
    const len = wheelOptions.length || 1;
    if (visibleCount && visibleCount > 0) {
      const snapped = Math.max(4, Math.floor(visibleCount / 4) * 4);
      return Math.min(Math.max(8, snapped), 20);
    }
    const target = Math.min(16, len);
    const snapped = Math.max(4, Math.floor(target / 4) * 4);
    return Math.min(16, Math.max(8, snapped));
  }, [visibleCount, wheelOptions.length]);

  return (
    <div className={cn("grid gap-1", className)}>
      {label ? (
        <label htmlFor={id} className="text-sm font-medium">
          {label}
        </label>
      ) : null}

      <div className="relative w-full overflow-hidden">
        <WheelPickerWrapper className="w-full">
          <WheelPicker
            value={
              wheelOptions.some((o) => o.value === (value ?? ""))
                ? (value as string | undefined)
                : wheelOptions[0]?.value
            }
            onValueChange={(v) => onChange?.(v)}
            options={wheelOptions}
            infinite={infinite}
            visibleCount={resolvedVisibleCount}
            optionItemHeight={optionItemHeight}
            classNames={classNames}
          />
        </WheelPickerWrapper>
      </div>
    </div>
  );
}

export default WheelSelect;
