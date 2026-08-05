"use client";

import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartColorAt } from "@/lib/utils/chart-colors";
import { chartTooltipProps, CHART_AXIS_STYLE, safeFormat } from "@/lib/utils/chart-theme";

export interface HBarDatum {
  label: string;
  value: number;
  color?: string;
}

export function HorizontalBarChart({
  data,
  valueFormatter = (v) => v.toLocaleString(),
}: {
  data: HBarDatum[];
  valueFormatter?: (value: number) => string;
}) {
  if (data.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-foreground-subtle">
        No data yet.
      </div>
    );
  }

  const height = Math.max(data.length * 36, 100);

  return (
    <div style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 12, left: 0, bottom: 0 }}
        >
          <XAxis type="number" hide />
          <YAxis
            type="category"
            dataKey="label"
            tick={CHART_AXIS_STYLE}
            tickLine={false}
            axisLine={false}
            width={92}
          />
          <Tooltip {...chartTooltipProps} formatter={(value) => safeFormat(value, valueFormatter)} />
          <Bar dataKey="value" radius={[0, 3, 3, 0]} maxBarSize={16} isAnimationActive={false}>
            {data.map((datum, index) => (
              <Cell key={datum.label} fill={datum.color ?? chartColorAt(index)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
