import { geoClient } from '../redis/geo.client';
import { config } from '../config/env';

interface MatchCandidate {
  driverId: string;
  distanceKm: number;
  rating: number;
  score: number;
}

export async function findMatch(
  _rideId: string,
  pickup: { lat: number; lng: number },
): Promise<{ driverId: string; distanceKm: number } | null> {
  const nearby = await geoClient.findNearbyDrivers(pickup.lat, pickup.lng, config.matchRadiusKm);
  if (nearby.length === 0) return null;

  const candidates: MatchCandidate[] = [];

  for (const { driverId, distanceKm } of nearby) {
    const available = await geoClient.isDriverAvailable(driverId);
    if (!available) continue;

    const rating = await geoClient.getDriverRating(driverId);
    // Normalize distance: closer is better (invert and normalize to 0-1 over radius)
    const distanceScore = 1 - distanceKm / config.matchRadiusKm;
    // Normalize rating to 0-1
    const ratingScore = rating / 5.0;
    const score = distanceScore * 0.7 + ratingScore * 0.3;

    candidates.push({ driverId, distanceKm, rating, score });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => b.score - a.score);
  const best = candidates[0];
  return { driverId: best.driverId, distanceKm: best.distanceKm };
}
