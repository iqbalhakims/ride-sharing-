export { AppError } from './errors/AppError';

export type { UserRole, User, JwtPayload } from './types/user.types';
export type { RideStatus, Coordinates, Ride } from './types/ride.types';
export type { Driver, DriverLocation } from './types/driver.types';
export type { PaymentStatus, Payment } from './types/payment.types';
export { TOPICS } from './types/kafka.events';
export type {
  TopicName,
  UserRegisteredEvent,
  RideRequestedEvent,
  RideAcceptedEvent,
  RideStartedEvent,
  RideCompletedEvent,
  RideCancelledEvent,
  MatchFoundEvent,
  MatchFailedEvent,
  PaymentInitiatedEvent,
  PaymentSuccessEvent,
  PaymentFailedEvent,
  DriverLocationUpdatedEvent,
} from './types/kafka.events';

export { default as logger } from './utils/logger';
export { signToken, verifyToken } from './utils/jwt';
export { KafkaProducer, KafkaConsumer } from './utils/kafka.client';

export { authMiddleware, requireRole } from './middleware/auth.middleware';
export { errorMiddleware } from './middleware/error.middleware';
