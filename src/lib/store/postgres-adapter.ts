import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma-postgres/client";
import * as shared from "./prisma-shared";
import type { PrismaEventsDelegate } from "./prisma-shared";
import type {
  ApiKeyRecord,
  DailyUsagePoint,
  EventFilters,
  EventsPage,
  EventsStore,
  IncomingEvent,
  LargePromptProblem,
  ModelUsageStat,
  Pagination,
  StoredEvent,
  UsageSummary,
} from "./types";

export class PostgresEventsStore implements EventsStore {
  readonly kind = "postgres" as const;
  private readonly client: PrismaClient;

  constructor(connectionString: string) {
    const adapter = new PrismaPg(connectionString);
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
