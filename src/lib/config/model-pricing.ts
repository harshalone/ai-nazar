/**
 * Static, illustrative pricing/quality reference used only to power the
 * Models screen's "try a cheaper alternative" suggestion. Figures are
 * ballpark estimates, not live or billing-accurate pricing.
 */

export type QualityTier = "premium" | "balanced" | "budget";

export interface ModelPricingEntry {
  provider: string;
  model: string;
  tier: QualityTier;
  /** USD per 1K input tokens. */
  inputPricePer1k: number;
  /** USD per 1K output tokens. */
  outputPricePer1k: number;
}

export const MODEL_PRICING: ModelPricingEntry[] = [
  { provider: "openai", model: "gpt-5.5", tier: "premium", inputPricePer1k: 0.01, outputPricePer1k: 0.03 },
  { provider: "openai", model: "gpt-5.5-mini", tier: "balanced", inputPricePer1k: 0.002, outputPricePer1k: 0.006 },
  { provider: "anthropic", model: "claude-opus-4.5", tier: "premium", inputPricePer1k: 0.009, outputPricePer1k: 0.028 },
  { provider: "anthropic", model: "claude-sonnet-4.5", tier: "balanced", inputPricePer1k: 0.003, outputPricePer1k: 0.012 },
  { provider: "anthropic", model: "claude-haiku-4.5", tier: "budget", inputPricePer1k: 0.0008, outputPricePer1k: 0.004 },
  { provider: "google", model: "gemini-2.5-pro", tier: "premium", inputPricePer1k: 0.0035, outputPricePer1k: 0.0105 },
  { provider: "google", model: "gemini-2.5-flash", tier: "budget", inputPricePer1k: 0.0003, outputPricePer1k: 0.0025 },
];

/** Case-insensitive substring match — real SDK model strings are often versioned/suffixed. */
export function findPricing(model: string): ModelPricingEntry | undefined {
  const needle = model.toLowerCase();
  return MODEL_PRICING.find((entry) => needle.includes(entry.model.toLowerCase()));
}

const BLENDED_WEIGHT_INPUT = 0.6;
const BLENDED_WEIGHT_OUTPUT = 0.4;

function blendedRate(entry: ModelPricingEntry): number {
  return (
    entry.inputPricePer1k * BLENDED_WEIGHT_INPUT + entry.outputPricePer1k * BLENDED_WEIGHT_OUTPUT
  );
}

/** Cheapest entry with an equal-or-better tier than `model`, if one is materially cheaper. */
export function suggestCheaperAlternative(
  model: string,
): { entry: ModelPricingEntry; savingsPct: number } | undefined {
  const current = findPricing(model);
  if (!current) return undefined;

  const tierRank: Record<QualityTier, number> = { budget: 0, balanced: 1, premium: 2 };
  const currentRate = blendedRate(current);

  const cheaper = MODEL_PRICING.filter(
    (entry) =>
      entry.model !== current.model &&
      tierRank[entry.tier] <= tierRank[current.tier] &&
      blendedRate(entry) < currentRate,
  ).sort((a, b) => blendedRate(a) - blendedRate(b))[0];

  if (!cheaper) return undefined;

  const savingsPct = ((currentRate - blendedRate(cheaper)) / currentRate) * 100;
  if (savingsPct < 5) return undefined;

  return { entry: cheaper, savingsPct };
}
