import type { OverviewRankedStat } from "@/lib/store/types";

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
  return `${value}`;
}

/** Numbered "Top API Keys" / "Top Apps" list — label plus a token-volume figure, ranked. */
export function RankedTokenList({ items, emptyLabel }: { items: OverviewRankedStat[]; emptyLabel: string }) {
  if (items.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-foreground-subtle">
        {emptyLabel}
      </div>
    );
  }

  return (
    <ol className="space-y-1">
      {items.map((item, index) => (
        <li key={item.key} className="flex items-center gap-3 rounded-lg px-1 py-2">
          <span className="w-4 shrink-0 text-xs text-foreground-subtle">{index + 1}</span>
          <span className="min-w-0 flex-1 truncate text-sm text-foreground">{item.label}</span>
          <span className="shrink-0 text-sm text-foreground-muted">{formatTokens(item.totalTokens)} tok</span>
        </li>
      ))}
    </ol>
  );
}
