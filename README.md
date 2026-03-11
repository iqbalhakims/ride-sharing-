# Ride Sharing Platform

A **microservices-based ride-sharing backend** (think Uber/Grab) built with Node.js, TypeScript, Kafka, PostgreSQL, and Redis. This project demonstrates distributed systems design, event-driven architecture, and containerized deployment.

> Intended as a **portfolio project for DevOps, SRE, and backend engineering roles**.

---

## Table of Contents

- [How to Run](#how-to-run)
- [Architecture Overview](#architecture-overview)
- [Services](#services)
- [How Services Talk to Each Other](#how-services-talk-to-each-other)
- [A Full Ride Lifecycle](#a-full-ride-lifecycle)
- [API Reference](#api-reference)
- [Project Structure](#project-structure)
- [Environment Variables](#environment-variables)
- [Tech Stack](#tech-stack)

---

## How to Run

### Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) — make sure it's running before anything else

### Start everything

```bash
docker-compose up --build
```

This will:
1. Start PostgreSQL, Redis, Kafka, and Zookeeper
2. Wait for infrastructure to be healthy
3. Build and start all 6 app services
4. Run database migrations automatically

First run takes a few minutes (downloads images, builds services).

### Verify it works

```bash
curl http://localhost:3001/health   # auth service
curl http://localhost:3003/health   # ride service
```

Open **Kafka UI** at [http://localhost:8080](http://localhost:8080) to see events flowing in real time.

### Stop everything

```bash
docker-compose down          # stop containers
docker-compose down -v       # stop + delete all data (DB, Redis)
```

### Run one service locally (for development)

```bash
# 1. Start only infrastructure
docker-compose up postgres redis zookeeper kafka

# 2. In another terminal, run the service you're working on
cd services/auth-service
yarn dev
```

---

## Architecture Overview

Instead of one big app, this project is split into **6 small services**. Each service owns one responsibility and communicates with others through **Kafka events** rather than direct HTTP calls.

```
┌──────────────────────────────────────────────┐
│              CLIENT (App / Postman)          │
└────────────────────┬─────────────────────────┘
                     │ HTTP
        ┌────────────┼────────────┐
        ▼            ▼            ▼
  auth-service  ride-service  driver-service
   (port 3001)  (port 3003)   (port 3002)

  matching-service  payment-service  notification-service
   (port 3004)       (port 3005)       (port 3006)

        │                │                │
        ▼                ▼                ▼
   PostgreSQL          Redis            Kafka
  (4 databases)    (driver GPS)    (event stream)
```

**Why Kafka instead of direct calls?**
If ride-service calls payment-service directly and payment-service is down, the payment is lost. With Kafka, the `ride.completed` event sits in the topic until payment-service comes back up and processes it. Services don't need to be online at the same time.

---

## Services

| Service | Port | What it does |
|---|---|---|
| `auth-service` | 3001 | User registration, login, JWT tokens |
| `driver-service` | 3002 | Driver profiles + real-time GPS location |
| `ride-service` | 3003 | Full ride lifecycle (request → accept → start → complete) |
| `matching-service` | 3004 | Finds the best nearby driver using Redis geospatial queries |
| `payment-service` | 3005 | Calculates fare and processes payment after a ride |
| `notification-service` | 3006 | Pushes real-time updates to users via WebSocket |

### Infrastructure (managed by Docker Compose)

| Service | Port | Purpose |
|---|---|---|
| PostgreSQL | 5432 | Relational DB — one instance, 4 separate databases |
| Redis | 6379 | Driver GPS coordinates and availability |
| Kafka | 9092 | Event streaming between services |
| Zookeeper | 2181 | Kafka coordination (you don't interact with this) |
| Kafka UI | 8080 | Web UI to inspect Kafka topics and messages |

---

## How Services Talk to Each Other

### Kafka Topics

A service **publishes** an event when something happens. Other services that care about it **consume** it and react.

| Topic | Published by | Consumed by |
|---|---|---|
| `user.registered` | auth-service | driver-service |
| `ride.requested` | ride-service | matching-service |
| `ride.accepted` | ride-service | notification-service |
| `ride.started` | ride-service | notification-service |
| `ride.completed` | ride-service | payment-service, notification-service |
| `ride.cancelled` | ride-service | notification-service |
| `match.found` | matching-service | ride-service, notification-service |
| `match.failed` | matching-service | notification-service |
| `payment.initiated` | payment-service | notification-service |
| `payment.success` | payment-service | ride-service, notification-service |
| `payment.failed` | payment-service | ride-service, notification-service |
| `driver.location.updated` | driver-service | notification-service |

### WebSocket (notification-service only)

The notification-service keeps a persistent WebSocket connection with each client. When any Kafka event arrives, it routes it to the right connected user instantly.

Connect: `ws://localhost:3006?token=<your_jwt_access_token>`

---

## A Full Ride Lifecycle

```
1. Rider → POST /rides (ride-service)
      Saves ride to DB (status: "requested")
      Publishes → ride.requested

2. matching-service consumes ride.requested
      Queries Redis for drivers within 5km (GEORADIUS)
      Scores by: 70% proximity + 30% driver rating
      Publishes → match.found (with driverId) OR match.failed

3. ride-service consumes match.found
      Pre-assigns driver to the ride

4. Driver → PATCH /rides/:id/accept
      Status: "accepted" — Publishes → ride.accepted

5. Driver → PATCH /rides/:id/start
      Status: "started" — Publishes → ride.started

6. Driver → PATCH /rides/:id/end
      Status: "completed" — Publishes → ride.completed (with distance + duration)

7. payment-service consumes ride.completed
      Calculates fare from distance/duration
      Publishes → payment.success or payment.failed

8. notification-service consumes ALL events above
      Pushes real-time WebSocket messages to rider and driver at each step
```

---

## API Reference

All protected routes require: `Authorization: Bearer <accessToken>`

### Auth Service — port 3001

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/auth/register` | Register a new user | No |
| POST | `/auth/login` | Login, returns access + refresh tokens | No |
| POST | `/auth/refresh` | Get new access token using refresh token | No |
| POST | `/auth/logout` | Revoke tokens | Yes |
| GET | `/auth/me` | Get current user info | Yes |

**Register:**
```json
{
  "email": "rider@example.com",
  "password": "secret123",
  "name": "John Doe",
  "role": "rider"
}
```

**Login response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

---

### Driver Service — port 3002

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/drivers/me` | Your driver profile | Yes (driver) |
| PATCH | `/drivers/me` | Update your profile | Yes (driver) |
| PATCH | `/drivers/location` | Update GPS coordinates | Yes (driver) |
| PATCH | `/drivers/availability` | Go online / offline | Yes (driver) |
| GET | `/drivers/:id` | Get driver by ID | Yes |

**Update location:**
```json
{ "latitude": 3.1390, "longitude": 101.6869 }
```

---

### Ride Service — port 3003

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/rides` | Request a new ride | Yes (rider) |
| GET | `/rides/history` | Your ride history | Yes |
| GET | `/rides/:id` | Get ride details | Yes |
| PATCH | `/rides/:id/accept` | Accept a ride | Yes (driver) |
| PATCH | `/rides/:id/start` | Start the trip | Yes (driver) |
| PATCH | `/rides/:id/end` | Complete the trip | Yes (driver) |
| PATCH | `/rides/:id/cancel` | Cancel a ride | Yes |

**Request a ride:**
```json
{
  "pickupLatitude": 3.1390,
  "pickupLongitude": 101.6869,
  "dropoffLatitude": 3.1478,
  "dropoffLongitude": 101.7093
}
```

Ride statuses: `requested` → `accepted` → `started` → `completed` (or `cancelled`)

---

### Payment Service — port 3005

| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/payments/:rideId` | Payment details for a ride | Yes |
| POST | `/payments/methods` | Add a payment method | Yes |
| GET | `/payments/methods` | List payment methods | Yes |
| DELETE | `/payments/methods/:id` | Remove a payment method | Yes |

---

### Notification Service — port 3006 (WebSocket)

```
ws://localhost:3006?token=<your_access_token>
```

Messages you receive:
```json
{ "type": "ride.accepted", "data": { "rideId": "abc123", "driverId": "xyz789" } }
{ "type": "payment.success", "data": { "rideId": "abc123", "amount": 12.50 } }
```

---

## Project Structure

```
ride-sharing/
├── docker-compose.yml          # Runs everything together
├── package.json                # Root — Yarn workspaces config
│
├── packages/
│   └── shared/                 # Code shared across all services
│       └── src/
│           ├── types/          # TypeScript types for all Kafka events
│           ├── utils/
│           │   ├── kafka.client.ts       # Kafka producer/consumer wrapper
│           │   └── auth.middleware.ts    # JWT auth middleware (reused in every service)
│           └── errors/                  # Shared error classes
│
├── services/
│   ├── auth-service/
│   ├── driver-service/
│   ├── ride-service/
│   ├── matching-service/
│   ├── payment-service/
│   └── notification-service/
│
└── scripts/
    └── init-db.sql             # Creates auth_db, driver_db, ride_db, payment_db
```

### Inside each service

All services follow the same layout:

```
src/
├── index.ts          # Entry point — connects to DB/Kafka, starts server
├── app.ts            # Express setup (middleware, routes)
├── config/env.ts     # Reads + validates environment variables
├── routes/           # URL → controller mapping
├── controllers/      # Parses request, calls service, sends response
├── services/         # Business logic
├── models/           # Database queries
├── db/
│   ├── connection.ts # DB connection setup
│   └── migrate.ts    # Schema migrations (run on startup)
└── kafka/
    └── consumers/    # One file per Kafka topic this service listens to
```

**Request flow:**
```
HTTP Request → routes → controllers → services → models → database
```

---

## Environment Variables

Set automatically by Docker Compose. For local development, create a `.env` in the service folder.

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the service listens on | `3001` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://ride:ride_secret@localhost:5432/auth_db` |
| `REDIS_URL` | Redis connection | `redis://localhost:6379` |
| `KAFKA_BROKERS` | Kafka broker addresses | `localhost:29092` |
| `JWT_SECRET` | Signs JWT tokens | `your-secret-key` |
| `JWT_EXPIRES_IN` | Access token lifetime | `15m` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d` |
| `MATCH_RADIUS_KM` | Driver search radius | `5` |
| `MATCH_TIMEOUT_SEC` | Matching timeout before failure | `30` |

> Default DB credentials (`ride` / `ride_secret`) and JWT secrets are for local development only. Change these for any real deployment.

---

## Tech Stack

| Category | Technology |
|---|---|
| Runtime | Node.js 20 |
| Language | TypeScript 5.4 |
| HTTP Framework | Express.js |
| Database queries | Knex.js |
| Relational DB | PostgreSQL 16 |
| Cache / Geo | Redis 7 |
| Message broker | Apache Kafka (KafkaJS client) |
| Auth | JWT, bcryptjs |
| Validation | Zod |
| Real-time | WebSockets (ws) |
| Logging | Winston |
| Containerization | Docker, Docker Compose |

---

## Future Plans

- Kubernetes deployment with HPA autoscaling
- Observability stack (Prometheus, Grafana, Loki, Tempo)
- GitOps with ArgoCD
- Load testing with k6
- Surge pricing algorithm
- Service mesh integration

---

## Author

**Iqbal** — DevOps / Platform Engineer
Focused on Kubernetes, infrastructure automation, and reliability engineering.
