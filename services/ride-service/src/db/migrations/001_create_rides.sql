CREATE TABLE IF NOT EXISTS rides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id UUID NOT NULL,
  driver_id UUID,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested','accepted','started','completed','cancelled')),
  pickup_lat DOUBLE PRECISION NOT NULL,
  pickup_lng DOUBLE PRECISION NOT NULL,
  pickup_address TEXT,
  dropoff_lat DOUBLE PRECISION NOT NULL,
  dropoff_lng DOUBLE PRECISION NOT NULL,
  dropoff_address TEXT,
  fare_estimate NUMERIC(10,2),
  fare_actual NUMERIC(10,2),
  distance_km NUMERIC(8,3),
  duration_sec INTEGER,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancel_reason TEXT
);

CREATE INDEX IF NOT EXISTS rides_rider_id_idx ON rides(rider_id);
CREATE INDEX IF NOT EXISTS rides_driver_id_idx ON rides(driver_id);
CREATE INDEX IF NOT EXISTS rides_status_idx ON rides(status);
