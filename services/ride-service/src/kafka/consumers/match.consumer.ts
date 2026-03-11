import { KafkaConsumer, TOPICS, logger } from '@ride-sharing/shared';
import { db } from '../../db/connection';
import { config } from '../../config/env';

export async function startMatchConsumer(): Promise<KafkaConsumer> {
  const consumer = new KafkaConsumer(config.kafkaBrokers, 'ride-service', 'ride-service-match');
  await consumer.connect();

  await consumer.subscribe(
    [TOPICS.MATCH_FOUND, TOPICS.MATCH_FAILED],
    async (topic, _msg, payload) => {
      if (topic === TOPICS.MATCH_FOUND) {
        const { rideId, driverId } = payload as { rideId: string; driverId: string };
        await db('rides').where({ id: rideId, status: 'requested' }).update({ driver_id: driverId });
        logger.info('Driver pre-assigned to ride from match', { rideId, driverId });
      } else {
        const { rideId, reason } = payload as { rideId: string; reason: string };
        logger.warn('Match failed for ride', { rideId, reason });
      }
    },
  );

  return consumer;
}
