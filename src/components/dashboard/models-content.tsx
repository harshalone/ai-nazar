"use client";

import { AlertCircle, TrendingDown } from "lucide-react";
import type { ModelUsageStat } from "@/lib/store/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { findPricing, suggestCheaperAlternative, type QualityTier } from "@/lib/config/model-pricing";

const TIER_LABEL: Record<QualityTier, string> = {
  premium: "Premium",
  balanced: "Balanced",
  budget: "Budget",
};

const TIER_TONE: Record<QualityTier, "good" | "warning" | "neutral"> = {
  premium: "warning",
  balanced: "neutral",
  budget: "good",
};

export function ModelsContent({ modelUsage }: { modelUsage: ModelUsageStat[] }) {
  const sorted = [...modelUsage].sort((a, b) => b.requests - a.requests);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Models</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Usage, cost, and reliability per model.
        </p>
      </div>

      {sorted.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-2 text-center text-foreground-subtle">
          <AlertCircle className="h-5 w-5" />
          <p className="text-sm">No events yet. Send a request through the SDK.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {sorted.map((m) => {
            const pricing = findPricing(m.model);
            const suggestion = suggestCheaperAlternative(m.model);
            const projectedSavings = suggestion
              ? (m.cost * suggestion.savingsPct) / 100
              : null;

            return (
              <Card key={`${m.provider}::${m.model}`} className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-foreground">{m.model}</h3>
                      {pricing ? (
                        <Badge tone={TIER_TONE[pricing.tier]}>{TIER_LABEL[pricing.tier]}</Badge>
                      ) : (
                        <Badge tone="neutral">Unrated</Badge>
                      )}
                    </div>
                    <p className="text-xs text-foreground-subtle">{m.provider}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-right text-xs sm:grid-cols-4">
                    <div>
                      <div className="text-foreground-subtle">Requests</div>
                      <div className="font-medium text-foreground">
                        {m.requests.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground-subtle">Cost</div>
                      <div className="font-medium text-foreground">${m.cost.toFixed(2)}</div>
                    </div>
                    <div>
                      <div className="text-foreground-subtle">Avg latency</div>
                      <div className="font-medium text-foreground">
                        {m.avgLatency ? `${Math.round(m.avgLatency)}ms` : "—"}
                      </div>
                    </div>
                    <div>
                      <div className="text-foreground-subtle">Error rate</div>
                      <div className="font-medium text-foreground">
                        {(m.errorRate * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>

                {suggestion && (
                  <div className="mt-4 flex items-center gap-2 rounded-lg border border-brand/30 bg-brand/10 px-3 py-2 text-sm text-foreground">
                    <TrendingDown className="h-4 w-4 shrink-0 text-brand" />
                    Use {suggestion.entry.model} instead — Save {suggestion.savingsPct.toFixed(0)}%
                    {projectedSavings ? ` (~$${projectedSavings.toFixed(2)})` : ""}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
