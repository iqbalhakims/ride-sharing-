/**
 * k6 Load Test - 500 Concurrent Users Simulation
 *
 * Simulates real ride-sharing user behavior:
 * - Riders: login → request ride → check status → view history
 * - Drivers: login → accept ride → start ride → end ride
 *
 * Run: k6 run scripts/load-test.js
 * Install: brew install k6
 */

import http from 'k6/http';
import { sleep, check, group } from 'k6';
import { SharedArray } from 'k6/data';
import { Counter, Rate, Trend } from 'k6/metrics';

// ─── Custom Metrics ────────────────────────────────────────────────────────
const rideRequests   = new Counter('ride_requests_total');
const rideAccepted   = new Counter('ride_accepted_total');
const loginErrors    = new Rate('login_error_rate');
const rideReqErrors  = new Rate('ride_request_error_rate');
const rideDuration   = new Trend('ride_request_duration', true);

// ─── Config ────────────────────────────────────────────────────────────────
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3003';
const AUTH_URL = __ENV.AUTH_URL || 'http://localhost:3001';

// ─── Test Scenarios ────────────────────────────────────────────────────────
export const options = {
  scenarios: {
    // 400 riders booking rides simultaneously
    riders: {
      executor: 'constant-vus',
      vus: 400,
      duration: '2m',
      exec: 'riderFlow',
    },
    // 100 drivers accepting rides simultaneously
    drivers: {
      executor: 'constant-vus',
      vus: 100,
      duration: '2m',
      exec: 'driverFlow',
      startTime: '10s', // drivers start slightly after riders
    },
  },
  thresholds: {
    http_req_duration:       ['p(95)<2000'],  // 95% of requests under 2s
    http_req_failed:         ['rate<0.05'],   // less than 5% failure
    login_error_rate:        ['rate<0.01'],   // less than 1% login failures
    ride_request_error_rate: ['rate<0.05'],   // less than 5% ride failures
  },
};

const HEADERS = { 'Content-Type': 'application/json' };

// ─── Helper ────────────────────────────────────────────────────────────────
function login(email, password) {
  const res = http.post(
    `${AUTH_URL}/auth/login`,
    JSON.stringify({ email, password }),
    { headers: HEADERS }
  );

  const ok = check(res, { 'login 200': (r) => r.status === 200 });
  loginErrors.add(!ok);

  if (!ok) return null;
  return res.json('token');
}

function authHeaders(token) {
  return { headers: { ...HEADERS, Authorization: `Bearer ${token}` } };
}

// Random pickup/dropoff locations
const LOCATIONS = [
  { lat: 3.1390, lng: 101.6869, name: 'KLCC' },
  { lat: 3.1478, lng: 101.7117, name: 'Ampang' },
  { lat: 3.0731, lng: 101.5994, name: 'Subang' },
  { lat: 3.1569, lng: 101.7123, name: 'Cheras' },
  { lat: 3.2053, lng: 101.7136, name: 'Wangsa Maju' },
];

function randomLocation() {
  return LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)];
}

// ─── Rider Flow ────────────────────────────────────────────────────────────
export function riderFlow() {
  const userId = __VU; // virtual user ID (1–400)
  const email    = `rider${userId}@test.com`;
  const password = 'password123';

  group('Rider: Login', () => {
    const token = login(email, password);
    if (!token) {
      sleep(2);
      return;
    }

    group('Rider: Request Ride', () => {
      const pickup  = randomLocation();
      const dropoff = randomLocation();

      const start = Date.now();
      const res = http.post(
        `${BASE_URL}/rides`,
        JSON.stringify({
          pickupLocation:  { lat: pickup.lat,  lng: pickup.lng,  address: pickup.name },
          dropoffLocation: { lat: dropoff.lat, lng: dropoff.lng, address: dropoff.name },
        }),
        authHeaders(token)
      );
      rideDuration.add(Date.now() - start);
      rideRequests.add(1);

      const ok = check(res, {
        'ride requested': (r) => r.status === 201,
      });
      rideReqErrors.add(!ok);

      if (ok) {
        const rideId = res.json('id');

        sleep(3); // wait a bit, then check status

        group('Rider: Check Ride Status', () => {
          const statusRes = http.get(
            `${BASE_URL}/rides/${rideId}`,
            authHeaders(token)
          );
          check(statusRes, { 'status check 200': (r) => r.status === 200 });
        });
      }
    });

    sleep(2);

    group('Rider: View History', () => {
      const res = http.get(`${BASE_URL}/rides/history`, authHeaders(token));
      check(res, { 'history 200': (r) => r.status === 200 });
    });
  });

  sleep(1);
}

// ─── Driver Flow ───────────────────────────────────────────────────────────
export function driverFlow() {
  const userId = __VU + 1000; // offset to avoid collision with rider IDs
  const email    = `driver${userId}@test.com`;
  const password = 'password123';

  group('Driver: Login', () => {
    const token = login(email, password);
    if (!token) {
      sleep(2);
      return;
    }

    // Drivers poll for a ride to accept (simulate real-world behavior)
    sleep(5);

    group('Driver: Accept Ride', () => {
      // In a real test you'd have a known rideId — here we use a placeholder
      // Replace with actual ride ID from a setup stage or shared data
      const rideId = `ride-${Math.floor(Math.random() * 400) + 1}`;

      const res = http.patch(
        `${BASE_URL}/rides/${rideId}/accept`,
        null,
        authHeaders(token)
      );

      const ok = check(res, { 'ride accepted': (r) => r.status === 200 });
      if (ok) rideAccepted.add(1);

      if (ok) {
        sleep(2);

        group('Driver: Start Ride', () => {
          const startRes = http.patch(
            `${BASE_URL}/rides/${rideId}/start`,
            null,
            authHeaders(token)
          );
          check(startRes, { 'ride started': (r) => r.status === 200 });
        });

        sleep(5); // simulate ride in progress

        group('Driver: End Ride', () => {
          const endRes = http.patch(
            `${BASE_URL}/rides/${rideId}/end`,
            null,
            authHeaders(token)
          );
          check(endRes, { 'ride ended': (r) => r.status === 200 });
        });
      }
    });
  });

  sleep(1);
}
