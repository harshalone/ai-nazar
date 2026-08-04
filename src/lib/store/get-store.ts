import path from "node:path";
import { readNazarConfig } from "@/lib/config/env";
import type { EventsStore } from "./types";

// Cached on `globalThis` (not a module-level variable) so the singleton
// survives Next.js dev-mode module reloads — without this, each hot
// reload would open a new better-sqlite3 file handle / pg pool.
const globalForStore = globalThis as unknown as { __nazarStore?: EventsStore };

/**
 * Resolves and returns the active `EventsStore`, instantiating it from
 * env-derived config on first call. Returns `null` if AI Nazar hasn't
 * been configured yet (no /setup wizard run) — callers must handle that
 * by redirecting to /setup, never by falling back to a default.
 */
export async function getStore(): Promise<EventsStore | null> {
  if (globalForStore.__nazarStore) return globalForStore.__nazarStore;

  const config = readNazarConfig();
  if (!config) return null;

  let store: EventsStore;

  if (config.store === "sqlite") {
    const { SqliteEventsStore } = await import("./sqlite-adapter");
    // turbopackIgnore: path is a user-configured relative path from
    // .env.local (written by /setup), not a static project-relative
    // traversal — see the Turbopack build warning this comment silences.
    const resolvedPath = path.isAbsolute(config.sqlite!.path)
      ? config.sqlite!.path
      : path.join(/* turbopackIgnore: true */ process.cwd(), config.sqlite!.path);
    store = new SqliteEventsStore(resolvedPath);
  } else if (config.store === "postgres") {
    const { PostgresEventsStore } = await import("./postgres-adapter");
    store = new PostgresEventsStore(config.postgres!.connectionString);
  } else {
    const { PostbaseEventsStore } = await import("./postbase-adapter");
    store = new PostbaseEventsStore(config.postbase!);
  }

  globalForStore.__nazarStore = store;
  return store;
}

/** Clears the cached store — used after /setup changes the configuration. */
export function resetStoreCache(): void {
  globalForStore.__nazarStore = undefined;
}
