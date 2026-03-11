import 'dotenv/config';
import http from 'http';
import { config } from './config/env';
import app from './app';
import { runMigrations } from './db/migrate';
import { initRedis } from './services/auth.service';
import { KafkaProducer, logger } from '@ride-sharing/shared';

let producer: KafkaProducer;

async function start() {
  await runMigrations();
  await initRedis();

  producer = new KafkaProducer(config.kafkaBrokers, 'auth-service');
  await producer.connect();

  const server = http.createServer(app);
  server.listen(config.port, () => {
    logger.info(`auth-service listening on port ${config.port}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down auth-service...');
    await producer.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start auth-service:', err);
  process.exit(1);
});
