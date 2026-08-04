/**
 * Storage abstraction for AI Nazar's dashboard. Every supported backend
 * (SQLite, Postgres, Postbase) implements `EventsStore` — this is the one
 * pluggable seam in the dashboard. Everything else (routes, pages,
 * ingestion) talks to `EventsStore`, never to a specific driver.
 */

/** Mirrors the SDK's `AIRequestEvent` shape (packages/sdk/src/types.ts). */
export interface IncomingEvent {
  id?: string;
  provider: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  latency?: number;
  cost?: number;
  status: "success" | "error";
  error?: {
    message: string;
    stack?: string;
    code?: string;
    statusCode?: number;
  };
  environment?: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  prompt?: unknown;
  response?: unknown;
  timestamp: number;
  sdk?: {
    name: string;
    version: string;
  };
}

/** A stored event, as returned by query methods — adds derived/storage fields. */
export interface StoredEvent extends IncomingEvent {
  id: string;
  totalTokens: number | null;
  dayBucket: string;
  createdAt: string;
}

export interface EventFilters {
  provider?: string;
  model?: string;
  status?: "success" | "error";
  environment?: string;
  userId?: string;
  from?: number;
  to?: number;
  search?: string;
}

export interface Pagination {
  limit?: number;
  cursor?: string;
}

export interface EventsPage {
  events: StoredEvent[];
  nextCursor: string | null;
}

export interface UsageSummary {
  totalRequests: number;
  successCount: number;
  errorCount: number;
  totalCost: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  avgLatency: number | null;
}

export interface DailyUsagePoint {
  day: string;
  requests: number;
  errors: number;
  cost: number;
  totalTokens: number;
}

export interface ApiKeyRecord {
  id: string;
  key: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface EventsStore {
  /** Human-readable identifier for the active adapter, e.g. "sqlite". */
  readonly kind: "sqlite" | "postgres" | "postbase";

  /** Verifies the connection is reachable and the schema is migrated. */
  healthCheck(): Promise<{ ok: boolean; message?: string }>;

  insertEvent(event: IncomingEvent, apiKeyId: string | null): Promise<void>;

  queryEvents(filters: EventFilters, pagination?: Pagination): Promise<EventsPage>;

  getEvent(id: string): Promise<StoredEvent | null>;

  getUsageSummary(filters: EventFilters): Promise<UsageSummary>;

  getDailyUsage(filters: EventFilters, days: number): Promise<DailyUsagePoint[]>;

  /** Validates a Bearer API key from the SDK, returning its record if active. */
  validateApiKey(key: string): Promise<ApiKeyRecord | null>;

  /** Returns the first active API key, creating a default one if none exist. */
  getOrCreateDefaultApiKey(): Promise<ApiKeyRecord>;

  listApiKeys(): Promise<ApiKeyRecord[]>;

  createApiKey(label: string): Promise<ApiKeyRecord>;

  revokeApiKey(id: string): Promise<void>;
}
