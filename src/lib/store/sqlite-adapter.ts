import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@/generated/prisma-sqlite/client";
import * as shared from "./prisma-shared";
import type { PrismaEventsDelegate } from "./prisma-shared";
import type {
  ApiKeyRecord,
  DailyUsagePoint,
  DimensionDailyPoint,
  DimensionTrend,
  EventFilters,
  EventsPage,
  EventsStore,
  IncomingEvent,
  LargePromptProblem,
  ModelUsageStat,
  Pagination,
  StoredEvent,
  UsageDimension,
  UsageSummary,
} from "./types";

export class SqliteEventsStore implements EventsStore {
  readonly kind = "sqlite" as const;
  private readonly client: PrismaClient;

  constructor(dbPath: string) {
    const adapter = new PrismaBetterSqlite3({ url: dbPath });
    this.client = new PrismaClient({ adapter });
  }

  private get delegate(): PrismaEventsDelegate {
    return this.client as unknown as PrismaEventsDelegate;
  }

  async healthCheck(): Promise<{ ok: boolean; message?: string }> {
    try {
      await this.client.$queryRawUnsafe("SELECT 1");
      return { ok: true };
    } catch (err) {
      return { ok: false, message: (err as Error).message };
    }
  }

  insertEvent(event: IncomingEvent, apiKeyId: string | null): Promise<void> {
    return shared.insertEvent(this.delegate, event, apiKeyId);
  }

  queryEvents(filters: EventFilters, pagination?: Pagination): Promise<EventsPage> {
    return shared.queryEvents(this.delegate, filters, pagination);
  }

  getEvent(id: string): Promise<StoredEvent | null> {
    return shared.getEvent(this.delegate, id);
  }

  getUsageSummary(filters: EventFilters): Promise<UsageSummary> {
    return shared.getUsageSummary(this.delegate, filters);
  }

  getDailyUsage(filters: EventFilters, days: number): Promise<DailyUsagePoint[]> {
    return shared.getDailyUsage(this.delegate, filters, days);
  }

  getModelUsage(filters: EventFilters): Promise<ModelUsageStat[]> {
    return shared.getModelUsage(this.delegate, filters);
  }

  getLargePromptProblems(
    filters: EventFilters,
    thresholdTokens: number,
  ): Promise<LargePromptProblem[]> {
    return shared.getLargePromptProblems(this.delegate, filters, thresholdTokens);
  }

  getDimensionDailyUsage(
    dimension: UsageDimension,
    filters: EventFilters,
  ): Promise<DimensionDailyPoint[]> {
    return shared.getDimensionDailyUsage(this.delegate, dimension, filters);
  }

  getDimensionTrends(dimension: UsageDimension, filters: EventFilters): Promise<DimensionTrend[]> {
    return shared.getDimensionTrends(this.delegate, dimension, filters);
  }

  validateApiKey(key: string): Promise<ApiKeyRecord | null> {
    return shared.validateApiKey(this.delegate, key);
  }

  getOrCreateDefaultApiKey(): Promise<ApiKeyRecord> {
    return shared.getOrCreateDefaultApiKey(this.delegate);
  }

  listApiKeys(): Promise<ApiKeyRecord[]> {
    return shared.listApiKeys(this.delegate);
  }

  createApiKey(label: string): Promise<ApiKeyRecord> {
    return shared.createApiKey(this.delegate, label);
  }

  revokeApiKey(id: string): Promise<void> {
    return shared.revokeApiKey(this.delegate, id);
  }
}
