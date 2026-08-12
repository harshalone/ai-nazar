import { TrendingDown, TrendingUp } from "lucide-react";
import { Sparkline } from "@/components/ui/sparkline";
import type { DimensionTrend } from "@/lib/store/types";

const MAX_ROWS = 5;

function formatChange(changePct: number | null): { text: string; tone: "good" | "danger" | "neutral" } {
  if (changePct === null) return { text: "New", tone: "neutral" };
  if (changePct === 0) return { text: "0%", tone: "neutral" };
  const rounded = Math.abs(changePct) >= 999 ? ">999" : Math.abs(changePct).toFixed(0);
  return {
    text: `${rounded}%`,
    tone: changePct > 0 ? "good" : "danger",
  };
}

/** Ranked list of the biggest spend movers in a dimension, each with a sparkline and period-over-period % change. */
export function TrendingList({ trends }: { trends: DimensionTrend[] }) {
  const ranked = [...trends]
    .filter((t) => t.changePct !== null)
    .sort((a, b) => Math.abs(b.changePct ?? 0) - Math.abs(a.changePct ?? 0))
    .slice(0, MAX_ROWS);

  if (ranked.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center text-sm text-foreground-subtle">
        Not enough data yet.
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {ranked.map((trend) => {
        const change = formatChange(trend.changePct);
        return (
          <div
            key={trend.key}
            className="flex items-center justify-between gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-surface-raised"
          >
            <span className="min-w-0 flex-1 truncate text-sm text-foreground">{trend.label}</span>
            <Sparkline values={trend.sparkline} color={change.tone === "danger" ? "var(--color-danger)" : "var(--color-brand)"} />
            <span
              className={
                change.tone === "good"
                  ? "flex w-16 shrink-0 items-center justify-end gap-1 text-xs font-medium text-good"
                  : change.tone === "danger"
                    ? "flex w-16 shrink-0 items-center justify-end gap-1 text-xs font-medium text-danger"
                    : "flex w-16 shrink-0 items-center justify-end gap-1 text-xs font-medium text-foreground-subtle"
              }
            >
              {change.tone === "good" && <TrendingUp className="h-3 w-3" />}
              {change.tone === "danger" && <TrendingDown className="h-3 w-3" />}
              {change.text}
            </span>
          </div>
        );
      })}
    </div>
  );
}
