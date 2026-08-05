import { redirect } from "next/navigation";
import { getStore } from "@/lib/store/get-store";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ModelsContent } from "@/components/dashboard/models-content";

export default async function ModelsPage() {
  const store = await getStore();
  if (!store) redirect("/setup");

  const modelUsage = await store.getModelUsage({});

  return (
    <DashboardShell>
      <ModelsContent modelUsage={modelUsage} />
    </DashboardShell>
  );
}
