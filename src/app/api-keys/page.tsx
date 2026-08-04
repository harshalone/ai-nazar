"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ApiKeyRecord } from "@/lib/store/types";

function maskKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 11)}${"•".repeat(16)}${key.slice(-4)}`;
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const response = await fetch("/api/api-keys");
    const body = await response.json();
    setKeys(body.keys ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const response = await fetch("/api/api-keys");
      const body = await response.json();
      if (cancelled) return;
      setKeys(body.keys ?? []);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function createKey() {
    await fetch("/api/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "New key" }),
    });
    await load();
  }

  async function revokeKey(id: string) {
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    await load();
  }

  return (
    <DashboardShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">API Keys</h1>
            <p className="mt-1 text-sm text-foreground-muted">
              Keys the SDK uses to authenticate when sending events.
            </p>
          </div>
          <Button size="sm" onClickAsync={createKey}>
            <Plus className="h-3.5 w-3.5" />
            New key
          </Button>
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex h-32 items-center justify-center text-foreground-subtle">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border text-xs text-foreground-subtle uppercase">
                  <th className="px-4 py-3 font-medium">Label</th>
                  <th className="px-4 py-3 font-medium">Key</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Last used</th>
                  <th className="px-4 py-3 font-medium" />
                </tr>
              </thead>
              <tbody>
                {keys.map((key) => (
                  <tr key={key.id} className="border-b border-border-subtle">
                    <td className="px-4 py-3 font-medium text-foreground">{key.label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-foreground-muted">
                      {maskKey(key.key)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={key.revokedAt ? "danger" : "good"}>
                        {key.revokedAt ? "Revoked" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-foreground-subtle">
                      {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleString() : "Never"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!key.revokedAt && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-danger hover:bg-danger-soft"
                          onClickAsync={() => revokeKey(key.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </DashboardShell>
  );
}
