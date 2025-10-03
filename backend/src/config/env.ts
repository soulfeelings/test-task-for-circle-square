import * as fs from 'node:fs';
import * as path from 'node:path';

export interface AppConfig {
  readonly roundDurationMs: number;
  readonly cooldownDurationMs: number;
  readonly jwtSecret: string;
  readonly port: number;
  readonly dataFile: string;
}

function parseDurationMinutes(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) {
    throw new Error(`Invalid duration value: ${value}`);
  }
  return parsed;
}

function parsePort(value: string | undefined, fallback: number): number {
  if (!value) {
    return fallback;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0 || parsed > 65535) {
    throw new Error(`Invalid port value: ${value}`);
  }
  return parsed;
}

function loadEnvFile(): Record<string, string> {
  const envPath = path.resolve(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  const content = fs.readFileSync(envPath, 'utf-8');
  const result: Record<string, string> = {};
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const [key, ...rest] = line.split('=');
    const value = rest.join('=').trim();
    result[key.trim()] = value;
  }
  return result;
}

export function loadConfig(): AppConfig {
  const envData = loadEnvFile();
  const merged: Record<string, string | undefined> = { ...envData };
  for (const [key, value] of Object.entries(process.env)) {
    merged[key] = typeof value === 'string' ? value : undefined;
  }

  const roundDurationMinutes = parseDurationMinutes(merged.ROUND_DURATION, 1);
  const cooldownDurationMinutes = parseDurationMinutes(merged.COOLDOWN_DURATION, 0);
  const jwtSecret = merged.JWT_SECRET ?? 'change-me';
  const port = parsePort(merged.PORT, 3000);
  const dataFile = merged.DATA_FILE ?? path.resolve(process.cwd(), 'data/storage.json');

  return {
    roundDurationMs: roundDurationMinutes * 60 * 1000,
    cooldownDurationMs: cooldownDurationMinutes * 60 * 1000,
    jwtSecret,
    port,
    dataFile,
  };
}
