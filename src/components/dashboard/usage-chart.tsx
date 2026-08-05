"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyUsagePoint } from "@/lib/store/types";
import { chartTooltipProps, CHART_GRID_STROKE, CHART_AXIS_STYLE, safeFormat } from "@/lib/utils/chart-theme";

/**
 * Bar color reflects that day's error rate — green when healthy, amber
 * past a moderate error rate, red past a high one — so the chart doubles
 * as an at-a-glance health signal, not just a volume graph.
 */
export function UsageChart({
  data,
  compact = false,
}: {
  data: DailyUsagePoint[];
  compact?: boolean;
}) {
  const heightClass = compact ? "h-32" : "h-48";

  if (data.length === 0) {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center text-sm text-foreground-subtle`}
      >
        No events yet — send a request through the SDK to see data here.
      </div>
    );
  }

  return (
    <div className={heightClass}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis dataKey="day" tick={CHART_AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis tick={CHART_AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
          <Tooltip
            {...chartTooltipProps}
            formatter={(value, _name, item) => {
              const point = item.payload as DailyUsagePoint;
              const errors = point.errors > 0 ? ` (${point.errors} errors)` : "";
              return [safeFormat(value, (v) => `${v.toLocaleString()} requests${errors}`), ""];
            }}
          />
          <Bar dataKey="requests" radius={[3, 3, 0, 0]} maxBarSize={28} isAnimationActive={false}>
            {data.map((point) => {
              const errorRate = point.requests > 0 ? point.errors / point.requests : 0;
              const color =
                errorRate >= 0.2
                  ? "var(--color-danger)"
                  : errorRate >= 0.05
                    ? "var(--color-warning)"
                    : "var(--color-brand)";
              return <Cell key={point.day} fill={color} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
