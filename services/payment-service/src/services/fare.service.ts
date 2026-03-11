const BASE_FARE = 2.5;
const PER_KM_RATE = 1.2;
const PER_MIN_RATE = 0.18;

export function calculateFare(
  distanceKm: number,
  durationSec: number,
  surgeMultiplier = 1.0,
): number {
  const durationMin = durationSec / 60;
  const fare = (BASE_FARE + distanceKm * PER_KM_RATE + durationMin * PER_MIN_RATE) * surgeMultiplier;
  return Math.round(fare * 100) / 100;
}
