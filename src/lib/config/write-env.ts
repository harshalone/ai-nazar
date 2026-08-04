import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ENV_LOCAL_PATH = path.join(process.cwd(), ".env.local");

const NAZAR_KEYS = [
  "NAZAR_STORE",
  "NAZAR_SQLITE_PATH",
  "NAZAR_POSTGRES_URL",
  "NAZAR_POSTBASE_URL",
  "NAZAR_POSTBASE_SERVICE_ROLE_KEY",
  "NAZAR_POSTBASE_PROJECT_ID",
] as const;

/**
 * Writes AI Nazar's storage config into `.env.local`, replacing any
 * previous AI Nazar block while preserving unrelated lines a developer
 * may have added (their own env vars). Values are written as
 * `KEY="value"` with `"` and `\` escaped — env files aren't shell, but
 * quoting consistently avoids surprises if a connection string contains
 * spaces or special characters.
 */
export async function writeNazarEnv(values: Partial<Record<(typeof NAZAR_KEYS)[number], string>>): Promise<void> {
  let existingLines: string[] = [];
  try {
    const existing = await readFile(ENV_LOCAL_PATH, "utf8");
    existingLines = existing.split("\n");
  } catch {
    // No .env.local yet — that's fine, we're creating it.
  }

  const preserved = existingLines.filter((line) => {
    const key = line.split("=")[0]?.trim();
    return key ? !(NAZAR_KEYS as readonly string[]).includes(key) : true;
  });

  // Drop trailing blank lines from what we preserve so we control spacing.
  while (preserved.length > 0 && preserved[preserved.length - 1]?.trim() === "") {
    preserved.pop();
  }

  const nazarLines = NAZAR_KEYS.filter((key) => values[key] !== undefined).map(
    (key) => `${key}="${escapeEnvValue(values[key] as string)}"`,
  );

  const output = [...preserved, "", "# AI Nazar storage configuration (written by /setup)", ...nazarLines, ""].join(
    "\n",
  );

  await writeFile(ENV_LOCAL_PATH, output, "utf8");

  for (const key of NAZAR_KEYS) {
    if (values[key] !== undefined) {
      process.env[key] = values[key];
    }
  }
}

function escapeEnvValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}
