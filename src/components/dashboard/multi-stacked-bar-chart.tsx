"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipProps, CHART_GRID_STROKE, CHART_AXIS_STYLE, safeFormat } from "@/lib/utils/chart-theme";

export interface MultiStackedSeries {
  key: string;
  label: string;
  color: string;
}

/** Arbitrary-series stacked bar chart, keyed by `label` per point — for breakdowns like reasoning/completion/prompt tokens or cached/uncached. */
export function MultiStackedBarChart({
  data,
  series,
  valueFormatter = (v) => v.toLocaleString(),
  compact = false,
}: {
  data: Record<string, string | number>[];
  series: MultiStackedSeries[];
  valueFormatter?: (value: number) => string;
  compact?: boolean;
}) {
  const heightClass = compact ? "h-32" : "h-48";

  if (data.length === 0) {
    return (
      <div className={`flex ${heightClass} items-center justify-center text-sm text-foreground-subtle`}>
        No data yet.
      </div>
    );
  }

  return (
    <div>
      <div className={heightClass}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="label" tick={CHART_AXIS_STYLE} tickLine={false} axisLine={false} />
            <YAxis
              tick={CHART_AXIS_STYLE}
              tickLine={false}
              axisLine={false}
              width={48}
              tickFormatter={(v) => valueFormatter(v)}
            />
            <Tooltip {...chartTooltipProps} formatter={(value) => safeFormat(value, valueFormatter)} />
            {series.map((s, index) => (
              <Bar
                key={s.key}
                dataKey={s.key}
                name={s.label}
                stackId="stack"
                fill={s.color}
                radius={index === series.length - 1 ? [3, 3, 0, 0] : undefined}
                maxBarSize={28}
                isAnimationActive={false}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground-muted">
        {series.map((s) => (
          <span key={s.key} className="flex items-center gap-1.5">
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
