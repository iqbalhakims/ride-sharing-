import { Coordinates } from './ride.types';

export const TOPICS = {
  USER_REGISTERED: 'user.registered',
  RIDE_REQUESTED: 'ride.requested',
  RIDE_ACCEPTED: 'ride.accepted',
  RIDE_STARTED: 'ride.started',
  RIDE_COMPLETED: 'ride.completed',
  RIDE_CANCELLED: 'ride.cancelled',
  MATCH_FOUND: 'match.found',
  MATCH_FAILED: 'match.failed',
  PAYMENT_INITIATED: 'payment.initiated',
  PAYMENT_SUCCESS: 'payment.success',
  PAYMENT_FAILED: 'payment.failed',
  DRIVER_LOCATION_UPDATED: 'driver.location.updated',
} as const;

export type TopicName = (typeof TOPICS)[keyof typeof TOPICS];

export interface UserRegisteredEvent {
  userId: string;
  email: string;
  role: string;
}

export interface RideRequestedEvent {
  rideId: string;
  riderId: string;
  pickup: Coordinates;
  dropoff: Coordinates;
  pickupAddress?: string;
  dropoffAddress?: string;
}

export interface RideAcceptedEvent {
  rideId: string;
  driverId: string;
  riderId: string;
}

export interface RideStartedEvent {
  rideId: string;
  driverId: string;
  riderId: string;
  timestamp: string;
}

export interface RideCompletedEvent {
  rideId: string;
  riderId: string;
  driverId: string;
  fare: number;
  distanceKm: number;
  durationSec: number;
}

export interface RideCancelledEvent {
  rideId: string;
  riderId: string;
  cancelledBy: string;
  reason?: string;
}

export interface MatchFoundEvent {
  rideId: string;
  driverId: string;
  distanceKm: number;
}

export interface MatchFailedEvent {
  rideId: string;
  reason: string;
}

export interface PaymentInitiatedEvent {
  rideId: string;
  riderId: string;
  amount: number;
}

export interface PaymentSuccessEvent {
  rideId: string;
  riderId: string;
  transactionId: string;
  amount: number;
}

export interface PaymentFailedEvent {
  rideId: string;
  riderId: string;
  reason: string;
}

export interface DriverLocationUpdatedEvent {
  driverId: string;
  lat: number;
  lng: number;
  heading?: number;
}
