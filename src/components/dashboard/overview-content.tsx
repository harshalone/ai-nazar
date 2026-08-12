"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, DollarSign, Sparkles, TrendingDown } from "lucide-react";
import type { DailyUsagePoint, LargePromptProblem, ModelUsageStat, UsageSummary } from "@/lib/store/types";
import { buildDemoData } from "@/lib/utils/demo-data";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { AreaChart } from "@/components/dashboard/area-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { HorizontalBarChart } from "@/components/dashboard/horizontal-bar-chart";
import { StackedBarChart } from "@/components/dashboard/stacked-bar-chart";
import { RadialGauge } from "@/components/dashboard/radial-gauge";
import { DateRangePicker } from "@/components/dashboard/date-range-picker";
import { StatCard } from "@/components/ui/stat-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface OverviewData {
  summary: UsageSummary;
  daily: DailyUsagePoint[];
  modelUsage: ModelUsageStat[];
  problems: LargePromptProblem[];
}

const DEFAULT_DAYS = 14;

export function OverviewContent({
  summary,
  daily,
  modelUsage,
  problems,
}: {
  summary: UsageSummary;
  daily: DailyUsagePoint[];
  modelUsage: ModelUsageStat[];
  problems: LargePromptProblem[];
}) {
  const [demoMode, setDemoMode] = useState(false);
  const [days, setDays] = useState(DEFAULT_DAYS);
  const [liveData, setLiveData] = useState<OverviewData>({ summary, daily, modelUsage, problems });
  const [loadedDays, setLoadedDays] = useState(DEFAULT_DAYS);
  const loading = !demoMode && loadedDays !== days;

  // Effect body performs no synchronous setState — it kicks off an async
  // fetch whose state updates all happen after an await, matching the
  // react-hooks/set-state-in-effect requirement (see events/page.tsx).
  useEffect(() => {
    if (demoMode || days === loadedDays) return;

    let cancelled = false;
    (async () => {
      const response = await fetch(`/api/overview?days=${days}`);
      const data = await response.json();
      if (cancelled) return;
      setLiveData(data);
      setLoadedDays(days);
    })();

    return () => {
      cancelled = true;
    };
  }, [days, demoMode, loadedDays]);

  const demoData = useMemo(() => buildDemoData(days), [days]);

  const activeSummary = demoMode ? demoData.summary : liveData.summary;
  const activeDaily = demoMode ? demoData.daily : liveData.daily;
  const activeModelUsage = demoMode ? demoData.modelUsage : liveData.modelUsage;
  const activeProblems = demoMode ? demoData.problems : liveData.problems;

  const potentialSavings = activeProblems.reduce(
    (sum, p) => sum + p.estimatedMonthlySavings,
    0,
  );
  const topModelsByCost = [...activeModelUsage].sort((a, b) => b.cost - a.cost).slice(0, 5);
  const byLatency = [...activeModelUsage]
    .filter((m) => m.avgLatency !== null)
    .sort((a, b) => (b.avgLatency ?? 0) - (a.avgLatency ?? 0))
    .slice(0, 5);
  const byErrorRate = [...activeModelUsage]
    .sort((a, b) => b.errorRate - a.errorRate)
    .slice(0, 5);
  const costTrend = activeDaily.map((d) => ({ label: d.day, value: d.cost }));
  const requestVolume = activeDaily.map((d) => ({
    label: d.day,
    success: d.requests - d.errors,
    error: d.errors,
  }));
  const overallErrorRatePct =
    activeSummary.totalRequests > 0
      ? (activeSummary.errorCount / activeSummary.totalRequests) * 100
      : 0;
  const savingsPctOfSpend =
    activeSummary.totalCost > 0 ? (potentialSavings / activeSummary.totalCost) * 100 : 0;

  const spendSparkline = activeDaily.map((d) => d.cost);
  const requestsSparkline = activeDaily.map((d) => d.requests);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Live AI request activity across all providers.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <DateRangePicker days={days} onChange={setDays} />
          <Button
            variant={demoMode ? "primary" : "secondary"}
            size="md"
            onClick={() => setDemoMode((v) => !v)}
            className="shrink-0"
          >
            <Sparkles className="h-4 w-4" />
            {demoMode ? "Viewing demo data" : "Demo data"}
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label={`Spend — last ${days}d`}
          value={`$${activeSummary.totalCost.toFixed(2)}`}
          icon={<DollarSign className="h-4 w-4" />}
          sparkline={spendSparkline}
        />
        <StatCard
          label="Total requests"
          value={activeSummary.totalRequests.toLocaleString()}
          icon={<Activity className="h-4 w-4" />}
          sparkline={requestsSparkline}
        />
        <StatCard
          label="Potential savings"
          value={`$${potentialSavings.toFixed(2)}`}
          icon={<TrendingDown className="h-4 w-4" />}
          tone={potentialSavings > 0 ? "good" : "neutral"}
          hint={potentialSavings > 0 ? `~${savingsPctOfSpend.toFixed(0)}% of spend, see Problems` : undefined}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">
            Requests — last {days} days
          </h2>
          <div className="mt-4">
            <UsageChart data={activeDaily} compact />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Spend by model</h2>
          <div className="mt-4">
            <DonutChart
              segments={activeModelUsage.map((m) => ({ label: m.model, value: m.cost }))}
              centerLabel="This period"
              centerValue={`$${activeSummary.totalCost.toFixed(2)}`}
              valueFormatter={(v) => `$${v.toFixed(2)}`}
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Top models by cost</h2>
          <div className="mt-4">
            <HorizontalBarChart
              data={topModelsByCost.map((m) => ({ label: m.model, value: m.cost }))}
              valueFormatter={(v) => `$${v.toFixed(2)}`}
            />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Requests by outcome</h2>
          <div className="mt-4">
            <StackedBarChart data={requestVolume} compact />
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6">
          <h2 className="self-start text-sm font-semibold text-foreground">Error rate</h2>
          <div className="mt-2">
            <RadialGauge
              pct={overallErrorRatePct}
              label="of all requests"
              valueLabel={`${overallErrorRatePct.toFixed(1)}%`}
              color={
                overallErrorRatePct >= 5
                  ? "var(--color-danger)"
                  : overallErrorRatePct >= 2
                    ? "var(--color-warning)"
                    : "var(--color-good)"
              }
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Cost trend</h2>
          <div className="mt-4">
            <AreaChart data={costTrend} valueFormatter={(v) => `$${v.toFixed(2)}`} compact />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Slowest models</h2>
          <div className="mt-4">
            <HorizontalBarChart
              data={byLatency.map((m) => ({ label: m.model, value: m.avgLatency ?? 0 }))}
              valueFormatter={(v) => `${Math.round(v)}ms`}
            />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Error rate by model</h2>
          <div className="mt-4">
            <HorizontalBarChart
              data={byErrorRate.map((m) => ({ label: m.model, value: m.errorRate * 100 }))}
              valueFormatter={(v) => `${v.toFixed(1)}%`}
            />
          </div>
        </Card>
      </div>

      {loading && (
        <p className="text-center text-xs text-foreground-subtle">Updating…</p>
      )}
    </div>
  );
}
