import { config as loadEnv } from 'dotenv';
import { z } from 'zod';

loadEnv();

const schema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required'),
  COOKIE_NAME: z.string().min(1).default('guss_token'),
  ROUND_DURATION: z.coerce.number().int().positive().default(60),
  COOLDOWN_DURATION: z.coerce.number().int().nonnegative().default(30),
  CORS_ORIGIN: z.string().optional().default('*')
});

const parsed = schema.parse(process.env);

export const appConfig = {
  port: parsed.PORT,
  databaseUrl: parsed.DATABASE_URL,
  jwtSecret: parsed.JWT_SECRET,
  cookieName: parsed.COOKIE_NAME,
  roundDurationSeconds: parsed.ROUND_DURATION,
  cooldownDurationSeconds: parsed.COOLDOWN_DURATION,
  corsOrigin: parsed.CORS_ORIGIN
};
