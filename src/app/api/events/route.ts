import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStore } from "@/lib/store/get-store";
import type { EventFilters } from "@/lib/store/types";

/** Backs the dashboard's Events page (client-side fetch, not the SDK ingestion route). */
export async function GET(request: NextRequest) {
  const store = await getStore();
  if (!store) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const params = request.nextUrl.searchParams;
  const filters: EventFilters = {
    provider: params.get("provider") ?? undefined,
    model: params.get("model") ?? undefined,
    status: (params.get("status") as EventFilters["status"]) ?? undefined,
    environment: params.get("environment") ?? undefined,
    search: params.get("search") ?? undefined,
  };

  const page = await store.queryEvents(filters, {
    limit: Number(params.get("limit")) || undefined,
    cursor: params.get("cursor") ?? undefined,
  });

  return NextResponse.json(page);
}
