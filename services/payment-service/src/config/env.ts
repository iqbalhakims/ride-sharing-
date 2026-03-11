import { z } from 'zod';

const schema = z.object({
  PORT: z.string().default('3005'),
  DATABASE_URL: z.string(),
  JWT_SECRET: z.string(),
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
  jwtSecret: parsed.data.JWT_SECRET,
  kafkaBrokers: parsed.data.KAFKA_BROKERS.split(','),
  nodeEnv: parsed.data.NODE_ENV,
};
