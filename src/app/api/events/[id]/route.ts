import { NextResponse } from "next/server";
import { getStore } from "@/lib/store/get-store";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const store = await getStore();
  if (!store) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { id } = await params;
  const event = await store.getEvent(id);
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });

  return NextResponse.json(event);
}
