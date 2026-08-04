import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getStore } from "@/lib/store/get-store";
import type { IncomingEvent } from "@/lib/store/types";

/**
 * Ingestion endpoint the SDK's HttpTransport posts batches to
 * (see packages/sdk/src/transport.ts — POST {endpoint}/v1/events with
 * `Authorization: Bearer <apiKey>`). Never redirects (excluded from the
 * proxy matcher) so the SDK always gets a real HTTP status to react to.
 */
export async function POST(request: NextRequest) {
  const store = await getStore();
  if (!store) {
    return NextResponse.json(
      { error: "AI Nazar dashboard is not configured yet. Visit /setup." },
      { status: 503 },
    );
  }

  const authHeader = request.headers.get("authorization");
  const apiKey = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing Authorization: Bearer <apiKey> header" }, { status: 401 });
  }

  const keyRecord = await store.validateApiKey(apiKey);
  if (!keyRecord) {
    return NextResponse.json({ error: "Invalid or revoked API key" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const events = extractEvents(body);
  if (events === null) {
    return NextResponse.json(
      { error: "Request body must be `{ events: [...] }` or a single event object" },
      { status: 400 },
    );
  }

  const results = await Promise.allSettled(
    events.map((event) => store.insertEvent(event, keyRecord.id)),
  );

  const failed = results.filter((r) => r.status === "rejected").length;
  if (failed > 0 && failed === results.length) {
    return NextResponse.json({ error: "Failed to store any events" }, { status: 500 });
  }

  return NextResponse.json(
    { accepted: results.length - failed, rejected: failed },
    { status: 202 },
  );
}

function extractEvents(body: unknown): IncomingEvent[] | null {
  if (!body || typeof body !== "object") return null;

  const record = body as Record<string, unknown>;
  const candidate = Array.isArray(record.events) ? record.events : [body];

  const events: IncomingEvent[] = [];
  for (const item of candidate) {
    if (!isValidEvent(item)) continue;
    events.push(item);
  }
  return events;
}

function isValidEvent(value: unknown): value is IncomingEvent {
  if (!value || typeof value !== "object") return false;
  const e = value as Record<string, unknown>;
  return (
    typeof e.provider === "string" &&
    typeof e.model === "string" &&
    (e.status === "success" || e.status === "error") &&
    typeof e.timestamp === "number"
  );
}
