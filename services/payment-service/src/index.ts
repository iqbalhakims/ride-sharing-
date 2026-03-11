import 'dotenv/config';
import http from 'http';
import { config } from './config/env';
import app from './app';
import { runMigrations } from './db/migrate';
import { setProducer } from './services/payment.service';
import { startRideConsumer } from './kafka/consumers/ride.consumer';
import { KafkaProducer, logger } from '@ride-sharing/shared';

async function start() {
  await runMigrations();

  const producer = new KafkaProducer(config.kafkaBrokers, 'payment-service');
  await producer.connect();
  setProducer(producer);

  const consumer = await startRideConsumer();

  const server = http.createServer(app);
  server.listen(config.port, () => {
    logger.info(`payment-service listening on port ${config.port}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down payment-service...');
    await producer.disconnect();
    await consumer.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start payment-service:', err);
  process.exit(1);
});
