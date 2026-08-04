"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Database, HardDrive, Layers, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

type StoreChoice = "sqlite" | "postgres" | "postbase";

const STORE_OPTIONS: Array<{
  id: StoreChoice;
  label: string;
  description: string;
  icon: typeof Database;
}> = [
  {
    id: "sqlite",
    label: "SQLite",
    description: "Zero-config. Creates a local database file — perfect for trying AI Nazar out.",
    icon: HardDrive,
  },
  {
    id: "postgres",
    label: "Postgres",
    description: "Bring your own Postgres connection string for a production-grade store.",
    icon: Database,
  },
  {
    id: "postbase",
    label: "Postbase",
    description: "Connect to a self-hosted Postbase project (run the schema.sql first).",
    icon: Layers,
  },
];

export default function SetupPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<StoreChoice>("sqlite");
  const [sqlitePath, setSqlitePath] = useState("./data/nazar.db");
  const [postgresUrl, setPostgresUrl] = useState("");
  const [postbaseUrl, setPostbaseUrl] = useState("");
  const [postbaseServiceRoleKey, setPostbaseServiceRoleKey] = useState("");
  const [postbaseProjectId, setPostbaseProjectId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);

    const payload =
      selected === "sqlite"
        ? { store: "sqlite" as const, sqlitePath }
        : selected === "postgres"
          ? { store: "postgres" as const, postgresUrl }
          : {
              store: "postbase" as const,
              postbaseUrl,
              postbaseServiceRoleKey,
              postbaseProjectId,
            };

    const response = await fetch("/api/setup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json();

    if (!response.ok) {
      setError(body.error ?? "Setup failed. Check the details and try again.");
      return;
    }

    router.push("/");
    router.refresh();
  }

  const canSubmit =
    selected === "sqlite"
      ? sqlitePath.trim().length > 0
      : selected === "postgres"
        ? postgresUrl.trim().length > 0
        : postbaseUrl.trim().length > 0 &&
          postbaseServiceRoleKey.trim().length > 0 &&
          postbaseProjectId.trim().length > 0;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/assets/images/logo.png" alt="AI Nazar" width={56} height={56} />
          <h1 className="mt-4 text-2xl font-bold text-foreground">Welcome to AI Nazar</h1>
          <p className="mt-2 max-w-md text-sm text-foreground-muted">
            Choose where to store your AI request events. No account or login required — this
            takes about 30 seconds.
          </p>
        </div>

        <Card className="p-6">
          <div className="grid gap-3 sm:grid-cols-3">
            {STORE_OPTIONS.map((option) => {
              const Icon = option.icon;
              const isSelected = selected === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setSelected(option.id)}
                  className={cn(
                    "flex cursor-pointer flex-col items-start gap-2 rounded-lg border p-4 text-left transition-colors",
                    isSelected
                      ? "border-brand bg-brand-soft"
                      : "border-border bg-surface-raised hover:border-foreground-subtle",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <Icon
                      className={cn("h-5 w-5", isSelected ? "text-brand" : "text-foreground-muted")}
                    />
                    {isSelected && <Check className="h-4 w-4 text-brand" />}
                  </div>
                  <span className="text-sm font-semibold text-foreground">{option.label}</span>
                  <span className="text-xs text-foreground-subtle">{option.description}</span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 space-y-4">
            {selected === "sqlite" && (
              <Field label="Database file path">
                <Input
                  value={sqlitePath}
                  onChange={(e) => setSqlitePath(e.target.value)}
                  placeholder="./data/nazar.db"
                />
              </Field>
            )}

            {selected === "postgres" && (
              <Field label="Connection string">
                <Input
                  value={postgresUrl}
                  onChange={(e) => setPostgresUrl(e.target.value)}
                  placeholder="postgresql://user:password@host:5432/dbname"
                />
              </Field>
            )}

            {selected === "postbase" && (
              <>
                <Field label="Postbase URL">
                  <Input
                    value={postbaseUrl}
                    onChange={(e) => setPostbaseUrl(e.target.value)}
                    placeholder="https://your-postbase-instance.com"
                  />
                </Field>
                <Field label="Service role key">
                  <Input
                    value={postbaseServiceRoleKey}
                    onChange={(e) => setPostbaseServiceRoleKey(e.target.value)}
                    placeholder="pb_service_..."
                    type="password"
                  />
                </Field>
                <Field label="Project ID">
                  <Input
                    value={postbaseProjectId}
                    onChange={(e) => setPostbaseProjectId(e.target.value)}
                    placeholder="your-project-id"
                  />
                </Field>
                <p className="text-xs text-foreground-subtle">
                  Run <code className="rounded bg-surface-raised px-1 py-0.5">prisma/postbase/schema.sql</code>{" "}
                  in your Postbase project&apos;s SQL editor first.
                </p>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-danger/40 bg-danger-soft px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}

          <Button
            className="mt-6 w-full"
            size="lg"
            disabled={!canSubmit}
            onClickAsync={handleSubmit}
          >
            Continue
          </Button>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-foreground-muted">{label}</span>
      {children}
    </label>
  );
}
