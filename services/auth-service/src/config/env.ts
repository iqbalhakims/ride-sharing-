import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('3001'),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  JWT_SECRET: z.string(),
  JWT_REFRESH_SECRET: z.string(),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  KAFKA_BROKERS: z.string().default('localhost:29092'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  databaseUrl: parsed.data.DATABASE_URL,
  redisUrl: parsed.data.REDIS_URL,
  jwtSecret: parsed.data.JWT_SECRET,
  jwtRefreshSecret: parsed.data.JWT_REFRESH_SECRET,
  jwtExpiresIn: parsed.data.JWT_EXPIRES_IN,
  jwtRefreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  kafkaBrokers: parsed.data.KAFKA_BROKERS.split(','),
  nodeEnv: parsed.data.NODE_ENV,
};
