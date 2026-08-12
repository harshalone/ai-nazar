import type {
  ApiKeyRecord,
  DailyUsagePoint,
  DimensionDailyPoint,
  DimensionTrend,
  EventFilters,
  EventsPage,
  IncomingEvent,
  LargePromptProblem,
  ModelUsageStat,
  Pagination,
  StoredEvent,
  UsageDimension,
  UsageSummary,
} from "./types";
import {
  clampPageSize,
  computeLargePromptSavings,
  computeTotalTokens,
  dayBucketFor,
  decodeCursor,
  encodeCursor,
  generateApiKey,
  safeJsonParse,
  safeJsonStringify,
} from "./shared";

/**
 * Shared query logic for the two Prisma-backed adapters (SQLite, Postgres).
 * Both generated Prisma Clients have structurally identical models
 * (see prisma/sqlite/schema.prisma and prisma/postgres/schema.prisma), so
 * this is written against a minimal structural type rather than either
 * generated client directly — letting one implementation serve both
 * adapters without a circular dependency between their generated outputs.
 */

// Minimal structural slice of the generated PrismaClient this module needs.
// Both prisma-sqlite and prisma-postgres generated clients satisfy this.
export interface PrismaEventsDelegate {
  event: {
    create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
    findUnique(args: { where: { id: string } }): Promise<Record<string, unknown> | null>;
    findMany(args: Record<string, unknown>): Promise<Record<string, unknown>[]>;
    count(args: Record<string, unknown>): Promise<number>;
    aggregate(args: Record<string, unknown>): Promise<Record<string, unknown>>;
    groupBy(args: Record<string, unknown>): Promise<Record<string, unknown>[]>;
  };
  apiKey: {
    create(args: { data: Record<string, unknown> }): Promise<Record<string, unknown>>;
    findUnique(args: { where: Record<string, unknown> }): Promise<Record<string, unknown> | null>;
    findFirst(args: Record<string, unknown>): Promise<Record<string, unknown> | null>;
    findMany(args?: Record<string, unknown>): Promise<Record<string, unknown>[]>;
    update(args: { where: { id: string }; data: Record<string, unknown> }): Promise<Record<string, unknown>>;
  };
  $queryRawUnsafe<T = unknown>(query: string, ...values: unknown[]): Promise<T>;
}

function toStoredEvent(row: Record<string, unknown>): StoredEvent {
  const error =
    row.errorMessage || row.errorStack || row.errorCode || row.errorStatusCode
      ? {
          message: (row.errorMessage as string) ?? "",
          stack: (row.errorStack as string | null) ?? undefined,
          code: (row.errorCode as string | null) ?? undefined,
          statusCode: (row.errorStatusCode as number | null) ?? undefined,
        }
      : undefined;

  return {
    id: row.id as string,
    provider: row.provider as string,
    model: row.model as string,
    inputTokens: (row.inputTokens as number | null) ?? undefined,
    outputTokens: (row.outputTokens as number | null) ?? undefined,
    latency: (row.latency as number | null) ?? undefined,
    cost: (row.cost as number | null) ?? undefined,
    status: row.status as "success" | "error",
    error,
    environment: (row.environment as string | null) ?? undefined,
    userId: (row.userId as string | null) ?? undefined,
    metadata: safeJsonParse(row.metadata as string | null) as
      | Record<string, unknown>
      | undefined,
    prompt: safeJsonParse(row.prompt as string | null),
    response: safeJsonParse(row.response as string | null),
    timestamp: new Date(row.timestamp as string | Date).getTime(),
    sdk:
      row.sdkName || row.sdkVersion
        ? {
            name: (row.sdkName as string) ?? "",
            version: (row.sdkVersion as string) ?? "",
          }
        : undefined,
    totalTokens: (row.totalTokens as number | null) ?? null,
    dayBucket: row.dayBucket as string,
    createdAt: new Date(row.createdAt as string | Date).toISOString(),
  };
}

export async function insertEvent(
  client: PrismaEventsDelegate,
  event: IncomingEvent,
  apiKeyId: string | null,
): Promise<void> {
  const timestamp = new Date(event.timestamp);
  await client.event.create({
    data: {
      id: event.id,
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
      timestamp,
      dayBucket: dayBucketFor(event.timestamp),
    },
  });
}

function buildWhere(filters: EventFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};
  if (filters.provider) where.provider = filters.provider;
  if (filters.model) where.model = filters.model;
  if (filters.status) where.status = filters.status;
  if (filters.environment) where.environment = filters.environment;
  if (filters.userId) where.userId = filters.userId;
  if (filters.from || filters.to) {
    where.timestamp = {
      ...(filters.from ? { gte: new Date(filters.from) } : {}),
      ...(filters.to ? { lte: new Date(filters.to) } : {}),
    };
  }
  if (filters.search) {
    where.OR = [
      { model: { contains: filters.search } },
      { provider: { contains: filters.search } },
      { userId: { contains: filters.search } },
    ];
  }
  return where;
}

export async function queryEvents(
  client: PrismaEventsDelegate,
  filters: EventFilters,
  pagination: Pagination = {},
): Promise<EventsPage> {
  const take = clampPageSize(pagination.limit);
  const where = buildWhere(filters);

  if (pagination.cursor) {
    const decoded = decodeCursor(pagination.cursor);
    if (decoded) {
      where.OR = undefined;
      const cursorConditions = {
        OR: [
          { timestamp: { lt: new Date(decoded.timestamp) } },
          {
            timestamp: new Date(decoded.timestamp),
            id: { lt: decoded.id },
          },
        ],
      };
      Object.assign(where, cursorConditions);
    }
  }

  const rows = await client.event.findMany({
    where,
    orderBy: [{ timestamp: "desc" }, { id: "desc" }],
    take: take + 1,
  });

  const hasMore = rows.length > take;
  const page = hasMore ? rows.slice(0, take) : rows;
  const events = page.map(toStoredEvent);
  const last = events[events.length - 1];

  return {
    events,
    nextCursor: hasMore && last ? encodeCursor(last.timestamp, last.id) : null,
  };
}

export async function getEvent(
  client: PrismaEventsDelegate,
  id: string,
): Promise<StoredEvent | null> {
  const row = await client.event.findUnique({ where: { id } });
  return row ? toStoredEvent(row) : null;
}

export async function getUsageSummary(
  client: PrismaEventsDelegate,
  filters: EventFilters,
): Promise<UsageSummary> {
  const where = buildWhere(filters);

  const [totalRequests, successCount, errorCount, aggregate] = await Promise.all([
    client.event.count({ where }),
    client.event.count({ where: { ...where, status: "success" } }),
    client.event.count({ where: { ...where, status: "error" } }),
    client.event.aggregate({
      where,
      _sum: { cost: true, inputTokens: true, outputTokens: true },
      _avg: { latency: true },
    }),
  ]);

  const sum = aggregate._sum as {
    cost: number | null;
    inputTokens: number | null;
    outputTokens: number | null;
  };
  const avg = aggregate._avg as { latency: number | null };

  return {
    totalRequests,
    successCount,
    errorCount,
    totalCost: sum.cost ?? 0,
    totalInputTokens: sum.inputTokens ?? 0,
    totalOutputTokens: sum.outputTokens ?? 0,
    avgLatency: avg.latency ?? null,
  };
}

export async function getDailyUsage(
  client: PrismaEventsDelegate,
  filters: EventFilters,
  days: number,
): Promise<DailyUsagePoint[]> {
  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const where = buildWhere({ ...filters, from: filters.from ?? since });

  const groups = await client.event.groupBy({
    by: ["dayBucket"],
    where,
    _count: { _all: true },
    _sum: { cost: true, totalTokens: true },
  });

  const errorGroups = await client.event.groupBy({
    by: ["dayBucket"],
    where: { ...where, status: "error" },
    _count: { _all: true },
  });
  const errorsByDay = new Map(
    errorGroups.map((g) => [
      g.dayBucket as string,
      (g._count as { _all: number })._all,
    ]),
  );

  const points: DailyUsagePoint[] = groups.map((g) => {
    const sum = g._sum as { cost: number | null; totalTokens: number | null };
    const count = g._count as { _all: number };
    const day = g.dayBucket as string;
    return {
      day,
      requests: count._all,
      errors: errorsByDay.get(day) ?? 0,
      cost: sum.cost ?? 0,
      totalTokens: sum.totalTokens ?? 0,
    };
  });

  return points.sort((a, b) => a.day.localeCompare(b.day));
}

/** Approximate number of days covered by `filters`, defaulting to 30 when unbounded. */
function windowDaysFor(filters: EventFilters): number {
  if (!filters.from) return 30;
  const to = filters.to ?? Date.now();
  return Math.max(1, (to - filters.from) / (24 * 60 * 60 * 1000));
}

export async function getModelUsage(
  client: PrismaEventsDelegate,
  filters: EventFilters,
): Promise<ModelUsageStat[]> {
  const where = buildWhere(filters);

  const groups = await client.event.groupBy({
    by: ["provider", "model"],
    where,
    _count: { _all: true },
    _sum: { cost: true, totalTokens: true },
    _avg: { latency: true },
  });

  const errorGroups = await client.event.groupBy({
    by: ["provider", "model"],
    where: { ...where, status: "error" },
    _count: { _all: true },
  });
  const errorsByKey = new Map(
    errorGroups.map((g) => [
      `${g.provider as string}::${g.model as string}`,
      (g._count as { _all: number })._all,
    ]),
  );

  const stats: ModelUsageStat[] = groups.map((g) => {
    const provider = g.provider as string;
    const model = g.model as string;
    const sum = g._sum as { cost: number | null; totalTokens: number | null };
    const avg = g._avg as { latency: number | null };
    const count = g._count as { _all: number };
    const errorCount = errorsByKey.get(`${provider}::${model}`) ?? 0;

    return {
      provider,
      model,
      requests: count._all,
      cost: sum.cost ?? 0,
      totalTokens: sum.totalTokens ?? 0,
      avgLatency: avg.latency,
      errorRate: count._all > 0 ? errorCount / count._all : 0,
    };
  });

  return stats.sort((a, b) => b.cost - a.cost);
}

export async function getLargePromptProblems(
  client: PrismaEventsDelegate,
  filters: EventFilters,
  thresholdTokens: number,
): Promise<LargePromptProblem[]> {
  const where = buildWhere(filters);

  const groups = await client.event.groupBy({
    by: ["provider", "model"],
    where,
    _count: { _all: true },
    _avg: { inputTokens: true },
    _sum: { cost: true, totalTokens: true },
  });

  const rows = groups.map((g) => {
    const avg = g._avg as { inputTokens: number | null };
    const sum = g._sum as { cost: number | null; totalTokens: number | null };
    const count = g._count as { _all: number };
    return {
      provider: g.provider as string,
      model: g.model as string,
      requests: count._all,
      avgInputTokens: avg.inputTokens ?? 0,
      totalCost: sum.cost ?? 0,
      totalTokens: sum.totalTokens ?? 0,
    };
  });

  return computeLargePromptSavings(rows, thresholdTokens, windowDaysFor(filters));
}

/** Groups by the raw `groupField` (`model` or `apiKeyId`); labels are resolved by the caller. */
function groupFieldFor(dimension: UsageDimension): "model" | "apiKeyId" {
  return dimension === "model" ? "model" : "apiKeyId";
}

/** Resolves API key ids to their labels for the `apiKey` dimension; identity for `model`. */
async function resolveLabels(
  client: PrismaEventsDelegate,
  dimension: UsageDimension,
  keys: string[],
): Promise<Map<string, string>> {
  if (dimension === "model") {
    return new Map(keys.map((key) => [key, key]));
  }

  const rows = await client.apiKey.findMany({
    where: { id: { in: keys.filter((k) => k !== "none") } },
  });
  const labelById = new Map(rows.map((r) => [r.id as string, r.label as string]));
  return new Map(keys.map((key) => [key, key === "none" ? "Unknown" : (labelById.get(key) ?? "Unknown")]));
}

/**
 * Daily spend/requests/tokens broken out by `dimension` — the data a
 * stacked-by-day chart needs. One row per (day, dimension value).
 */
export async function getDimensionDailyUsage(
  client: PrismaEventsDelegate,
  dimension: UsageDimension,
  filters: EventFilters,
): Promise<DimensionDailyPoint[]> {
  const where = buildWhere(filters);
  const groupField = groupFieldFor(dimension);

  const groups = await client.event.groupBy({
    by: ["dayBucket", groupField],
    where,
    _count: { _all: true },
    _sum: { cost: true, totalTokens: true },
  });

  const rawKeys = groups.map((g) => (g[groupField] as string | null) ?? "none");
  const labelByKey = await resolveLabels(client, dimension, [...new Set(rawKeys)]);

  return groups.map((g) => {
    const sum = g._sum as { cost: number | null; totalTokens: number | null };
    const count = g._count as { _all: number };
    const key = (g[groupField] as string | null) ?? "none";
    return {
      day: g.dayBucket as string,
      key,
      label: labelByKey.get(key) ?? key,
      cost: sum.cost ?? 0,
      requests: count._all,
      totalTokens: sum.totalTokens ?? 0,
    };
  });
}

async function getDimensionTotals(
  client: PrismaEventsDelegate,
  dimension: UsageDimension,
  filters: EventFilters,
): Promise<Array<{ key: string; label: string; cost: number; requests: number; totalTokens: number }>> {
  const where = buildWhere(filters);
  const groupField = groupFieldFor(dimension);

  const groups = await client.event.groupBy({
    by: [groupField],
    where,
    _count: { _all: true },
    _sum: { cost: true, totalTokens: true },
  });

  const rawKeys = groups.map((g) => (g[groupField] as string | null) ?? "none");
  const labelByKey = await resolveLabels(client, dimension, [...new Set(rawKeys)]);

  return groups.map((g) => {
    const sum = g._sum as { cost: number | null; totalTokens: number | null };
    const count = g._count as { _all: number };
    const key = (g[groupField] as string | null) ?? "none";
    return {
      key,
      label: labelByKey.get(key) ?? key,
      cost: sum.cost ?? 0,
      requests: count._all,
      totalTokens: sum.totalTokens ?? 0,
    };
  });
}

/**
 * Totals per dimension value for `filters`' window, each with its % change
 * vs. the immediately preceding window of equal length and a same-length
 * daily sparkline — what the "Trending" list and the Explore table rank by.
 */
export async function getDimensionTrends(
  client: PrismaEventsDelegate,
  dimension: UsageDimension,
  filters: EventFilters,
): Promise<DimensionTrend[]> {
  const from = filters.from ?? Date.now() - 30 * 24 * 60 * 60 * 1000;
  const to = filters.to ?? Date.now();
  const windowMs = to - from;
  const prevFrom = from - windowMs;
  const prevTo = from;

  const [current, previous, daily] = await Promise.all([
    getDimensionTotals(client, dimension, { ...filters, from, to }),
    getDimensionTotals(client, dimension, { ...filters, from: prevFrom, to: prevTo }),
    getDimensionDailyUsage(client, dimension, { ...filters, from, to }),
  ]);

  const previousByKey = new Map(previous.map((row) => [row.key, row.cost]));
  const sparklineByKey = new Map<string, number[]>();
  for (const point of [...daily].sort((a, b) => a.day.localeCompare(b.day))) {
    const series = sparklineByKey.get(point.key) ?? [];
    series.push(point.cost);
    sparklineByKey.set(point.key, series);
  }

  return current
    .map((row) => {
      const prevCost = previousByKey.get(row.key) ?? 0;
      const changePct = prevCost > 0 ? ((row.cost - prevCost) / prevCost) * 100 : row.cost > 0 ? null : 0;
      return {
        key: row.key,
        label: row.label,
        cost: row.cost,
        requests: row.requests,
        totalTokens: row.totalTokens,
        changePct,
        sparkline: sparklineByKey.get(row.key) ?? [],
      };
    })
    .sort((a, b) => b.cost - a.cost);
}

function toApiKeyRecord(row: Record<string, unknown>): ApiKeyRecord {
  return {
    id: row.id as string,
    key: row.key as string,
    label: row.label as string,
    createdAt: new Date(row.createdAt as string | Date).toISOString(),
    lastUsedAt: row.lastUsedAt
      ? new Date(row.lastUsedAt as string | Date).toISOString()
      : null,
    revokedAt: row.revokedAt
      ? new Date(row.revokedAt as string | Date).toISOString()
      : null,
  };
}

export async function validateApiKey(
  client: PrismaEventsDelegate,
  key: string,
): Promise<ApiKeyRecord | null> {
  const row = await client.apiKey.findUnique({ where: { key } });
  if (!row || row.revokedAt) return null;

  await client.apiKey.update({
    where: { id: row.id as string },
    data: { lastUsedAt: new Date() },
  });

  return toApiKeyRecord(row);
}

export async function getOrCreateDefaultApiKey(
  client: PrismaEventsDelegate,
): Promise<ApiKeyRecord> {
  const existing = await client.apiKey.findFirst({
    where: { revokedAt: null },
    orderBy: { createdAt: "asc" },
  });
  if (existing) return toApiKeyRecord(existing);

  const created = await client.apiKey.create({
    data: { key: generateApiKey(), label: "Default" },
  });
  return toApiKeyRecord(created);
}

export async function listApiKeys(client: PrismaEventsDelegate): Promise<ApiKeyRecord[]> {
  const rows = await client.apiKey.findMany({ orderBy: { createdAt: "asc" } });
  return rows.map(toApiKeyRecord);
}

export async function createApiKey(
  client: PrismaEventsDelegate,
  label: string,
): Promise<ApiKeyRecord> {
  const created = await client.apiKey.create({
    data: { key: generateApiKey(), label },
  });
  return toApiKeyRecord(created);
}

export async function revokeApiKey(client: PrismaEventsDelegate, id: string): Promise<void> {
  await client.apiKey.update({ where: { id }, data: { revokedAt: new Date() } });
}
