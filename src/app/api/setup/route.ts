import { NextResponse } from "next/server";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { writeNazarEnv } from "@/lib/config/write-env";
import { resetStoreCache } from "@/lib/store/get-store";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

interface SetupPayload {
  store: "sqlite" | "postgres" | "postbase";
  sqlitePath?: string;
  postgresUrl?: string;
  postbaseUrl?: string;
  postbaseServiceRoleKey?: string;
  postbaseProjectId?: string;
}

export async function POST(request: Request) {
  let payload: SetupPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (payload.store === "sqlite") {
    return setupSqlite(payload);
  }
  if (payload.store === "postgres") {
    return setupPostgres(payload);
  }
  if (payload.store === "postbase") {
    return setupPostbase(payload);
  }

  return NextResponse.json({ error: "Unknown store type" }, { status: 400 });
}

async function setupSqlite(payload: SetupPayload) {
  const relativePath = payload.sqlitePath?.trim() || "./data/nazar.db";
  // turbopackIgnore: user-configured path from the setup form, not a
  // static project-relative traversal.
  const absolutePath = path.isAbsolute(relativePath)
    ? relativePath
    : path.join(/* turbopackIgnore: true */ process.cwd(), relativePath);

  await mkdir(path.dirname(absolutePath), { recursive: true });

  try {
    await execFileAsync(
      "npx",
      ["prisma", "migrate", "deploy", "--config=prisma/sqlite/prisma.config.ts"],
      { cwd: process.cwd(), env: { ...process.env, NAZAR_SQLITE_PATH: absolutePath } },
    );
  } catch (err) {
    return NextResponse.json(
      { error: `Failed to run SQLite migrations: ${(err as Error).message}` },
      { status: 500 },
    );
  }

  await writeNazarEnv({ NAZAR_STORE: "sqlite", NAZAR_SQLITE_PATH: absolutePath });
  resetStoreCache();

  return NextResponse.json({ ok: true });
}

async function setupPostgres(payload: SetupPayload) {
  const connectionString = payload.postgresUrl?.trim();
  if (!connectionString) {
    return NextResponse.json({ error: "postgresUrl is required" }, { status: 400 });
  }

  try {
    await execFileAsync(
      "npx",
      ["prisma", "migrate", "deploy", "--config=prisma/postgres/prisma.config.ts"],
      { cwd: process.cwd(), env: { ...process.env, NAZAR_POSTGRES_URL: connectionString } },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: `Could not connect or migrate: ${(err as Error).message}`,
      },
      { status: 400 },
    );
  }

  await writeNazarEnv({ NAZAR_STORE: "postgres", NAZAR_POSTGRES_URL: connectionString });
  resetStoreCache();

  return NextResponse.json({ ok: true });
}

async function setupPostbase(payload: SetupPayload) {
  const url = payload.postbaseUrl?.trim();
  const serviceRoleKey = payload.postbaseServiceRoleKey?.trim();
  const projectId = payload.postbaseProjectId?.trim();

  if (!url || !serviceRoleKey || !projectId) {
    return NextResponse.json(
      { error: "postbaseUrl, postbaseServiceRoleKey, and postbaseProjectId are all required" },
      { status: 400 },
    );
  }

  const { PostbaseEventsStore } = await import("@/lib/store/postbase-adapter");
  const store = new PostbaseEventsStore({ url, serviceRoleKey, projectId });
  const health = await store.healthCheck();

  if (!health.ok) {
    return NextResponse.json(
      {
        error: `Could not reach the events table. Have you run prisma/postbase/schema.sql in your Postbase project's SQL editor? (${health.message})`,
      },
      { status: 400 },
    );
  }

  await writeNazarEnv({
    NAZAR_STORE: "postbase",
    NAZAR_POSTBASE_URL: url,
    NAZAR_POSTBASE_SERVICE_ROLE_KEY: serviceRoleKey,
    NAZAR_POSTBASE_PROJECT_ID: projectId,
  });
  resetStoreCache();

  return NextResponse.json({ ok: true });
}
