"use client";

import { cn } from "@/lib/utils/cn";

export type ActivityTab = "overview" | "trends" | "explore";

const TABS: { id: ActivityTab; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "trends", label: "Trends" },
  { id: "explore", label: "Explore" },
];

/**
 * Underline tab bar with a per-tab controls slot on the same row (date
 * range on Overview/Trends, dimension + top-N on Explore) — the active
 * tab's state lives in the parent so its controls can sit here instead
 * of inside each panel.
 */
export function ActivityTabs({
  active,
  onActiveChange,
  controls,
  overview,
  trends,
  explore,
}: {
  active: ActivityTab;
  onActiveChange: (tab: ActivityTab) => void;
  controls: React.ReactNode;
  overview: React.ReactNode;
  trends: React.ReactNode;
  explore: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border-subtle">
        <div className="flex items-stretch gap-1">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onActiveChange(tab.id)}
              className={cn(
                "relative flex cursor-pointer items-center px-3 py-2.5 text-sm font-medium transition-colors",
                active === tab.id
                  ? "text-foreground"
                  : "text-foreground-subtle hover:text-foreground-muted",
              )}
            >
              {tab.label}
              {active === tab.id && (
                <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand" />
              )}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 pb-2">{controls}</div>
      </div>

      <div className="mt-6">
        {active === "overview" && overview}
        {active === "trends" && trends}
        {active === "explore" && explore}
      </div>
    </div>
  );
}
