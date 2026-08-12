import type {
  DailyUsagePoint,
  DimensionDailyPoint,
  DimensionTrend,
  LargePromptProblem,
  ModelUsageStat,
  OverviewRankedStat,
  PromptCachingPoint,
  TokenBreakdownPoint,
  UsageDimension,
  UsageSummary,
  UsageTypePoint,
} from "@/lib/store/types";

const DEMO_API_KEY = "nzr_demo_9f8a2b1c4d6e7f0a3b5c8d1e2f4a6b7c";

// Small hobby-project scale, modeled on a single builder wiring a handful
// of side projects through OpenRouter-style model routing.
const DEMO_MODELS = [
  { provider: "openai", model: "gpt-oss-120b", ratio: 0.838 },
  { provider: "openai", model: "gpt-oss-20b", ratio: 0.127 },
  { provider: "mistralai", model: "Mistral Nemo", ratio: 0.026 },
  { provider: "inclusionai", model: "Ling-2.6-flash", ratio: 0.009 },
  { provider: "meta", model: "Llama 3.1 8B Instruct", ratio: 0.0006 },
] as const;

const DEMO_API_KEYS = [
  { key: "n8n-oracle-new", label: "n8n-oracle-new", mask: "sk-or-v1-29e...383", ratio: 0.71 },
  { key: "rotaapp.uk", label: "rotaapp.uk", mask: "sk-or-v1-d09...852", ratio: 0.225 },
  { key: "lonare.com-1", label: "lonare.com", mask: "sk-or-v1-9db...ae6", ratio: 0.063 },
  { key: "lonare.com-2", label: "lonare.com", mask: "sk-or-v1-93a...c60", ratio: 0.004 },
  { key: "notes-app", label: "notes app api key", mask: "sk-or-v1-2fl...fdc", ratio: 0.001 },
] as const;

const DEMO_APPS = [
  { key: "unknown", label: "Unknown", ratio: 0.94 },
  { key: "lonare-chatbot", label: "Lonare Chatbot", ratio: 0.06 },
] as const;

const DEMO_PROBLEMS: LargePromptProblem[] = [
  {
    provider: "openai",
    model: "gpt-oss-120b",
    requests: 214,
    avgInputTokens: 3400,
    estimatedMonthlySavings: 0.02,
  },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function demoDayLabels(days: number): { day: string; date: Date; seed: number }[] {
  const points: { day: string; date: Date; seed: number }[] = [];
  const today = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    points.push({ day: date.toISOString().slice(0, 10), date, seed: i + 1 });
  }
  return points;
}

function buildDemoDaily(days: number): DailyUsagePoint[] {
  return demoDayLabels(days).map(({ day, date, seed }) => {
    const weekday = date.getDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.5 : 1;
    // Small hobby-scale: a handful of requests a day, occasional spikes —
    // sized so a month totals ~327 requests / ~$0.18, matching a single
    // builder's side-project usage rather than a large org's.
    const requests = Math.round((6 + seededRandom(seed) * 20) * weekendDip);
    const errors = Math.round(requests * (0.0 + seededRandom(seed * 2) * 0.02));
    const totalTokens = requests * Math.round(2800 + seededRandom(seed * 3) * 2200);
    const cost = totalTokens * 0.00000014;

    return { day, requests, errors, cost, totalTokens };
  });
}

function buildDemoSummary(daily: DailyUsagePoint[]): UsageSummary {
  const totalRequests = daily.reduce((sum, d) => sum + d.requests, 0);
  const errorCount = daily.reduce((sum, d) => sum + d.errors, 0);
  const totalCost = daily.reduce((sum, d) => sum + d.cost, 0);
  const totalTokens = daily.reduce((sum, d) => sum + d.totalTokens, 0);

  return {
    totalRequests,
    successCount: totalRequests - errorCount,
    errorCount,
    totalCost,
    totalInputTokens: Math.round(totalTokens * 0.55),
    totalOutputTokens: Math.round(totalTokens * 0.45),
    avgLatency: 640,
  };
}

function buildDemoModelUsage(summary: UsageSummary): ModelUsageStat[] {
  return DEMO_MODELS.map(({ provider, model, ratio }, index) => {
    const requests = Math.round(summary.totalRequests * ratio);
    const totalTokens = Math.round(
      (summary.totalInputTokens + summary.totalOutputTokens) * ratio,
    );
    return {
      provider,
      model,
      requests,
      cost: summary.totalCost * ratio,
      totalTokens,
      avgLatency: 380 + index * 90,
      errorRate: seededRandom(index + 10) * 0.02,
    };
  });
}

function buildDemoRanked(
  entries: readonly { key: string; label: string; ratio: number }[],
  totalTokens: number,
): OverviewRankedStat[] {
  return entries
    .map(({ key, label, ratio }) => ({ key, label, totalTokens: Math.round(totalTokens * ratio) }))
    .sort((a, b) => b.totalTokens - a.totalTokens);
}

function buildDemoUsageType(days: number): UsageTypePoint[] {
  return demoDayLabels(days).map(({ day, seed }) => {
    const openRouterSpend = 0.002 + seededRandom(seed * 5) * 0.02;
    const byok = seededRandom(seed * 7) > 0.85 ? seededRandom(seed * 11) * 0.01 : 0;
    return { day, byok, openRouterSpend };
  });
}

function buildDemoTokenBreakdown(daily: DailyUsagePoint[]): TokenBreakdownPoint[] {
  return daily.map((d, index) => ({
    day: d.day,
    reasoning: Math.round(d.totalTokens * (0.35 + seededRandom(index + 20) * 0.15)),
    completion: Math.round(d.totalTokens * (0.1 + seededRandom(index + 30) * 0.05)),
    prompt: Math.round(d.totalTokens * 0.4),
  }));
}

function buildDemoPromptCaching(daily: DailyUsagePoint[]): PromptCachingPoint[] {
  return daily.map((d, index) => {
    const promptTokens = Math.round(d.totalTokens * 0.4);
    const cached = seededRandom(index + 40) > 0.6 ? Math.round(promptTokens * seededRandom(index + 41) * 0.4) : 0;
    return { day: d.day, cached, uncached: Math.max(promptTokens - cached, 0) };
  });
}

function dimensionKeyLabel(
  dimension: UsageDimension,
  entry: (typeof DEMO_MODELS)[number] | (typeof DEMO_API_KEYS)[number],
): { key: string; label: string } {
  if (dimension === "model") {
    const modelEntry = entry as (typeof DEMO_MODELS)[number];
    return { key: modelEntry.model, label: modelEntry.model };
  }
  const apiKeyEntry = entry as (typeof DEMO_API_KEYS)[number];
  return { key: apiKeyEntry.key, label: apiKeyEntry.label };
}

function buildDemoDimensionDaily(
  dimension: UsageDimension,
  daily: DailyUsagePoint[],
): DimensionDailyPoint[] {
  const entries = dimension === "model" ? DEMO_MODELS : DEMO_API_KEYS;
  const points: DimensionDailyPoint[] = [];

  daily.forEach((d, index) => {
    for (const entry of entries) {
      const { key, label } = dimensionKeyLabel(dimension, entry);
      const jitter = 0.6 + seededRandom(index * 13 + key.length) * 0.8;
      const cost = d.cost * entry.ratio * jitter;
      if (cost <= 0) continue;
      points.push({
        day: d.day,
        key,
        label,
        cost,
        requests: Math.round(d.requests * entry.ratio * jitter),
        totalTokens: Math.round(d.totalTokens * entry.ratio * jitter),
      });
    }
  });

  return points;
}

function buildDemoDimensionTrends(dimension: UsageDimension, daily: DimensionDailyPoint[]): DimensionTrend[] {
  const totalsByKey = new Map<string, { label: string; cost: number; requests: number; totalTokens: number; sparkline: number[] }>();
  for (const point of daily) {
    const existing = totalsByKey.get(point.key);
    const sparkline = existing?.sparkline ?? [];
    sparkline.push(point.cost);
    totalsByKey.set(point.key, {
      label: point.label,
      cost: (existing?.cost ?? 0) + point.cost,
      requests: (existing?.requests ?? 0) + point.requests,
      totalTokens: (existing?.totalTokens ?? 0) + point.totalTokens,
      sparkline,
    });
  }

  const entries = dimension === "model" ? DEMO_MODELS : DEMO_API_KEYS;
  return [...totalsByKey.entries()]
    .map(([key, value], index) => {
      const seed = index + (dimension === "model" ? 50 : 70);
      const changePct = seededRandom(seed) > 0.15 ? (seededRandom(seed * 2) - 0.3) * 400 : null;
      return {
        key,
        label: value.label,
        cost: value.cost,
        requests: value.requests,
        totalTokens: value.totalTokens,
        changePct,
        sparkline: value.sparkline,
      };
    })
    .filter((row) => entries.some((e) => dimensionKeyLabel(dimension, e).key === row.key))
    .sort((a, b) => b.cost - a.cost);
}

export interface DemoData {
  apiKey: string;
  summary: UsageSummary;
  daily: DailyUsagePoint[];
  modelUsage: ModelUsageStat[];
  problems: LargePromptProblem[];
  topApiKeys: OverviewRankedStat[];
  topApps: OverviewRankedStat[];
  usageType: UsageTypePoint[];
  tokenBreakdown: TokenBreakdownPoint[];
  promptCaching: PromptCachingPoint[];
}

export function buildDemoData(days: number): DemoData {
  const daily = buildDemoDaily(days);
  const summary = buildDemoSummary(daily);
  const totalTokens = summary.totalInputTokens + summary.totalOutputTokens;

  return {
    apiKey: DEMO_API_KEY,
    summary,
    daily,
    modelUsage: buildDemoModelUsage(summary),
    problems: DEMO_PROBLEMS,
    topApiKeys: buildDemoRanked(DEMO_API_KEYS, totalTokens),
    topApps: buildDemoRanked(DEMO_APPS, totalTokens),
    usageType: buildDemoUsageType(days),
    tokenBreakdown: buildDemoTokenBreakdown(daily),
    promptCaching: buildDemoPromptCaching(daily),
  };
}

export interface DemoDimensionData {
  daily: DimensionDailyPoint[];
  trends: DimensionTrend[];
}

export function buildDemoDimensionData(dimension: UsageDimension, days: number): DemoDimensionData {
  const daily = buildDemoDimensionDaily(dimension, buildDemoDaily(days));
  return { daily, trends: buildDemoDimensionTrends(dimension, daily) };
}
