import { Server as HttpServer, IncomingMessage } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { URL } from 'url';
import { verifyToken, logger } from '@ride-sharing/shared';
import { registry } from './registry';
import { config } from '../config/env';

const PING_INTERVAL_MS = 30_000;

function getUserIdFromRequest(req: IncomingMessage): string | null {
  try {
    const url = new URL(req.url ?? '', 'http://localhost');
    const token = url.searchParams.get('token');
    if (!token) return null;
    const payload = verifyToken(token, config.jwtSecret);
    return payload.userId;
  } catch {
    return null;
  }
}

export function createWebSocketServer(httpServer: HttpServer): WebSocketServer {
  const wss = new WebSocketServer({ server: httpServer });

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const userId = getUserIdFromRequest(req);
    if (!userId) {
      ws.close(4001, 'Unauthorized');
      return;
    }

    registry.register(userId, ws);

    let isAlive = true;
    ws.on('pong', () => { isAlive = true; });

    const pingInterval = setInterval(() => {
      if (!isAlive) {
        ws.terminate();
        registry.unregister(userId);
        clearInterval(pingInterval);
        return;
      }
      isAlive = false;
      ws.ping();
    }, PING_INTERVAL_MS);

    ws.on('close', () => {
      registry.unregister(userId);
      clearInterval(pingInterval);
    });

    ws.on('error', (err) => {
      logger.error('WebSocket error', { userId, err });
    });

    ws.send(JSON.stringify({ type: 'CONNECTED', payload: { userId } }));
    logger.info('WebSocket connected', { userId });
  });

  return wss;
}
