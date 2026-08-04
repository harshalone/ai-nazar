import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Gates every route except /setup (and its API/assets) behind having a
 * storage backend configured. This is the dashboard's only "auth" in v1
 * — there is no login; the gate is purely "has /setup been completed".
 *
 * Deliberately self-contained (no imports from src/lib) — Next.js bundles
 * proxy.ts separately from the rest of the app and does not resolve
 * cross-file imports for it (confirmed against Next 16.3.0 / Turbopack;
 * see ARCHITECTURE.md). Keep the "is configured" check here in sync with
 * src/lib/config/env.ts's readNazarConfig() by hand if either changes.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const configured = isNazarConfigured();

  if (!configured && pathname !== "/setup" && !pathname.startsWith("/api/setup")) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }

  if (configured && pathname === "/setup") {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

function isNazarConfigured(): boolean {
  const store = process.env.NAZAR_STORE;
  if (store === "sqlite") return Boolean(process.env.NAZAR_SQLITE_PATH);
  if (store === "postgres") return Boolean(process.env.NAZAR_POSTGRES_URL);
  if (store === "postbase") {
    return Boolean(
      process.env.NAZAR_POSTBASE_URL &&
        process.env.NAZAR_POSTBASE_SERVICE_ROLE_KEY &&
        process.env.NAZAR_POSTBASE_PROJECT_ID,
    );
  }
  return false;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|api/v1/events).*)"],
};
