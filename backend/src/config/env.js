import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must contain at least 32 characters'),
  JWT_EXPIRES_IN: z.string().min(1).default('1d'),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  const details = result.error.issues.map(({ path, message }) => `${path.join('.')}: ${message}`).join('\n');
  throw new Error(`Invalid environment configuration:\n${details}`);
}

export const env = Object.freeze(result.data);
