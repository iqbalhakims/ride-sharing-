import { KafkaConsumer, TOPICS, logger } from '@ride-sharing/shared';
import { calculateFare } from '../../services/fare.service';
import { initiateAndProcess } from '../../services/payment.service';
import { config } from '../../config/env';

export async function startRideConsumer(): Promise<KafkaConsumer> {
  const consumer = new KafkaConsumer(
    config.kafkaBrokers,
    'payment-service',
    'payment-service-rides',
  );
  await consumer.connect();

  await consumer.subscribe(TOPICS.RIDE_COMPLETED, async (_topic, _msg, payload) => {
    const { rideId, riderId, driverId, distanceKm, durationSec } = payload as {
      rideId: string;
      riderId: string;
      driverId: string;
      distanceKm: number;
      durationSec: number;
    };

    const amount = calculateFare(distanceKm, durationSec);
    logger.info('Processing payment for completed ride', { rideId, amount });
    await initiateAndProcess(rideId, riderId, driverId, amount);
  });

  return consumer;
}
