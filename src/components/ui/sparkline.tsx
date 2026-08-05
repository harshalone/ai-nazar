"use client";

import { Line, LineChart, ResponsiveContainer } from "recharts";

export function Sparkline({
  values,
  color = "var(--color-brand)",
}: {
  values: number[];
  color?: string;
}) {
  if (values.length < 2) return null;

  const data = values.map((value, index) => ({ index, value }));

  return (
    <div className="h-6 w-16">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 2, right: 1, left: 1, bottom: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
