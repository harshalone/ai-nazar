"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { LargePromptProblem } from "@/lib/store/types";
import { Card } from "@/components/ui/card";

function ProblemCard({
  problem,
  thresholdTokens,
}: {
  problem: LargePromptProblem;
  thresholdTokens: number;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Large prompts detected — {problem.model}
          </h3>
          <p className="mt-1 text-sm text-foreground-muted">
            Avg {Math.round(problem.avgInputTokens).toLocaleString()} input tokens across{" "}
            {problem.requests.toLocaleString()} requests (threshold:{" "}
            {thresholdTokens.toLocaleString()}). Estimated savings: ~$
            {problem.estimatedMonthlySavings.toFixed(2)}/month.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function ProblemsContent({
  problems,
  thresholdTokens,
}: {
  problems: LargePromptProblem[];
  thresholdTokens: number;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Problems</h1>
        <p className="mt-1 text-sm text-foreground-muted">
          Actionable issues in your AI usage, grouped by model.
        </p>
      </div>

      {problems.length === 0 ? (
        <Card className="flex h-48 flex-col items-center justify-center gap-2 text-center">
          <CheckCircle2 className="h-6 w-6 text-good" />
          <p className="text-sm font-medium text-foreground">No problems detected — nice.</p>
          <p className="text-xs text-foreground-subtle">
            We&apos;ll flag this screen the moment something needs your attention.
          </p>
        </Card>
      ) : (
        <div className="space-y-4">
          {problems.map((problem) => (
            <ProblemCard
              key={`${problem.provider}::${problem.model}`}
              problem={problem}
              thresholdTokens={thresholdTokens}
            />
          ))}
        </div>
      )}
    </div>
  );
}
