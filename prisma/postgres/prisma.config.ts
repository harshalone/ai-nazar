import "dotenv/config";
import { defineConfig } from "prisma/config";

// Used only for `prisma migrate` / `prisma generate` CLI commands against
// the Postgres adapter — the running app never reads this file, it builds
// its own driver adapter at runtime from resolved config (see
// src/lib/config/env.ts).
export default defineConfig({
  schema: "schema.prisma",
  migrations: {
    path: "migrations",
  },
  datasource: {
    url: process.env.NAZAR_POSTGRES_URL ?? process.env.DATABASE_URL,
  },
});
