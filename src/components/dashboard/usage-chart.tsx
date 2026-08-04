"use client";

import { useId, useState } from "react";
import type { DailyUsagePoint } from "@/lib/store/types";

/**
 * Minimal dependency-free bar chart. Bar color reflects that day's error
 * rate — green when healthy, amber past a moderate error rate, red past
 * a high one — so the chart doubles as an at-a-glance health signal, not
 * just a volume graph.
 */
export function UsageChart({ data }: { data: DailyUsagePoint[] }) {
  const gradientId = useId();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center text-sm text-foreground-subtle">
        No events yet — send a request through the SDK to see data here.
      </div>
    );
  }

  const maxRequests = Math.max(...data.map((d) => d.requests), 1);
  const width = 100;
  const height = 40;
  const barWidth = width / data.length;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-48 w-full overflow-visible"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-brand)" stopOpacity="0.9" />
            <stop offset="100%" stopColor="var(--color-brand)" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {data.map((point, index) => {
          const errorRate = point.requests > 0 ? point.errors / point.requests : 0;
          const barHeight = (point.requests / maxRequests) * (height - 2);
          const color =
            errorRate >= 0.2
              ? "var(--color-danger)"
              : errorRate >= 0.05
                ? "var(--color-warning)"
                : `url(#${gradientId})`;

          return (
            <rect
              key={point.day}
              x={index * barWidth + barWidth * 0.15}
              y={height - barHeight}
              width={barWidth * 0.7}
              height={barHeight}
              rx={0.6}
              fill={color}
              opacity={hoverIndex === null || hoverIndex === index ? 1 : 0.4}
              onMouseEnter={() => setHoverIndex(index)}
              onMouseLeave={() => setHoverIndex(null)}
              className="cursor-pointer transition-opacity"
            />
          );
        })}
      </svg>

      <div className="mt-3 flex items-center justify-between text-xs text-foreground-subtle">
        <span>{data[0]?.day}</span>
        {hoverIndex !== null && data[hoverIndex] && (
          <span className="font-medium text-foreground">
            {data[hoverIndex].day}: {data[hoverIndex].requests} requests
            {data[hoverIndex].errors > 0 ? `, ${data[hoverIndex].errors} errors` : ""}
          </span>
        )}
        <span>{data[data.length - 1]?.day}</span>
      </div>
    </div>
  );
}
