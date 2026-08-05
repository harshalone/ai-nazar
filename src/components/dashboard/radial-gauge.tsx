"use client";

import { RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";

export function RadialGauge({
  pct,
  label,
  valueLabel,
  color = "var(--color-brand)",
}: {
  /** 0-100 */
  pct: number;
  label: string;
  valueLabel: string;
  color?: string;
}) {
  const clamped = Math.max(0, Math.min(100, pct));
  const data = [{ name: "value", value: clamped, fill: color }];

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <div className="relative h-36 w-36">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={data}
            innerRadius="70%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
          >
            <RadialBar
              dataKey="value"
              cornerRadius={0}
              background={{ fill: "var(--color-surface-raised)" }}
              isAnimationActive={false}
            />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="text-base font-semibold text-foreground">{valueLabel}</span>
        </div>
      </div>
      <span className="text-xs text-foreground-subtle">{label}</span>
    </div>
  );
}
