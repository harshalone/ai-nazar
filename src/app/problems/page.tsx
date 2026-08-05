import { redirect } from "next/navigation";
import { getStore } from "@/lib/store/get-store";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ProblemsContent } from "@/components/dashboard/problems-content";

export const LARGE_PROMPT_THRESHOLD_TOKENS = 8000;

export default async function ProblemsPage() {
  const store = await getStore();
  if (!store) redirect("/setup");

  const problems = await store.getLargePromptProblems({}, LARGE_PROMPT_THRESHOLD_TOKENS);

  return (
    <DashboardShell>
      <ProblemsContent problems={problems} thresholdTokens={LARGE_PROMPT_THRESHOLD_TOKENS} />
    </DashboardShell>
  );
}
