import { redirect } from "next/navigation";
import { getStore } from "@/lib/store/get-store";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { CostContent } from "@/components/dashboard/cost-content";

export default async function CostPage() {
  const store = await getStore();
  if (!store) redirect("/setup");

  const modelUsage = await store.getModelUsage({});

  return (
    <DashboardShell>
      <CostContent modelUsage={modelUsage} />
    </DashboardShell>
  );
}
