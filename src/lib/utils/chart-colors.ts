/** Ordered categorical palette for multi-series charts — mirrors globals.css's --color-chart-*. */
export const CHART_PALETTE = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
] as const;

export function chartColorAt(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}
