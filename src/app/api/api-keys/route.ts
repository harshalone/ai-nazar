import { NextResponse } from "next/server";
import { getStore } from "@/lib/store/get-store";

export async function GET() {
  const store = await getStore();
  if (!store) return NextResponse.json({ error: "Not configured" }, { status: 503 });
  return NextResponse.json({ keys: await store.listApiKeys() });
}

export async function POST(request: Request) {
  const store = await getStore();
  if (!store) return NextResponse.json({ error: "Not configured" }, { status: 503 });

  const body = await request.json().catch(() => ({}));
  const label = typeof body.label === "string" && body.label.trim() ? body.label.trim() : "New key";

  const key = await store.createApiKey(label);
  return NextResponse.json(key, { status: 201 });
}
