import 'dotenv/config';
import http from 'http';
import { config } from './config/env';
import app from './app';
import { runMigrations } from './db/migrate';
import { geoClient } from './redis/geo.client';
import { setProducer } from './services/location.service';
import { startUserConsumer } from './kafka/consumers/user.consumer';
import { KafkaProducer, logger } from '@ride-sharing/shared';

async function start() {
  await runMigrations();
  await geoClient.connect(config.redisUrl);

  const producer = new KafkaProducer(config.kafkaBrokers, 'driver-service');
  await producer.connect();
  setProducer(producer);

  const consumer = await startUserConsumer();

  const server = http.createServer(app);
  server.listen(config.port, () => {
    logger.info(`driver-service listening on port ${config.port}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down driver-service...');
    await producer.disconnect();
    await consumer.disconnect();
    await geoClient.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start driver-service:', err);
  process.exit(1);
});
