import { KafkaConsumer, TOPICS, logger } from '@ride-sharing/shared';
import * as driverModel from '../../models/driver.model';
import { config } from '../../config/env';

export async function startUserConsumer(): Promise<KafkaConsumer> {
  const consumer = new KafkaConsumer(config.kafkaBrokers, 'driver-service', 'driver-service-users');
  await consumer.connect();

  await consumer.subscribe(TOPICS.USER_REGISTERED, async (_topic, _msg, payload) => {
    const { userId, role } = payload as { userId: string; email: string; role: string };
    if (role !== 'driver') return;

    const existing = await driverModel.findById(userId);
    if (existing) return;

    await driverModel.create({ id: userId });
    logger.info('Driver profile created for new user', { userId });
  });

  return consumer;
}
