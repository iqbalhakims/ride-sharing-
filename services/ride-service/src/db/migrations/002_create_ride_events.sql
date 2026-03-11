CREATE TABLE IF NOT EXISTS ride_events (
  id BIGSERIAL PRIMARY KEY,
  ride_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS ride_events_ride_id_idx ON ride_events(ride_id);
