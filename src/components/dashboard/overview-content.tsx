"use client";

import { useEffect, useMemo, useState } from "react";
import { Activity, DollarSign, TrendingDown } from "lucide-react";
import type {
  DailyUsagePoint,
  LargePromptProblem,
  ModelUsageStat,
  OverviewRankedStat,
  PromptCachingPoint,
  TokenBreakdownPoint,
  UsageSummary,
  UsageTypePoint,
} from "@/lib/store/types";
import { buildDemoData } from "@/lib/utils/demo-data";
import { UsageChart } from "@/components/dashboard/usage-chart";
import { AreaChart } from "@/components/dashboard/area-chart";
import { DonutChart } from "@/components/dashboard/donut-chart";
import { HorizontalBarChart } from "@/components/dashboard/horizontal-bar-chart";
import { StackedBarChart } from "@/components/dashboard/stacked-bar-chart";
import { RadialGauge } from "@/components/dashboard/radial-gauge";
import { RankedTokenList } from "@/components/dashboard/ranked-token-list";
import { MultiStackedBarChart } from "@/components/dashboard/multi-stacked-bar-chart";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";

interface OverviewData {
  summary: UsageSummary;
  daily: DailyUsagePoint[];
  modelUsage: ModelUsageStat[];
  problems: LargePromptProblem[];
}

const EMPTY_RANKED: OverviewRankedStat[] = [];
const EMPTY_USAGE_TYPE: UsageTypePoint[] = [];
const EMPTY_TOKEN_BREAKDOWN: TokenBreakdownPoint[] = [];
const EMPTY_PROMPT_CACHING: PromptCachingPoint[] = [];

export function OverviewContent({
  days,
  demoMode,
  summary,
  daily,
  modelUsage,
  problems,
}: {
  days: number;
  demoMode: boolean;
  summary: UsageSummary;
  daily: DailyUsagePoint[];
  modelUsage: ModelUsageStat[];
  problems: LargePromptProblem[];
}) {
  const [liveData, setLiveData] = useState<OverviewData>({ summary, daily, modelUsage, problems });
  const [loadedDays, setLoadedDays] = useState(days);
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

  // Apps, BYOK spend, reasoning tokens, and prompt caching aren't tracked
  // live yet — these only populate in demo mode and show an empty state
  // otherwise, rather than fabricating zeros for real accounts.
  const topApiKeys = demoMode ? demoData.topApiKeys : EMPTY_RANKED;
  const topApps = demoMode ? demoData.topApps : EMPTY_RANKED;
  const usageType = demoMode ? demoData.usageType : EMPTY_USAGE_TYPE;
  const tokenBreakdown = demoMode ? demoData.tokenBreakdown : EMPTY_TOKEN_BREAKDOWN;
  const promptCaching = demoMode ? demoData.promptCaching : EMPTY_PROMPT_CACHING;

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

  const usageTypeTrend = usageType.map((d) => ({ label: d.day, value: d.byok + d.openRouterSpend }));
  const tokenBreakdownTrend = tokenBreakdown.map((d) => ({
    label: d.day,
    reasoning: d.reasoning,
    completion: d.completion,
    prompt: d.prompt,
  }));
  const promptCachingTrend = promptCaching.map((d) => ({
    label: d.day,
    cached: d.cached,
    uncached: d.uncached,
  }));

  return (
    <div className="space-y-6">
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Top API Keys</h2>
          <div className="mt-4">
            <RankedTokenList items={topApiKeys} emptyLabel="Turn on Demo data to preview, or start sending events." />
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Top Apps</h2>
          <div className="mt-4">
            <RankedTokenList items={topApps} emptyLabel="App attribution isn't tracked yet — turn on Demo data to preview." />
          </div>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Usage type</h2>
          <div className="mt-4">
            <AreaChart data={usageTypeTrend} valueFormatter={(v) => `$${v.toFixed(3)}`} compact color="var(--color-chart-4)" />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-foreground-muted">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-chart-4)" }} />
              BYOK
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-chart-4)" }} />
              OpenRouter Spend
            </span>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Token breakdown</h2>
          <div className="mt-4">
            <MultiStackedBarChart
              data={tokenBreakdownTrend}
              series={[
                { key: "reasoning", label: "Reasoning", color: "var(--color-danger)" },
                { key: "completion", label: "Completion", color: "var(--color-chart-4)" },
                { key: "prompt", label: "Prompt", color: "var(--color-brand)" },
              ]}
              valueFormatter={(v: number) => v.toLocaleString()}
              compact
            />
          </div>
        </Card>
      </div>

      <div className="grid gap-4">
        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Prompt token caching</h2>
          <div className="mt-4">
            <MultiStackedBarChart
              data={promptCachingTrend}
              series={[
                { key: "uncached", label: "Uncached", color: "var(--color-foreground-subtle)" },
                { key: "cached", label: "Cached", color: "var(--color-warning)" },
              ]}
              valueFormatter={(v: number) => v.toLocaleString()}
              compact
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
