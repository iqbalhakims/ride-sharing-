import { KafkaProducer, TOPICS, logger } from '@ride-sharing/shared';
import { db } from '../db/connection';
import { processPayment as gatewayProcess } from './gateway.service';

let producer: KafkaProducer;

export function setProducer(p: KafkaProducer): void {
  producer = p;
}

export async function initiateAndProcess(
  rideId: string,
  riderId: string,
  driverId: string,
  amount: number,
): Promise<void> {
  const [payment] = await db('payments')
    .insert({ ride_id: rideId, rider_id: riderId, driver_id: driverId, amount, status: 'pending' })
    .returning('*');

  await producer.publish(TOPICS.PAYMENT_INITIATED, rideId, { rideId, riderId, amount });
  logger.info('Payment initiated', { paymentId: payment.id, rideId, amount });

  const result = await gatewayProcess(amount, 'card');

  if (result.success) {
    await db('payments')
      .where({ id: payment.id })
      .update({ status: 'success', gateway_ref: result.transactionId, updated_at: new Date() });

    await producer.publish(TOPICS.PAYMENT_SUCCESS, rideId, {
      rideId,
      riderId,
      transactionId: result.transactionId,
      amount,
    });
    logger.info('Payment succeeded', { rideId, transactionId: result.transactionId });
  } else {
    await db('payments')
      .where({ id: payment.id })
      .update({ status: 'failed', updated_at: new Date() });

    await producer.publish(TOPICS.PAYMENT_FAILED, rideId, {
      rideId,
      riderId,
      reason: 'Gateway declined',
    });
    logger.warn('Payment failed', { rideId });
  }
}
