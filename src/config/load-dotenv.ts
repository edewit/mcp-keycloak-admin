import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Load KEY=VALUE pairs from a .env file into process.env.
 * Existing environment variables win (MCP client / shell export take precedence).
 * Lines starting with # and blank lines are ignored. Values may be single- or
 * double-quoted. Does not support export, interpolation, or multiline values.
 */
export function applyDotEnvFile(
  env: NodeJS.ProcessEnv = process.env,
  filePath: string = resolve(process.cwd(), ".env"),
): void {
  let raw: string;
  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error: unknown) {
    const code =
      error !== null && typeof error === "object" && "code" in error
        ? (error as { code?: string }).code
        : undefined;
    if (code === "ENOENT") {
      return;
    }
    throw error;
  }

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
      continue;
    }
    if (env[key] !== undefined) {
      continue;
    }
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
}
