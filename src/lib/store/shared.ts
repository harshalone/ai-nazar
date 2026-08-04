import { randomBytes } from "node:crypto";

/** UTC day bucket (YYYY-MM-DD) for a given epoch-ms timestamp, used for fast daily rollups. */
export function dayBucketFor(timestampMs: number): string {
  return new Date(timestampMs).toISOString().slice(0, 10);
}

/** Generates a new API key in the SDK's expected `nz_live_...` shape. */
export function generateApiKey(): string {
  return `nz_live_${randomBytes(24).toString("hex")}`;
}

export function safeJsonStringify(value: unknown): string | null {
  if (value === undefined) return null;
  try {
    return JSON.stringify(value);
  } catch {
    return null;
  }
}

export function safeJsonParse<T = unknown>(value: string | null): T | undefined {
  if (value === null || value === undefined) return undefined;
  try {
    return JSON.parse(value) as T;
  } catch {
    return undefined;
  }
}

export function computeTotalTokens(
  inputTokens?: number,
  outputTokens?: number,
): number | null {
  if (inputTokens === undefined && outputTokens === undefined) return null;
  return (inputTokens ?? 0) + (outputTokens ?? 0);
}

/** Builds a cursor from a stored event's (timestamp, id) for stable keyset pagination. */
export function encodeCursor(timestampMs: number, id: string): string {
  return Buffer.from(`${timestampMs}:${id}`).toString("base64url");
}

export function decodeCursor(cursor: string): { timestamp: number; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [timestamp, id] = decoded.split(":");
    if (!timestamp || !id) return null;
    const ts = Number(timestamp);
    if (Number.isNaN(ts)) return null;
    return { timestamp: ts, id };
  } catch {
    return null;
  }
}

export const DEFAULT_PAGE_SIZE = 50;
export const MAX_PAGE_SIZE = 200;

export function clampPageSize(limit?: number): number {
  if (!limit || limit <= 0) return DEFAULT_PAGE_SIZE;
  return Math.min(limit, MAX_PAGE_SIZE);
}
