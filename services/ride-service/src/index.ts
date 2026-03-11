import 'dotenv/config';
import http from 'http';
import { config } from './config/env';
import app from './app';
import { runMigrations } from './db/migrate';
import { setProducer } from './services/ride.service';
import { startMatchConsumer } from './kafka/consumers/match.consumer';
import { startPaymentConsumer } from './kafka/consumers/payment.consumer';
import { KafkaProducer, logger } from '@ride-sharing/shared';

async function start() {
  await runMigrations();

  const producer = new KafkaProducer(config.kafkaBrokers, 'ride-service');
  await producer.connect();
  setProducer(producer);

  const matchConsumer = await startMatchConsumer();
  const paymentConsumer = await startPaymentConsumer();

  const server = http.createServer(app);
  server.listen(config.port, () => {
    logger.info(`ride-service listening on port ${config.port}`);
  });

  const shutdown = async () => {
    logger.info('Shutting down ride-service...');
    await producer.disconnect();
    await matchConsumer.disconnect();
    await paymentConsumer.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start ride-service:', err);
  process.exit(1);
});
