import { KafkaProducer, TOPICS, logger } from '@ride-sharing/shared';
import { db } from '../db/connection';
import { geoClient } from '../redis/geo.client';

let producer: KafkaProducer;

export function setProducer(p: KafkaProducer): void {
  producer = p;
}

export async function updateLocation(
  driverId: string,
  lat: number,
  lng: number,
  heading?: number,
): Promise<void> {
  await geoClient.addDriverLocation(driverId, lat, lng);

  await db('driver_locations').insert({ driver_id: driverId, lat, lng, heading });

  await producer.publish(TOPICS.DRIVER_LOCATION_UPDATED, driverId, {
    driverId,
    lat,
    lng,
    heading,
  });

  logger.debug('Driver location updated', { driverId, lat, lng });
}
