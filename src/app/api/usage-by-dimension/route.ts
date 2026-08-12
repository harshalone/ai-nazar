import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStore } from "@/lib/store/get-store";
import type { UsageDimension } from "@/lib/store/types";

const DEFAULT_DAYS = 30;
const MAX_DAYS = 365;
const DIMENSIONS: UsageDimension[] = ["model", "apiKey"];

/** Backs the Trends and Explore tabs' by-model / by-API-key breakdowns. */
export async function GET(request: NextRequest) {
  const store = await getStore();
  if (!store) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const params = request.nextUrl.searchParams;
  const dimension = params.get("dimension") as UsageDimension | null;
  if (!dimension || !DIMENSIONS.includes(dimension)) {
    return NextResponse.json({ error: `dimension must be one of: ${DIMENSIONS.join(", ")}` }, { status: 400 });
  }

  const days = Math.min(Math.max(Number(params.get("days")) || DEFAULT_DAYS, 1), MAX_DAYS);
  const from = Date.now() - days * 24 * 60 * 60 * 1000;
  const filter = { from };

  const [daily, trends] = await Promise.all([
    store.getDimensionDailyUsage(dimension, filter),
    store.getDimensionTrends(dimension, filter),
  ]);

  return NextResponse.json({ daily, trends });
}
