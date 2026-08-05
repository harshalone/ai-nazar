/** Shared Recharts theming so every chart reads as one black/green system. */

export const CHART_GRID_STROKE = "var(--color-border-subtle)";

export const CHART_AXIS_STYLE = {
  fill: "var(--color-foreground-subtle)",
  fontSize: 11,
};

export const chartTooltipProps = {
  cursor: { fill: "var(--color-surface-raised)" },
  contentStyle: {
    background: "var(--color-surface)",
    border: "1px solid var(--color-border)",
    borderRadius: 8,
    fontSize: 12,
    color: "var(--color-foreground)",
    boxShadow: "none",
  },
  labelStyle: {
    color: "var(--color-foreground-subtle)",
    marginBottom: 4,
  },
  itemStyle: {
    color: "var(--color-foreground)",
  },
} as const;

export const chartLegendStyle = {
  fontSize: 12,
  color: "var(--color-foreground-muted)",
} as const;

/** Narrows Recharts' possibly-undefined tooltip value before formatting. */
export function safeFormat(
  value: unknown,
  formatter: (value: number) => string,
): string {
  return typeof value === "number" ? formatter(value) : "";
}
