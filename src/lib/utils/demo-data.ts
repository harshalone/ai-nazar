import type {
  DailyUsagePoint,
  LargePromptProblem,
  ModelUsageStat,
  UsageSummary,
} from "@/lib/store/types";

const DEMO_API_KEY = "nzr_demo_9f8a2b1c4d6e7f0a3b5c8d1e2f4a6b7c";

// Modeled on a large org: dozens of teams hitting every major provider.
const DEMO_MODELS = [
  { provider: "openai", model: "gpt-5.5", ratio: 0.32 },
  { provider: "openai", model: "gpt-5.5-mini", ratio: 0.14 },
  { provider: "anthropic", model: "claude-opus-4.5", ratio: 0.16 },
  { provider: "anthropic", model: "claude-sonnet-4.5", ratio: 0.18 },
  { provider: "anthropic", model: "claude-haiku-4.5", ratio: 0.08 },
  { provider: "google", model: "gemini-2.5-pro", ratio: 0.07 },
  { provider: "google", model: "gemini-2.5-flash", ratio: 0.05 },
] as const;

// One flagged model per provider family. Savings are sized as ~21% of
// that model's own spend (a large but defensible "oversized prompts"
// waste rate), so the total (~$291k) stays proportional to the ~$1.9M/mo
// total spend below rather than an implausible multiple of it.
const DEMO_PROBLEMS: LargePromptProblem[] = [
  {
    provider: "openai",
    model: "gpt-5.5",
    requests: 1840000,
    avgInputTokens: 15200,
    estimatedMonthlySavings: 127000,
  },
  {
    provider: "anthropic",
    model: "claude-sonnet-4.5",
    requests: 965000,
    avgInputTokens: 11800,
    estimatedMonthlySavings: 72000,
  },
  {
    provider: "anthropic",
    model: "claude-opus-4.5",
    requests: 612000,
    avgInputTokens: 13800,
    estimatedMonthlySavings: 64000,
  },
  {
    provider: "google",
    model: "gemini-2.5-pro",
    requests: 528000,
    avgInputTokens: 9600,
    estimatedMonthlySavings: 28000,
  },
];

function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildDemoDaily(days: number): DailyUsagePoint[] {
  const points: DailyUsagePoint[] = [];
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const day = date.toISOString().slice(0, 10);

    const seed = i + 1;
    const weekday = date.getDay();
    const weekendDip = weekday === 0 || weekday === 6 ? 0.6 : 1;
    // Large-org scale: ~1.3-1.6M requests/day, ~$1.9M/month total spend —
    // sized so the ~$291k Problems savings above land at a believable
    // ~15% of total spend, not an implausible multiple of it.
    const requests = Math.round((1300000 + seededRandom(seed) * 220000) * weekendDip);
    const errors = Math.round(requests * (0.01 + seededRandom(seed * 2) * 0.02));
    const totalTokens = requests * Math.round(2600 + seededRandom(seed * 3) * 1200);
    const cost = totalTokens * 0.000014;

    points.push({ day, requests, errors, cost, totalTokens });
  }

  return points;
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
    totalInputTokens: Math.round(totalTokens * 0.4),
    totalOutputTokens: Math.round(totalTokens * 0.6),
    avgLatency: 720,
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
      avgLatency: 420 + index * 140,
      errorRate: 0.005 + seededRandom(index + 10) * 0.025,
    };
  });
}

export interface DemoData {
  apiKey: string;
  summary: UsageSummary;
  daily: DailyUsagePoint[];
  modelUsage: ModelUsageStat[];
  problems: LargePromptProblem[];
}

export function buildDemoData(days: number): DemoData {
  const daily = buildDemoDaily(days);
  const summary = buildDemoSummary(daily);
  return {
    apiKey: DEMO_API_KEY,
    summary,
    daily,
    modelUsage: buildDemoModelUsage(summary),
    problems: DEMO_PROBLEMS,
  };
}
