import { NextResponse } from "next/server";
import { getStore } from "@/lib/store/get-store";

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const store = await getStore();
  if (!store) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const { id } = await params;
  await store.revokeApiKey(id);
  return NextResponse.json({ ok: true });
}
