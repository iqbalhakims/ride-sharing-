CREATE TABLE IF NOT EXISTS driver_locations (
  id BIGSERIAL PRIMARY KEY,
  driver_id UUID NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  heading SMALLINT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS driver_locations_driver_id_idx ON driver_locations(driver_id);
CREATE INDEX IF NOT EXISTS driver_locations_recorded_at_idx ON driver_locations(recorded_at DESC);
