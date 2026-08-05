"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipProps, CHART_GRID_STROKE, CHART_AXIS_STYLE } from "@/lib/utils/chart-theme";

export interface StackedBarPoint {
  label: string;
  success: number;
  error: number;
}

/** Success/error split per bar, stacked. */
export function StackedBarChart({
  data,
  compact = false,
}: {
  data: StackedBarPoint[];
  compact?: boolean;
}) {
  const heightClass = compact ? "h-32" : "h-48";

  if (data.length === 0) {
    return (
      <div
        className={`flex ${heightClass} items-center justify-center text-sm text-foreground-subtle`}
      >
        No data yet.
      </div>
    );
  }

  return (
    <div className={heightClass}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={CHART_AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis tick={CHART_AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
          <Tooltip {...chartTooltipProps} />
          <Bar
            dataKey="success"
            name="Success"
            stackId="requests"
            fill="var(--color-good)"
            maxBarSize={24}
            isAnimationActive={false}
          />
          <Bar
            dataKey="error"
            name="Error"
            stackId="requests"
            fill="var(--color-danger)"
            radius={[3, 3, 0, 0]}
            maxBarSize={24}
            isAnimationActive={false}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
