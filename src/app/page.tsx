import { redirect } from "next/navigation";
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

  const [summary, daily, modelUsage, problems] = await Promise.all([
    store.getUsageSummary(filter),
    store.getDailyUsage({}, DEFAULT_DAYS),
    store.getModelUsage(filter),
    store.getLargePromptProblems(filter, LARGE_PROMPT_THRESHOLD_TOKENS),
  ]);

  return (
    <DashboardShell fullWidth>
      <OverviewContent
        summary={summary}
        daily={daily}
        modelUsage={modelUsage}
        problems={problems}
      />
    </DashboardShell>
  );
}
