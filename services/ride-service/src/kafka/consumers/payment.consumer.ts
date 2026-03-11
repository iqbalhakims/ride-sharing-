import { KafkaConsumer, TOPICS, logger } from '@ride-sharing/shared';
import { config } from '../../config/env';

export async function startPaymentConsumer(): Promise<KafkaConsumer> {
  const consumer = new KafkaConsumer(config.kafkaBrokers, 'ride-service', 'ride-service-payment');
  await consumer.connect();

  await consumer.subscribe(
    [TOPICS.PAYMENT_SUCCESS, TOPICS.PAYMENT_FAILED],
    async (topic, _msg, payload) => {
      const { rideId } = payload as { rideId: string };
      if (topic === TOPICS.PAYMENT_SUCCESS) {
        logger.info('Payment succeeded for ride', { rideId });
      } else {
        logger.warn('Payment failed for ride', { rideId });
      }
    },
  );

  return consumer;
}
