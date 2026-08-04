import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import { Card } from "./card";

type Tone = "neutral" | "good" | "warning" | "danger";

const TONE_CLASSES: Record<Tone, string> = {
  neutral: "text-foreground",
  good: "text-good",
  warning: "text-warning",
  danger: "text-danger",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "neutral",
  hint,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  hint?: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium tracking-wide text-foreground-subtle uppercase">
          {label}
        </span>
        {icon && <span className="text-foreground-subtle">{icon}</span>}
      </div>
      <div className={cn("mt-2 text-2xl font-semibold", TONE_CLASSES[tone])}>{value}</div>
      {hint && <div className="mt-1 text-xs text-foreground-subtle">{hint}</div>}
    </Card>
  );
}
