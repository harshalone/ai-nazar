"use client";

import { cn } from "@/lib/utils/cn";

export const DATE_RANGE_PRESETS = [
  { label: "7d", days: 7 },
  { label: "14d", days: 14 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
] as const;

export function DateRangePicker({
  days,
  onChange,
}: {
  days: number;
  onChange: (days: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-lg border border-border bg-surface p-1">
      {DATE_RANGE_PRESETS.map((preset) => (
        <button
          key={preset.days}
          type="button"
          onClick={() => onChange(preset.days)}
          className={cn(
            "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            days === preset.days
              ? "bg-surface-raised text-brand"
              : "text-foreground-muted hover:text-foreground",
          )}
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}
