"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { ApiKeyRecord } from "@/lib/store/types";

function maskKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 11)}${"•".repeat(16)}${key.slice(-4)}`;
}

function buildSnippet(apiKey: string, endpoint: string): string {
  return `import OpenAI from "openai";
import { Nazar } from "@lonare/ai-nazar-sdk";

const nazar = Nazar.init({
  apiKey: "${apiKey}",
  endpoint: "${endpoint}",
});

const openai = Nazar.wrapOpenAI(new OpenAI());`;
}

function NewKeySnippet({
  apiKey,
  endpoint,
  onDismiss,
}: {
  apiKey: string;
  endpoint: string;
  onDismiss: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const snippet = buildSnippet(apiKey, endpoint);

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setCopied(false);
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Your new API key</h2>
        <Button variant="ghost" size="sm" onClick={onDismiss}>
          Done
        </Button>
      </div>
      <p className="mt-1 text-xs text-foreground-subtle">
        This is the only time the full key is shown. Paste it into{" "}
        <code className="rounded bg-surface-raised px-1 py-0.5">Nazar.init()</code> to start
        tracking requests.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <code
          className={cn(
            "flex-1 truncate rounded-lg border border-border bg-surface-raised px-3 py-2.5 font-mono text-sm text-foreground",
          )}
        >
          {apiKey}
        </code>
        <Button
          variant="secondary"
          size="md"
          className="shrink-0 px-2.5"
          onClickAsync={handleCopy}
          aria-label="Copy API key"
        >
          {copied ? <Check className="h-4 w-4 text-good" /> : <Copy className="h-4 w-4" />}
        </Button>
      </div>

      <pre className="mt-4 overflow-x-auto rounded-lg border border-border-subtle bg-black p-4 text-xs leading-relaxed text-foreground-muted">
        <code>{snippet}</code>
      </pre>
    </Card>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<ApiKeyRecord | null>(null);
  const endpoint = typeof window !== "undefined" ? window.location.origin : "";

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
    const response = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ label: "New key" }),
    });
    const created: ApiKeyRecord = await response.json();
    setNewlyCreatedKey(created);
    await load();
  }

  async function revokeKey(id: string) {
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    setNewlyCreatedKey((current) => (current?.id === id ? null : current));
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

        {newlyCreatedKey && (
          <NewKeySnippet
            apiKey={newlyCreatedKey.key}
            endpoint={endpoint}
            onDismiss={() => setNewlyCreatedKey(null)}
          />
        )}

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
