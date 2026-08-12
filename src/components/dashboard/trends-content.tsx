"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { DimensionStackedChart } from "@/components/dashboard/dimension-stacked-chart";
import { TrendingList } from "@/components/dashboard/trending-list";
import type { DimensionDailyPoint, DimensionTrend, UsageDimension } from "@/lib/store/types";

interface DimensionData {
  daily: DimensionDailyPoint[];
  trends: DimensionTrend[];
}

const SECTIONS: { dimension: UsageDimension; title: string }[] = [
  { dimension: "model", title: "Models" },
  { dimension: "apiKey", title: "API Keys" },
];

function DimensionSection({ dimension, title, days }: { dimension: UsageDimension; title: string; days: number }) {
  const [data, setData] = useState<DimensionData | null>(null);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const key = `${dimension}:${days}`;
  const loading = loadedKey !== key;

  // Effect body performs no synchronous setState — it kicks off an async
  // fetch whose state updates all happen after an await, matching the
  // react-hooks/set-state-in-effect requirement (see overview-content.tsx).
  useEffect(() => {
    if (loadedKey === key) return;

    let cancelled = false;
    (async () => {
      const response = await fetch(`/api/usage-by-dimension?dimension=${dimension}&days=${days}`);
      const body = await response.json();
      if (cancelled) return;
      setData(body);
      setLoadedKey(key);
    })();

    return () => {
      cancelled = true;
    };
  }, [dimension, days, key, loadedKey]);

  return (
    <div>
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <div className="mt-3 grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-medium tracking-wide text-foreground-subtle uppercase">
              Spend over time
            </h3>
          </div>
          <div className="mt-4">
            {loading ? (
              <div className="flex h-64 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <DimensionStackedChart points={data?.daily ?? []} />
            )}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-xs font-medium tracking-wide text-foreground-subtle uppercase">
            Trending
          </h3>
          <div className="mt-4">
            {loading ? (
              <div className="flex h-40 items-center justify-center">
                <Spinner />
              </div>
            ) : (
              <TrendingList trends={data?.trends ?? []} />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}

export function TrendsContent({ days }: { days: number }) {
  return (
    <div className="space-y-8">
      {SECTIONS.map((section) => (
        <DimensionSection key={section.dimension} dimension={section.dimension} title={section.title} days={days} />
      ))}
    </div>
  );
}
