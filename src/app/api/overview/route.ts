import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStore } from "@/lib/store/get-store";
import { LARGE_PROMPT_THRESHOLD_TOKENS } from "@/app/problems/page";

const DEFAULT_DAYS = 14;
const MAX_DAYS = 365;

/** Backs the Overview page's date-range picker (client-side fetch, real-time re-query). */
export async function GET(request: NextRequest) {
  const store = await getStore();
  if (!store) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const params = request.nextUrl.searchParams;
  const days = Math.min(Math.max(Number(params.get("days")) || DEFAULT_DAYS, 1), MAX_DAYS);
  const from = Date.now() - days * 24 * 60 * 60 * 1000;
  const filter = { from };

  const [summary, daily, modelUsage, problems] = await Promise.all([
    store.getUsageSummary(filter),
    store.getDailyUsage({}, days),
    store.getModelUsage(filter),
    store.getLargePromptProblems(filter, LARGE_PROMPT_THRESHOLD_TOKENS),
  ]);

  return NextResponse.json({ summary, daily, modelUsage, problems });
}
