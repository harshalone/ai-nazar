import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { getStore } from "@/lib/store/get-store";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { OverviewContent } from "@/components/dashboard/overview-content";
import { LARGE_PROMPT_THRESHOLD_TOKENS } from "@/app/problems/page";

const DEFAULT_DAYS = 14;

function daysAgo(days: number): number {
  return Date.now() - days * 24 * 60 * 60 * 1000;
}

export default async function OverviewPage() {
  const store = await getStore();
  if (!store) redirect("/setup");

  const filter = { from: daysAgo(DEFAULT_DAYS) };

  const [apiKey, summary, daily, modelUsage, problems] = await Promise.all([
    store.getOrCreateDefaultApiKey(),
    store.getUsageSummary(filter),
    store.getDailyUsage({}, DEFAULT_DAYS),
    store.getModelUsage(filter),
    store.getLargePromptProblems(filter, LARGE_PROMPT_THRESHOLD_TOKENS),
  ]);

  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const endpoint = `${protocol}://${host}`;

  return (
    <DashboardShell fullWidth>
      <OverviewContent
        apiKey={apiKey.key}
        endpoint={endpoint}
        summary={summary}
        daily={daily}
        modelUsage={modelUsage}
        problems={problems}
      />
    </DashboardShell>
  );
}
