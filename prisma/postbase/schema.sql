-- AI Nazar dashboard schema for a Postbase-backed project.
-- Mirrors the Prisma models in ../sqlite/schema.prisma and
-- ../postgres/schema.prisma exactly, including Prisma's default camelCase
-- column naming (no @map was used on individual fields, only @@map on
-- table names) — this keeps column names identical across every adapter
-- so the SQL/JS field names never need translation.
--
-- Run this once against your Postbase project's SQL editor (or via
-- `postbase.sql()`) before selecting Postbase as the storage backend in
-- the /setup wizard.

CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    key TEXT NOT NULL UNIQUE,
    label TEXT NOT NULL DEFAULT 'Default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3)
);

CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "apiKeyId" TEXT REFERENCES api_keys(id) ON DELETE SET NULL,

    provider TEXT NOT NULL,
    model TEXT NOT NULL,

    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,

    latency INTEGER,
    cost DOUBLE PRECISION,

    status TEXT NOT NULL,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "errorCode" TEXT,
    "errorStatusCode" INTEGER,

    environment TEXT,
    "userId" TEXT,

    metadata TEXT,
    prompt TEXT,
    response TEXT,

    "sdkName" TEXT,
    "sdkVersion" TEXT,

    timestamp TIMESTAMP(3) NOT NULL,
    "dayBucket" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS events_timestamp_idx ON events(timestamp);
CREATE INDEX IF NOT EXISTS events_day_bucket_idx ON events("dayBucket");
CREATE INDEX IF NOT EXISTS events_provider_idx ON events(provider);
CREATE INDEX IF NOT EXISTS events_model_idx ON events(model);
CREATE INDEX IF NOT EXISTS events_status_idx ON events(status);
CREATE INDEX IF NOT EXISTS events_api_key_id_idx ON events("apiKeyId");

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
