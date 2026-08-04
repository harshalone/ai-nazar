import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { Activity, AlertTriangle, DollarSign, Gauge } from "lucide-react";
import { getStore } from "@/lib/store/get-store";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ApiKeyCard } from "@/components/dashboard/api-key-card";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { UsageChart } from "@/components/dashboard/usage-chart";

export default async function OverviewPage() {
  const store = await getStore();
  if (!store) redirect("/setup");

  const [apiKey, summary, daily] = await Promise.all([
    store.getOrCreateDefaultApiKey(),
    store.getUsageSummary({}),
    store.getDailyUsage({}, 14),
  ]);

  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") || host.startsWith("127.0.0.1") ? "http" : "https";
  const endpoint = `${protocol}://${host}`;

  const errorRate = summary.totalRequests > 0 ? summary.errorCount / summary.totalRequests : 0;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Overview</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            Live AI request activity across all providers.
          </p>
        </div>

        <ApiKeyCard apiKey={apiKey.key} endpoint={endpoint} />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total requests"
            value={summary.totalRequests.toLocaleString()}
            icon={<Activity className="h-4 w-4" />}
          />
          <StatCard
            label="Error rate"
            value={`${(errorRate * 100).toFixed(1)}%`}
            icon={<AlertTriangle className="h-4 w-4" />}
            tone={errorRate >= 0.2 ? "danger" : errorRate >= 0.05 ? "warning" : "good"}
          />
          <StatCard
            label="Total cost"
            value={`$${summary.totalCost.toFixed(4)}`}
            icon={<DollarSign className="h-4 w-4" />}
          />
          <StatCard
            label="Avg latency"
            value={summary.avgLatency ? `${Math.round(summary.avgLatency)}ms` : "—"}
            icon={<Gauge className="h-4 w-4" />}
          />
        </div>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Requests — last 14 days</h2>
          <div className="mt-4">
            <UsageChart data={daily} />
          </div>
        </Card>
      </div>
    </DashboardShell>
  );
}
