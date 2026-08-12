"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColorAt } from "@/lib/utils/chart-colors";
import { chartTooltipProps, CHART_GRID_STROKE, CHART_AXIS_STYLE, safeFormat } from "@/lib/utils/chart-theme";
import type { DimensionDailyPoint } from "@/lib/store/types";

const MAX_SERIES = 5;

/**
 * "Spend over time" stacked by dimension value (model, API key, ...) — the
 * top N values by total cost get their own series; everything else rolls
 * into "Other" so the chart never explodes past a handful of stacks.
 */
export function DimensionStackedChart({
  points,
  valueFormatter = (v) => `$${v.toFixed(2)}`,
}: {
  points: DimensionDailyPoint[];
  valueFormatter?: (value: number) => string;
}) {
  if (points.length === 0) {
    return (
      <div className="flex h-64 items-center justify-center text-sm text-foreground-subtle">
        No data yet.
      </div>
    );
  }

  const totalsByKey = new Map<string, { label: string; total: number }>();
  for (const point of points) {
    const existing = totalsByKey.get(point.key);
    totalsByKey.set(point.key, {
      label: point.label,
      total: (existing?.total ?? 0) + point.cost,
    });
  }
  const ranked = [...totalsByKey.entries()].sort((a, b) => b[1].total - a[1].total);
  const topKeys = ranked.slice(0, MAX_SERIES).map(([key]) => key);
  const hasOther = ranked.length > MAX_SERIES;
  const labelByKey = new Map(ranked.map(([key, v]) => [key, v.label]));

  const byDay = new Map<string, Record<string, number>>();
  for (const point of points) {
    const row = byDay.get(point.day) ?? {};
    const seriesKey = topKeys.includes(point.key) ? point.key : "__other__";
    row[seriesKey] = (row[seriesKey] ?? 0) + point.cost;
    byDay.set(point.day, row);
  }
  const chartData = [...byDay.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, values]) => ({ day, ...values }));

  const series = [
    ...topKeys.map((key, index) => ({ key, label: labelByKey.get(key) ?? key, color: chartColorAt(index) })),
    ...(hasOther ? [{ key: "__other__", label: "Other", color: "var(--color-foreground-subtle)" }] : []),
  ];

  return (
    <div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
            <XAxis dataKey="day" tick={CHART_AXIS_STYLE} tickLine={false} axisLine={false} />
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
                stackId="dimension"
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
