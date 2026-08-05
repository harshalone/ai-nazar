"use client";

import { useId } from "react";
import { Area, AreaChart as RechartsAreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { chartTooltipProps, CHART_GRID_STROKE, CHART_AXIS_STYLE, safeFormat } from "@/lib/utils/chart-theme";

export interface AreaPoint {
  label: string;
  value: number;
}

export function AreaChart({
  data,
  valueFormatter = (v) => v.toLocaleString(),
  compact = false,
  color = "var(--color-brand)",
}: {
  data: AreaPoint[];
  valueFormatter?: (value: number) => string;
  compact?: boolean;
  color?: string;
}) {
  const gradientId = useId();
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
        <RechartsAreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={CHART_GRID_STROKE} vertical={false} />
          <XAxis dataKey="label" tick={CHART_AXIS_STYLE} tickLine={false} axisLine={false} />
          <YAxis tick={CHART_AXIS_STYLE} tickLine={false} axisLine={false} width={40} />
          <Tooltip {...chartTooltipProps} formatter={(value) => safeFormat(value, valueFormatter)} />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{ r: 4, fill: color, strokeWidth: 0 }}
            isAnimationActive={false}
          />
        </RechartsAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
