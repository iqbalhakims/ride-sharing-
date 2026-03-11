import 'dotenv/config';
import http from 'http';
import { config } from './config/env';
import app from './app';
import { geoClient } from './redis/geo.client';
import { startRideConsumer } from './kafka/consumers/ride.consumer';
import { KafkaProducer, logger } from '@ride-sharing/shared';

async function start() {
  await geoClient.connect(config.redisUrl);

  const producer = new KafkaProducer(config.kafkaBrokers, 'matching-service');
  await producer.connect();

  const consumer = await startRideConsumer(producer);

  const server = http.createServer(app);
  server.listen(config.port, () => {
    logger.info(`matching-service listening on port ${config.port}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down matching-service...');
    await producer.disconnect();
    await consumer.disconnect();
    await geoClient.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start matching-service:', err);
  process.exit(1);
});
