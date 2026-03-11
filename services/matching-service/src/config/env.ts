import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('3004'),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  KAFKA_BROKERS: z.string().default('localhost:29092'),
  MATCH_RADIUS_KM: z.string().default('5'),
  MATCH_TIMEOUT_SEC: z.string().default('30'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  redisUrl: parsed.data.REDIS_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  kafkaBrokers: parsed.data.KAFKA_BROKERS.split(','),
  matchRadiusKm: parseFloat(parsed.data.MATCH_RADIUS_KM),
  matchTimeoutSec: parseInt(parsed.data.MATCH_TIMEOUT_SEC, 10),
  nodeEnv: parsed.data.NODE_ENV,
};
