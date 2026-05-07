import { z } from 'zod';

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('production'),
  PORT: z.coerce.number().int().default(8080),
  DATABASE_URL: z.string().min(1),
  JWT_SECRET: z.string().min(16),
  INGEST_TOKEN: z.string().min(8),
  CORS_ORIGINS: z.string().default('http://localhost:9099'),
  MOSCOW_ROADS_DATA_SOURCE: z.enum(['mock', 'opendata', 'hybrid']).default('hybrid'),
  MOSCOW_ROADS_MOCK_ENABLED: z
    .union([z.string(), z.boolean()])
    .transform(v => (typeof v === 'boolean' ? v : v === 'true' || v === '1'))
    .default('true' as any),
  MOSCOW_ROADS_MOCK_SEED: z.coerce.number().int().default(42),
});

export type Env = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(config);
  if (!parsed.success) {
    console.error('[config] invalid env vars:', parsed.error.flatten().fieldErrors);
    throw new Error('Environment validation failed');
  }
  return parsed.data;
}
