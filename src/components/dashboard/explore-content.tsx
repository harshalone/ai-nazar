"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { chartColorAt } from "@/lib/utils/chart-colors";
import { SegmentedBar } from "@/components/dashboard/segmented-bar";
import type { DimensionTrend, UsageDimension } from "@/lib/store/types";
import type { ExploreTopN } from "@/components/dashboard/explore-controls";

const DEFAULT_DAYS = 30;
const DIMENSION_LABELS: Record<UsageDimension, string> = {
  model: "Model",
  apiKey: "API Key",
};

function formatCost(value: number): string {
  return `$${value.toFixed(value < 1 ? 4 : 2)}`;
}

export function ExploreContent({ dimension, topN }: { dimension: UsageDimension; topN: ExploreTopN }) {
  const [trends, setTrends] = useState<DimensionTrend[]>([]);
  const [loadedDimension, setLoadedDimension] = useState<UsageDimension | null>(null);
  const loading = loadedDimension !== dimension;

  // Effect body performs no synchronous setState — it kicks off an async
  // fetch whose state updates all happen after an await, matching the
  // react-hooks/set-state-in-effect requirement (see overview-content.tsx).
  useEffect(() => {
    if (loadedDimension === dimension) return;

    let cancelled = false;
    (async () => {
      const response = await fetch(`/api/usage-by-dimension?dimension=${dimension}&days=${DEFAULT_DAYS}`);
      const body = await response.json();
      if (cancelled) return;
      setTrends(body.trends ?? []);
      setLoadedDimension(dimension);
    })();

    return () => {
      cancelled = true;
    };
  }, [dimension, loadedDimension]);

  const ranked = [...trends].sort((a, b) => b.cost - a.cost).slice(0, topN);
  const totalCost = ranked.reduce((sum, row) => sum + row.cost, 0);

  return (
    <div className="space-y-6">
      <Card className="p-6">
        {loading ? (
          <div className="flex h-24 items-center justify-center">
            <Spinner />
          </div>
        ) : ranked.length === 0 ? (
          <div className="flex h-24 items-center justify-center text-sm text-foreground-subtle">
            No data yet.
          </div>
        ) : (
          <SegmentedBar items={ranked.map((row) => ({ key: row.key, label: row.label, value: row.cost }))} />
        )}
      </Card>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="flex h-32 items-center justify-center">
            <Spinner />
          </div>
        ) : ranked.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-foreground-subtle">
            No data yet.
          </div>
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-foreground-subtle uppercase">
                <th className="px-4 py-3 font-medium">{DIMENSION_LABELS[dimension]}</th>
                <th className="px-4 py-3 font-medium">Requests</th>
                <th className="px-4 py-3 text-right font-medium">Value</th>
                <th className="px-4 py-3 text-right font-medium">% of total</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((row, index) => (
                <tr key={row.key} className="border-b border-border-subtle last:border-0">
                  <td className="px-4 py-3">
                    <span className="flex items-center gap-2 text-foreground">
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: chartColorAt(index) }}
                      />
                      {row.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground-muted">{row.requests.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right font-medium text-foreground">{formatCost(row.cost)}</td>
                  <td className="px-4 py-3 text-right text-foreground-muted">
                    <div className="inline-flex items-center gap-2">
                      <span className="h-1.5 w-16 overflow-hidden rounded-full bg-surface-raised">
                        <span
                          className="block h-full rounded-full bg-brand"
                          style={{ width: `${totalCost > 0 ? (row.cost / totalCost) * 100 : 0}%` }}
                        />
                      </span>
                      {totalCost > 0 ? `${((row.cost / totalCost) * 100).toFixed(1)}%` : "0.0%"}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  );
}
