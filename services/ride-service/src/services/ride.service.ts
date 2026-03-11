import { KafkaProducer, TOPICS, AppError, logger } from '@ride-sharing/shared';
import * as rideModel from '../models/ride.model';

let producer: KafkaProducer;

export function setProducer(p: KafkaProducer): void {
  producer = p;
}

export async function requestRide(
  riderId: string,
  pickup: { lat: number; lng: number },
  dropoff: { lat: number; lng: number },
  pickupAddress?: string,
  dropoffAddress?: string,
) {
  const ride = await rideModel.create({
    rider_id: riderId,
    pickup_lat: pickup.lat,
    pickup_lng: pickup.lng,
    pickup_address: pickupAddress,
    dropoff_lat: dropoff.lat,
    dropoff_lng: dropoff.lng,
    dropoff_address: dropoffAddress,
  });

  await producer.publish(TOPICS.RIDE_REQUESTED, ride.id, {
    rideId: ride.id,
    riderId,
    pickup,
    dropoff,
    pickupAddress,
    dropoffAddress,
  });

  await rideModel.logEvent(ride.id, 'REQUESTED', { riderId });
  logger.info('Ride requested', { rideId: ride.id, riderId });
  return ride;
}

export async function acceptRide(rideId: string, driverId: string) {
  const ride = await rideModel.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404);
  if (ride.status !== 'requested') throw new AppError(`Cannot accept a ride in status: ${ride.status}`, 409);

  const updated = await rideModel.updateStatus(rideId, 'accepted', {
    driver_id: driverId,
    accepted_at: new Date(),
  });

  await producer.publish(TOPICS.RIDE_ACCEPTED, rideId, { rideId, driverId, riderId: ride.rider_id });
  await rideModel.logEvent(rideId, 'ACCEPTED', { driverId });
  return updated;
}

export async function startRide(rideId: string, driverId: string) {
  const ride = await rideModel.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404);
  if (ride.status !== 'accepted') throw new AppError(`Cannot start a ride in status: ${ride.status}`, 409);
  if (ride.driver_id !== driverId) throw new AppError('Not your ride', 403);

  const updated = await rideModel.updateStatus(rideId, 'started', { started_at: new Date() });

  await producer.publish(TOPICS.RIDE_STARTED, rideId, {
    rideId,
    driverId,
    riderId: ride.rider_id,
    timestamp: new Date().toISOString(),
  });
  await rideModel.logEvent(rideId, 'STARTED', { driverId });
  return updated;
}

export async function endRide(
  rideId: string,
  driverId: string,
  distanceKm: number,
  durationSec: number,
) {
  const ride = await rideModel.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404);
  if (ride.status !== 'started') throw new AppError(`Cannot end a ride in status: ${ride.status}`, 409);
  if (ride.driver_id !== driverId) throw new AppError('Not your ride', 403);

  const updated = await rideModel.updateStatus(rideId, 'completed', {
    completed_at: new Date(),
    distance_km: distanceKm,
    duration_sec: durationSec,
  });

  await producer.publish(TOPICS.RIDE_COMPLETED, rideId, {
    rideId,
    riderId: ride.rider_id,
    driverId,
    distanceKm,
    durationSec,
  });
  await rideModel.logEvent(rideId, 'COMPLETED', { driverId, distanceKm, durationSec });
  return updated;
}

export async function cancelRide(rideId: string, userId: string, reason?: string) {
  const ride = await rideModel.findById(rideId);
  if (!ride) throw new AppError('Ride not found', 404);
  if (['completed', 'cancelled'].includes(ride.status)) {
    throw new AppError(`Cannot cancel a ride in status: ${ride.status}`, 409);
  }

  const updated = await rideModel.updateStatus(rideId, 'cancelled', {
    cancelled_at: new Date(),
    cancel_reason: reason,
  });

  await producer.publish(TOPICS.RIDE_CANCELLED, rideId, {
    rideId,
    riderId: ride.rider_id,
    cancelledBy: userId,
    reason,
  });
  await rideModel.logEvent(rideId, 'CANCELLED', { cancelledBy: userId, reason });
  return updated;
}
