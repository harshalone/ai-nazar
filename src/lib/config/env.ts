export type NazarStoreKind = "sqlite" | "postgres" | "postbase";

export interface ResolvedNazarConfig {
  store: NazarStoreKind;
  sqlite?: { path: string };
  postgres?: { connectionString: string };
  postbase?: { url: string; serviceRoleKey: string; projectId: string };
}

/**
 * Reads the active storage configuration from environment variables
 * (populated into `process.env` from `.env.local` by Next.js at boot).
 * Returns `null` if no backend has been configured yet — callers should
 * treat that as "run the /setup wizard", not as an error.
 */
export function readNazarConfig(): ResolvedNazarConfig | null {
  const store = process.env.NAZAR_STORE as NazarStoreKind | undefined;
  if (!store) return null;

  if (store === "sqlite") {
    const path = process.env.NAZAR_SQLITE_PATH;
    if (!path) return null;
    return { store, sqlite: { path } };
  }

  if (store === "postgres") {
    const connectionString = process.env.NAZAR_POSTGRES_URL;
    if (!connectionString) return null;
    return { store, postgres: { connectionString } };
  }

  if (store === "postbase") {
    const url = process.env.NAZAR_POSTBASE_URL;
    const serviceRoleKey = process.env.NAZAR_POSTBASE_SERVICE_ROLE_KEY;
    const projectId = process.env.NAZAR_POSTBASE_PROJECT_ID;
    if (!url || !serviceRoleKey || !projectId) return null;
    return { store, postbase: { url, serviceRoleKey, projectId } };
  }

  return null;
}

export function isConfigured(): boolean {
  return readNazarConfig() !== null;
}
