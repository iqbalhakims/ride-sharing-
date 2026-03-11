import { createClient } from 'redis';
import { logger } from '@ride-sharing/shared';

type RedisClient = ReturnType<typeof createClient>;

export class GeoClient {
  private client!: RedisClient;

  async connect(url: string): Promise<void> {
    this.client = createClient({ url });
    this.client.on('error', (err) => logger.error('Redis error', { err }));
    await this.client.connect();
    logger.info('Redis geo client connected');
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  async addDriverLocation(driverId: string, lat: number, lng: number): Promise<void> {
    await this.client.geoAdd('drivers:geo', { latitude: lat, longitude: lng, member: driverId });
  }

  async removeDriver(driverId: string): Promise<void> {
    await this.client.zRem('drivers:geo', driverId);
    await this.client.del(`driver:available:${driverId}`);
    await this.client.del(`driver:rating:${driverId}`);
  }

  async setDriverAvailable(driverId: string, available: boolean): Promise<void> {
    await this.client.set(`driver:available:${driverId}`, available ? 'true' : 'false');
  }

  async setDriverRating(driverId: string, rating: number): Promise<void> {
    await this.client.set(`driver:rating:${driverId}`, rating.toString());
  }
}

export const geoClient = new GeoClient();
