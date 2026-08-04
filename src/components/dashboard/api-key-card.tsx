"use client";

import { useState } from "react";
import { Check, Copy, Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

function maskKey(key: string): string {
  if (key.length <= 12) return key;
  return `${key.slice(0, 11)}${"•".repeat(20)}${key.slice(-4)}`;
}

export function ApiKeyCard({ apiKey, endpoint }: { apiKey: string; endpoint: string }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(apiKey);
    setCopied(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setCopied(false);
  }

  const snippet = `import { Nazar } from "ai-nazar";

const nazar = Nazar.init({
  apiKey: "${apiKey}",
  endpoint: "${endpoint}",
});

const openai = Nazar.wrapOpenAI(new OpenAI());`;

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">Your API key</h2>
        <span className="rounded-full bg-good-soft px-2 py-0.5 text-xs font-medium text-good">
          Active
        </span>
      </div>
      <p className="mt-1 text-xs text-foreground-subtle">
        Paste this into <code className="rounded bg-surface-raised px-1 py-0.5">Nazar.init()</code>{" "}
        to start tracking requests.
      </p>

      <div className="mt-4 flex items-center gap-2">
        <code
          className={cn(
            "flex-1 truncate rounded-lg border border-border bg-surface-raised px-3 py-2.5 font-mono text-sm text-foreground",
          )}
        >
          {revealed ? apiKey : maskKey(apiKey)}
        </code>
        <Button
          variant="ghost"
          size="md"
          className="shrink-0 px-2.5"
          onClick={() => setRevealed((v) => !v)}
          aria-label={revealed ? "Hide API key" : "Reveal API key"}
        >
          {revealed ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </Button>
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
