import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('3006'),
  KAFKA_BROKERS: z.string().default('localhost:29092'),
  JWT_SECRET: z.string(),
  REDIS_URL: z.string(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

const parsed = schema.safeParse(process.env);
if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = {
  port: parseInt(parsed.data.PORT, 10),
  kafkaBrokers: parsed.data.KAFKA_BROKERS.split(','),
  jwtSecret: parsed.data.JWT_SECRET,
  redisUrl: parsed.data.REDIS_URL,
  nodeEnv: parsed.data.NODE_ENV,
};
