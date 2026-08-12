"use client";

import { cn } from "@/lib/utils/cn";
import type { UsageDimension } from "@/lib/store/types";

export const EXPLORE_TOP_N_OPTIONS = [5, 10, 20] as const;
export type ExploreTopN = (typeof EXPLORE_TOP_N_OPTIONS)[number];

const DIMENSIONS: { value: UsageDimension; label: string }[] = [
  { value: "model", label: "Model" },
  { value: "apiKey", label: "API Key" },
];

/** The Explore tab's "Total spend by [Model|API Key] · Top [5|10|20]" row-level controls. */
export function ExploreControls({
  dimension,
  onDimensionChange,
  topN,
  onTopNChange,
}: {
  dimension: UsageDimension;
  onDimensionChange: (dimension: UsageDimension) => void;
  topN: ExploreTopN;
  onTopNChange: (topN: ExploreTopN) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-foreground-muted">Total spend by</span>
      <div className="inline-flex items-center rounded-lg border border-border bg-surface p-1">
        {DIMENSIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onDimensionChange(option.value)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              dimension === option.value
                ? "bg-surface-raised text-brand"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      <span className="ml-2 text-sm text-foreground-muted">Top</span>
      <div className="inline-flex items-center rounded-lg border border-border bg-surface p-1">
        {EXPLORE_TOP_N_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onTopNChange(n)}
            className={cn(
              "cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              topN === n
                ? "bg-surface-raised text-brand"
                : "text-foreground-muted hover:text-foreground",
            )}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
