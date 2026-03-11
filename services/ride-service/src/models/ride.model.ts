import { db } from '../db/connection';
import { Ride } from '@ride-sharing/shared';

export async function findById(id: string): Promise<Ride | undefined> {
  return db('rides').where({ id }).first();
}

export async function create(data: {
  rider_id: string;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address?: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address?: string;
}): Promise<Ride> {
  const [ride] = await db('rides').insert(data).returning('*');
  return ride;
}

export async function updateStatus(
  id: string,
  status: string,
  extra: Record<string, unknown> = {},
): Promise<Ride> {
  const [ride] = await db('rides').where({ id }).update({ status, ...extra }).returning('*');
  return ride;
}

export async function findByUser(
  userId: string,
  role: 'rider' | 'driver',
  page = 1,
  limit = 20,
): Promise<{ rides: Ride[]; total: number }> {
  const column = role === 'rider' ? 'rider_id' : 'driver_id';
  const [{ count }] = await db('rides').where({ [column]: userId }).count('id as count');
  const rides = await db('rides')
    .where({ [column]: userId })
    .orderBy('requested_at', 'desc')
    .limit(limit)
    .offset((page - 1) * limit);
  return { rides, total: parseInt(count as string, 10) };
}

export async function logEvent(rideId: string, eventType: string, payload: unknown): Promise<void> {
  await db('ride_events').insert({ ride_id: rideId, event_type: eventType, payload });
}
