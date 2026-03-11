import 'dotenv/config';
import http from 'http';
import { config } from './config/env';
import app from './app';
import { createWebSocketServer } from './websocket/server';
import { startEventsConsumer } from './kafka/consumers/events.consumer';
import { logger } from '@ride-sharing/shared';

async function start() {
  const server = http.createServer(app);
  createWebSocketServer(server);

  const consumer = await startEventsConsumer();

  server.listen(config.port, () => {
    logger.info(`notification-service listening on port ${config.port} (HTTP + WebSocket)`);
  });

  const shutdown = async () => {
    logger.info('Shutting down notification-service...');
    await consumer.disconnect();
    server.close(() => process.exit(0));
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

start().catch((err) => {
  console.error('Failed to start notification-service:', err);
  process.exit(1);
});
