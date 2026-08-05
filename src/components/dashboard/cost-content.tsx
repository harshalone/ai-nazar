"use client";

import { AlertCircle } from "lucide-react";
import type { ModelUsageStat } from "@/lib/store/types";
import { Card } from "@/components/ui/card";
import { DonutChart } from "@/components/dashboard/donut-chart";

export function CostContent({ modelUsage }: { modelUsage: ModelUsageStat[] }) {
  const sorted = [...modelUsage].sort((a, b) => b.cost - a.cost);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Cost breakdown</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Spend by model, most expensive first.
        </p>
      </div>

      {sorted.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-2 text-center text-foreground-subtle">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">No events yet. Send a request through the SDK.</p>
        </Card>
      ) : (
        <>
          <Card className="p-6">
            <h2 className="text-sm font-semibold text-foreground">Spend by model</h2>
            <div className="mt-4">
              <DonutChart
                segments={sorted.map((m) => ({ label: m.model, value: m.cost }))}
                centerLabel="Total spend"
                centerValue={`$${sorted.reduce((sum, m) => sum + m.cost, 0).toFixed(2)}`}
                valueFormatter={(v) => `$${v.toFixed(2)}`}
              />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-foreground-subtle uppercase">
                    <th className="px-4 py-3 font-medium">Model</th>
                    <th className="px-4 py-3 font-medium">Requests</th>
                    <th className="px-4 py-3 font-medium">Cost</th>
                    <th className="px-4 py-3 font-medium">Avg latency</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((m) => (
                    <tr
                      key={`${m.provider}::${m.model}`}
                      className="border-b border-border-subtle"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{m.model}</div>
                        <div className="text-xs text-foreground-subtle">{m.provider}</div>
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {m.requests.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        ${m.cost.toFixed(4)}
                      </td>
                      <td className="px-4 py-3 text-foreground-muted">
                        {m.avgLatency ? `${Math.round(m.avgLatency)}ms` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
