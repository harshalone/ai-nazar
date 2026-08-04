import { redirect } from "next/navigation";
import { Database, HardDrive, Layers } from "lucide-react";
import { readNazarConfig } from "@/lib/config/env";
import { getStore } from "@/lib/store/get-store";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STORE_META = {
  sqlite: { label: "SQLite", icon: HardDrive },
  postgres: { label: "Postgres", icon: Database },
  postbase: { label: "Postbase", icon: Layers },
};

export default async function SettingsPage() {
  const config = readNazarConfig();
  if (!config) redirect("/setup");

  const store = await getStore();
  const health = store ? await store.healthCheck() : { ok: false };
  const meta = STORE_META[config.store];
  const Icon = meta.icon;

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="mt-1 text-sm text-foreground-muted">
            AI Nazar has no login in this version — configuration lives in{" "}
            <code className="rounded bg-surface-raised px-1 py-0.5">.env.local</code>.
          </p>
        </div>

        <Card className="p-6">
          <h2 className="text-sm font-semibold text-foreground">Storage backend</h2>
          <div className="mt-4 flex items-center justify-between rounded-lg border border-border-subtle bg-surface-raised p-4">
            <div className="flex items-center gap-3">
              <Icon className="h-5 w-5 text-brand" />
              <div>
                <div className="text-sm font-medium text-foreground">{meta.label}</div>
                <div className="text-xs text-foreground-subtle">
                  {config.store === "sqlite" && config.sqlite?.path}
                  {config.store === "postgres" && "Postgres connection configured"}
                  {config.store === "postbase" && config.postbase?.url}
                </div>
              </div>
            </div>
            <Badge tone={health.ok ? "good" : "danger"}>
              {health.ok ? "Connected" : "Connection error"}
            </Badge>
          </div>
          <p className="mt-3 text-xs text-foreground-subtle">
            To switch backends, edit or remove the AI Nazar block in{" "}
            <code className="rounded bg-surface-raised px-1 py-0.5">.env.local</code> and restart
            the app to re-run setup.
          </p>
        </Card>
      </div>
    </DashboardShell>
  );
}
