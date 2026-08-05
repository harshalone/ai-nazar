"use client";

import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { chartColorAt } from "@/lib/utils/chart-colors";
import { chartTooltipProps, safeFormat } from "@/lib/utils/chart-theme";

export interface DonutSegment {
  label: string;
  value: number;
  color?: string;
}

export function DonutChart({
  segments,
  centerLabel,
  centerValue,
  valueFormatter = (v) => v.toLocaleString(),
}: {
  segments: DonutSegment[];
  centerLabel?: string;
  centerValue?: string;
  valueFormatter?: (value: number) => string;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const total = segments.reduce((sum, s) => sum + s.value, 0);

  if (total <= 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-foreground-subtle">
        No data yet.
      </div>
    );
  }

  const data = segments.filter((s) => s.value > 0);
  const hovered = hoverIndex !== null ? segments[hoverIndex] : null;

  return (
    <div className="flex items-center gap-6">
      <div className="relative h-40 w-40 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="65%"
              outerRadius="100%"
              paddingAngle={data.length > 1 ? 2 : 0}
              stroke="none"
              onMouseEnter={(_, index) => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              isAnimationActive={false}
              activeShape={false}
              inactiveShape={false}
            >
              {data.map((segment, index) => (
                <Cell
                  key={segment.label}
                  fill={segment.color ?? chartColorAt(index)}
                  className="cursor-pointer"
                />
              ))}
            </Pie>
            <Tooltip {...chartTooltipProps} formatter={(value) => safeFormat(value, valueFormatter)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-semibold text-foreground">
            {hovered ? valueFormatter(hovered.value) : (centerValue ?? "")}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 text-xs">
        {segments.map((segment, index) => (
          <div
            key={segment.label}
            className="flex items-center justify-between gap-3"
            onMouseEnter={() => setHoverIndex(index)}
            onMouseLeave={() => setHoverIndex(null)}
          >
            <span className="flex items-center gap-2 text-foreground-muted">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: segment.color ?? chartColorAt(index) }}
              />
              {segment.label}
            </span>
            <span className="font-medium text-foreground">
              {valueFormatter(segment.value)}
            </span>
          </div>
        ))}
        {centerLabel && <div className="mt-1 text-foreground-subtle">{centerLabel}</div>}
      </div>
    </div>
  );
}
