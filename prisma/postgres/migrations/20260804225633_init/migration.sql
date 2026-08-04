-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "label" TEXT NOT NULL DEFAULT 'Default',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "apiKeyId" TEXT,
    "provider" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "inputTokens" INTEGER,
    "outputTokens" INTEGER,
    "totalTokens" INTEGER,
    "latency" INTEGER,
    "cost" DOUBLE PRECISION,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,
    "errorStack" TEXT,
    "errorCode" TEXT,
    "errorStatusCode" INTEGER,
    "environment" TEXT,
    "userId" TEXT,
    "metadata" TEXT,
    "prompt" TEXT,
    "response" TEXT,
    "sdkName" TEXT,
    "sdkVersion" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL,
    "dayBucket" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "settings" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "settings_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_key_key" ON "api_keys"("key");

-- CreateIndex
CREATE INDEX "events_timestamp_idx" ON "events"("timestamp");

-- CreateIndex
CREATE INDEX "events_dayBucket_idx" ON "events"("dayBucket");

-- CreateIndex
CREATE INDEX "events_provider_idx" ON "events"("provider");

-- CreateIndex
CREATE INDEX "events_model_idx" ON "events"("model");

-- CreateIndex
CREATE INDEX "events_status_idx" ON "events"("status");

-- CreateIndex
CREATE INDEX "events_apiKeyId_idx" ON "events"("apiKeyId");

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_apiKeyId_fkey" FOREIGN KEY ("apiKeyId") REFERENCES "api_keys"("id") ON DELETE SET NULL ON UPDATE CASCADE;

