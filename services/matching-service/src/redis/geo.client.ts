import { createClient, GeoReplyWith } from 'redis';
import { logger } from '@ride-sharing/shared';

type RedisClient = ReturnType<typeof createClient>;

export class MatchingGeoClient {
  private client!: RedisClient;

  async connect(url: string): Promise<void> {
    this.client = createClient({ url });
    this.client.on('error', (err) => logger.error('Redis error (matching)', { err }));
    await this.client.connect();
    logger.info('Matching Redis client connected');
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  async findNearbyDrivers(
    lat: number,
    lng: number,
    radiusKm: number,
  ): Promise<Array<{ driverId: string; distanceKm: number }>> {
    const results = await this.client.geoSearchWith(
      'drivers:geo',
      { longitude: lng, latitude: lat },
      { radius: radiusKm, unit: 'km' },
      [GeoReplyWith.DISTANCE],
      { SORT: 'ASC' },
    );

    return results.map((r) => ({
      driverId: r.member as string,
      distanceKm: parseFloat(String(r.distance ?? '0')),
    }));
  }

  async isDriverAvailable(driverId: string): Promise<boolean> {
    const val = await this.client.get(`driver:available:${driverId}`);
    return val === 'true';
  }

  async getDriverRating(driverId: string): Promise<number> {
    const val = await this.client.get(`driver:rating:${driverId}`);
    return val ? parseFloat(val) : 5.0;
  }
}

export const geoClient = new MatchingGeoClient();
