import { KafkaConsumer, KafkaProducer, TOPICS, logger } from '@ride-sharing/shared';
import { findMatch } from '../../services/matching.service';
import { config } from '../../config/env';

export async function startRideConsumer(producer: KafkaProducer): Promise<KafkaConsumer> {
  const consumer = new KafkaConsumer(
    config.kafkaBrokers,
    'matching-service',
    'matching-service-rides',
  );
  await consumer.connect();

  await consumer.subscribe(TOPICS.RIDE_REQUESTED, async (_topic, _msg, payload) => {
    const { rideId, pickup } = payload as {
      rideId: string;
      pickup: { lat: number; lng: number };
    };

    logger.info('Finding match for ride', { rideId, pickup });
    const match = await findMatch(rideId, pickup);

    if (match) {
      await producer.publish(TOPICS.MATCH_FOUND, rideId, {
        rideId,
        driverId: match.driverId,
        distanceKm: match.distanceKm,
      });
      logger.info('Match found', { rideId, driverId: match.driverId });
    } else {
      await producer.publish(TOPICS.MATCH_FAILED, rideId, {
        rideId,
        reason: 'No available drivers nearby',
      });
      logger.warn('No match found for ride', { rideId });
    }
  });

  return consumer;
}
