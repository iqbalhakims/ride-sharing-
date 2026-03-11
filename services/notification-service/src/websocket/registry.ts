import { WebSocket } from 'ws';
import { logger } from '@ride-sharing/shared';

export class ConnectionRegistry {
  private connections = new Map<string, WebSocket>();

  register(userId: string, ws: WebSocket): void {
    const existing = this.connections.get(userId);
    if (existing && existing.readyState === WebSocket.OPEN) {
      existing.close(1000, 'Replaced by new connection');
    }
    this.connections.set(userId, ws);
    logger.debug('WebSocket registered', { userId, total: this.connections.size });
  }

  unregister(userId: string): void {
    this.connections.delete(userId);
    logger.debug('WebSocket unregistered', { userId, total: this.connections.size });
  }

  send(userId: string, event: { type: string; payload: unknown }): void {
    const ws = this.connections.get(userId);
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify(event));
  }

  broadcast(userIds: string[], event: { type: string; payload: unknown }): void {
    for (const userId of userIds) {
      this.send(userId, event);
    }
  }
}

export const registry = new ConnectionRegistry();
