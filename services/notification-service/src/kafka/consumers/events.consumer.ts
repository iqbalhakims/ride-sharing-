import { KafkaConsumer, TOPICS, logger } from '@ride-sharing/shared';
import { registry } from '../../websocket/registry';
import { config } from '../../config/env';

const ALL_TOPICS = [
  TOPICS.RIDE_REQUESTED,
  TOPICS.RIDE_ACCEPTED,
  TOPICS.RIDE_STARTED,
  TOPICS.RIDE_COMPLETED,
  TOPICS.RIDE_CANCELLED,
  TOPICS.MATCH_FOUND,
  TOPICS.MATCH_FAILED,
  TOPICS.PAYMENT_INITIATED,
  TOPICS.PAYMENT_SUCCESS,
  TOPICS.PAYMENT_FAILED,
  TOPICS.DRIVER_LOCATION_UPDATED,
];

export async function startEventsConsumer(): Promise<KafkaConsumer> {
  const consumer = new KafkaConsumer(
    config.kafkaBrokers,
    'notification-service',
    'notification-service-events',
  );
  await consumer.connect();

  await consumer.subscribe(ALL_TOPICS, async (topic, _msg, payload) => {
    const p = payload as Record<string, string>;
    const event = { type: topic.toUpperCase().replace(/\./g, '_'), payload };

    switch (topic) {
      case TOPICS.RIDE_REQUESTED:
        registry.send(p.riderId, event);
        break;

      case TOPICS.RIDE_ACCEPTED:
      case TOPICS.RIDE_STARTED:
      case TOPICS.RIDE_COMPLETED:
      case TOPICS.RIDE_CANCELLED:
        registry.broadcast([p.riderId, p.driverId].filter(Boolean), event);
        break;

      case TOPICS.MATCH_FOUND:
      case TOPICS.MATCH_FAILED:
        // rideId-keyed; notify rider if we have their id
        if (p.riderId) registry.send(p.riderId, event);
        break;

      case TOPICS.PAYMENT_INITIATED:
      case TOPICS.PAYMENT_SUCCESS:
      case TOPICS.PAYMENT_FAILED:
        registry.send(p.riderId, event);
        break;

      case TOPICS.DRIVER_LOCATION_UPDATED:
        // Location updates are high frequency; only log at debug level
        logger.debug('Driver location event', { driverId: p.driverId });
        break;

      default:
        logger.warn('Unhandled notification topic', { topic });
    }
  });

  return consumer;
}
