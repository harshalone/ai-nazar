import { chartColorAt } from "@/lib/utils/chart-colors";

export interface SegmentedBarItem {
  key: string;
  label: string;
  value: number;
}

/** A single bar split into proportional colored segments, one per ranked item — the Explore tab's summary strip. */
export function SegmentedBar({ items }: { items: SegmentedBarItem[] }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  if (total <= 0) return null;

  return (
    <div>
      <div className="flex h-6 w-full overflow-hidden rounded-lg">
        {items.map((item, index) => (
          <div
            key={item.key}
            style={{ width: `${(item.value / total) * 100}%`, backgroundColor: chartColorAt(index) }}
            title={item.label}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground-muted">
        {items.map((item, index) => (
          <span key={item.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: chartColorAt(index) }} />
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
