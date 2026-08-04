import { createClient, type PostbaseClient, type QueryBuilder } from "postbasejs";
import {
  clampPageSize,
  computeTotalTokens,
  dayBucketFor,
  decodeCursor,
  encodeCursor,
  generateApiKey,
  safeJsonParse,
  safeJsonStringify,
} from "./shared";
import type {
  ApiKeyRecord,
  DailyUsagePoint,
  EventFilters,
  EventsPage,
  EventsStore,
  IncomingEvent,
  Pagination,
  StoredEvent,
  UsageSummary,
} from "./types";

interface EventRow {
  id: string;
  provider: string;
  model: string;
  inputTokens: number | null;
  outputTokens: number | null;
  totalTokens: number | null;
  latency: number | null;
  cost: number | null;
  status: "success" | "error";
  errorMessage: string | null;
  errorStack: string | null;
  errorCode: string | null;
  errorStatusCode: number | null;
  environment: string | null;
  userId: string | null;
  metadata: string | null;
  prompt: string | null;
  response: string | null;
  sdkName: string | null;
  sdkVersion: string | null;
  timestamp: string;
  dayBucket: string;
  createdAt: string;
}

interface ApiKeyRow {
  id: string;
  key: string;
  label: string;
  createdAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

function toStoredEvent(row: EventRow): StoredEvent {
  const error =
    row.errorMessage || row.errorStack || row.errorCode || row.errorStatusCode
      ? {
          message: row.errorMessage ?? "",
          stack: row.errorStack ?? undefined,
          code: row.errorCode ?? undefined,
          statusCode: row.errorStatusCode ?? undefined,
        }
      : undefined;

  return {
    id: row.id,
    provider: row.provider,
    model: row.model,
    inputTokens: row.inputTokens ?? undefined,
    outputTokens: row.outputTokens ?? undefined,
    latency: row.latency ?? undefined,
    cost: row.cost ?? undefined,
    status: row.status,
    error,
    environment: row.environment ?? undefined,
    userId: row.userId ?? undefined,
    metadata: safeJsonParse(row.metadata) as Record<string, unknown> | undefined,
    prompt: safeJsonParse(row.prompt),
    response: safeJsonParse(row.response),
    timestamp: new Date(row.timestamp).getTime(),
    sdk:
      row.sdkName || row.sdkVersion
        ? { name: row.sdkName ?? "", version: row.sdkVersion ?? "" }
        : undefined,
    totalTokens: row.totalTokens,
    dayBucket: row.dayBucket,
    createdAt: new Date(row.createdAt).toISOString(),
  };
}

function toApiKeyRecord(row: ApiKeyRow): ApiKeyRecord {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    createdAt: new Date(row.createdAt).toISOString(),
    lastUsedAt: row.lastUsedAt ? new Date(row.lastUsedAt).toISOString() : null,
    revokedAt: row.revokedAt ? new Date(row.revokedAt).toISOString() : null,
  };
}

export interface PostbaseAdapterConfig {
  url: string;
  serviceRoleKey: string;
  projectId: string;
}

export class PostbaseEventsStore implements EventsStore {
  readonly kind = "postbase" as const;
  private readonly client: PostbaseClient;

  constructor(config: PostbaseAdapterConfig) {
    this.client = createClient(config.url, config.serviceRoleKey, {
      projectId: config.projectId,
    });
  }

  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    const { error } = await this.client.from("settings").select("key").limit(1);
    if (error) return { ok: false, message: error };
    return { ok: true };
  }

  async insertEvent(event: IncomingEvent, apiKeyId: string | null): Promise<void> {
    const { error } = await this.client.from("events").insert({
      ...(event.id ? { id: event.id } : {}),
      apiKeyId,
      provider: event.provider,
      model: event.model,
      inputTokens: event.inputTokens ?? null,
      outputTokens: event.outputTokens ?? null,
      totalTokens: computeTotalTokens(event.inputTokens, event.outputTokens),
      latency: event.latency ?? null,
      cost: event.cost ?? null,
      status: event.status,
      errorMessage: event.error?.message ?? null,
      errorStack: event.error?.stack ?? null,
      errorCode: event.error?.code ?? null,
      errorStatusCode: event.error?.statusCode ?? null,
      environment: event.environment ?? null,
      userId: event.userId ?? null,
      metadata: safeJsonStringify(event.metadata),
      prompt: safeJsonStringify(event.prompt),
      response: safeJsonStringify(event.response),
      sdkName: event.sdk?.name ?? null,
      sdkVersion: event.sdk?.version ?? null,
      timestamp: new Date(event.timestamp).toISOString(),
      dayBucket: dayBucketFor(event.timestamp),
    });

    if (error) throw new Error(`Postbase insert failed: ${error}`);
  }

  async queryEvents(
    filters: EventFilters,
    pagination: Pagination = {},
  ): Promise<EventsPage> {
    const take = clampPageSize(pagination.limit);

    let query = this.client
      .from<EventRow>("events")
      .select("*")
      .order("timestamp", { ascending: false })
      .order("id", { ascending: false })
      .limit(take + 1);

    query = applyFilters(query, filters);

    if (pagination.cursor) {
      const decoded = decodeCursor(pagination.cursor);
      if (decoded) {
        const iso = new Date(decoded.timestamp).toISOString();
        query = query.or(
          `timestamp.lt.${iso},and(timestamp.eq.${iso},id.lt.${decoded.id})`,
        );
      }
    }

    const { data, error } = await query;
    if (error) throw new Error(`Postbase query failed: ${error}`);

    const rows = data ?? [];
    const hasMore = rows.length > take;
    const page = hasMore ? rows.slice(0, take) : rows;
    const events = page.map(toStoredEvent);
    const last = events[events.length - 1];

    return {
      events,
      nextCursor: hasMore && last ? encodeCursor(last.timestamp, last.id) : null,
    };
  }

  async getEvent(id: string): Promise<StoredEvent | null> {
    const { data, error } = await this.client
      .from<EventRow>("events")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw new Error(`Postbase getEvent failed: ${error}`);
    return data ? toStoredEvent(data) : null;
  }

  async getUsageSummary(filters: EventFilters): Promise<UsageSummary> {
    const where = buildSqlWhere(filters);
    const { data, error } = await this.client.sql<{
      total_requests: string;
      success_count: string;
      error_count: string;
      total_cost: string | null;
      total_input_tokens: string | null;
      total_output_tokens: string | null;
      avg_latency: string | null;
    }>(
      `SELECT
         COUNT(*) AS total_requests,
         COUNT(*) FILTER (WHERE status = 'success') AS success_count,
         COUNT(*) FILTER (WHERE status = 'error') AS error_count,
         SUM(cost) AS total_cost,
         SUM("inputTokens") AS total_input_tokens,
         SUM("outputTokens") AS total_output_tokens,
         AVG(latency) AS avg_latency
       FROM events
       ${where.clause}`,
      where.params,
    );

    if (error) throw new Error(`Postbase summary query failed: ${error}`);
    const row = data?.[0];

    return {
      totalRequests: Number(row?.total_requests ?? 0),
      successCount: Number(row?.success_count ?? 0),
      errorCount: Number(row?.error_count ?? 0),
      totalCost: Number(row?.total_cost ?? 0),
      totalInputTokens: Number(row?.total_input_tokens ?? 0),
      totalOutputTokens: Number(row?.total_output_tokens ?? 0),
      avgLatency: row?.avg_latency ? Number(row.avg_latency) : null,
    };
  }

  async getDailyUsage(filters: EventFilters, days: number): Promise<DailyUsagePoint[]> {
    const since = Date.now() - days * 24 * 60 * 60 * 1000;
    const where = buildSqlWhere({ ...filters, from: filters.from ?? since });

    const { data, error } = await this.client.sql<{
      day: string;
      requests: string;
      errors: string;
      cost: string | null;
      total_tokens: string | null;
    }>(
      `SELECT
         "dayBucket" AS day,
         COUNT(*) AS requests,
         COUNT(*) FILTER (WHERE status = 'error') AS errors,
         SUM(cost) AS cost,
         SUM("totalTokens") AS total_tokens
       FROM events
       ${where.clause}
       GROUP BY "dayBucket"
       ORDER BY "dayBucket" ASC`,
      where.params,
    );

    if (error) throw new Error(`Postbase daily usage query failed: ${error}`);

    return (data ?? []).map((row) => ({
      day: row.day,
      requests: Number(row.requests),
      errors: Number(row.errors),
      cost: Number(row.cost ?? 0),
      totalTokens: Number(row.total_tokens ?? 0),
    }));
  }

  async validateApiKey(key: string): Promise<ApiKeyRecord | null> {
    const { data, error } = await this.client
      .from<ApiKeyRow>("api_keys")
      .select("*")
      .eq("key", key)
      .maybeSingle();
    if (error || !data || data.revokedAt) return null;

    await this.client
      .from("api_keys")
      .update({ lastUsedAt: new Date().toISOString() })
      .eq("id", data.id);

    return toApiKeyRecord(data);
  }

  async getOrCreateDefaultApiKey(): Promise<ApiKeyRecord> {
    const { data: existing } = await this.client
      .from<ApiKeyRow>("api_keys")
      .select("*")
      .is("revokedAt", null)
      .order("createdAt", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existing) return toApiKeyRecord(existing);

    const { data: created, error } = await this.client
      .from<ApiKeyRow>("api_keys")
      .insert({ key: generateApiKey(), label: "Default" })
      .select()
      .single();

    if (error || !created) {
      throw new Error(`Postbase createApiKey failed: ${error}`);
    }
    return toApiKeyRecord(created);
  }

  async listApiKeys(): Promise<ApiKeyRecord[]> {
    const { data, error } = await this.client
      .from<ApiKeyRow>("api_keys")
      .select("*")
      .order("createdAt", { ascending: true });
    if (error) throw new Error(`Postbase listApiKeys failed: ${error}`);
    return (data ?? []).map(toApiKeyRecord);
  }

  async createApiKey(label: string): Promise<ApiKeyRecord> {
    const { data, error } = await this.client
      .from<ApiKeyRow>("api_keys")
      .insert({ key: generateApiKey(), label })
      .select()
      .single();
    if (error || !data) throw new Error(`Postbase createApiKey failed: ${error}`);
    return toApiKeyRecord(data);
  }

  async revokeApiKey(id: string): Promise<void> {
    const { error } = await this.client
      .from("api_keys")
      .update({ revokedAt: new Date().toISOString() })
      .eq("id", id);
    if (error) throw new Error(`Postbase revokeApiKey failed: ${error}`);
  }
}

function applyFilters(
  query: QueryBuilder<EventRow>,
  filters: EventFilters,
): QueryBuilder<EventRow> {
  if (filters.provider) query = query.eq("provider", filters.provider);
  if (filters.model) query = query.eq("model", filters.model);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.environment) query = query.eq("environment", filters.environment);
  if (filters.userId) query = query.eq("userId", filters.userId);
  if (filters.from) query = query.gte("timestamp", new Date(filters.from).toISOString());
  if (filters.to) query = query.lte("timestamp", new Date(filters.to).toISOString());
  return query;
}

function buildSqlWhere(filters: EventFilters): { clause: string; params: unknown[] } {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (filters.provider) {
    params.push(filters.provider);
    conditions.push(`provider = $${params.length}`);
  }
  if (filters.model) {
    params.push(filters.model);
    conditions.push(`model = $${params.length}`);
  }
  if (filters.status) {
    params.push(filters.status);
    conditions.push(`status = $${params.length}`);
  }
  if (filters.environment) {
    params.push(filters.environment);
    conditions.push(`environment = $${params.length}`);
  }
  if (filters.userId) {
    params.push(filters.userId);
    conditions.push(`"userId" = $${params.length}`);
  }
  if (filters.from) {
    params.push(new Date(filters.from).toISOString());
    conditions.push(`timestamp >= $${params.length}`);
  }
  if (filters.to) {
    params.push(new Date(filters.to).toISOString());
    conditions.push(`timestamp <= $${params.length}`);
  }

  return {
    clause: conditions.length ? `WHERE ${conditions.join(" AND ")}` : "",
    params,
  };
}
