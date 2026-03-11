CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ride_id UUID UNIQUE NOT NULL,
  rider_id UUID NOT NULL,
  driver_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','success','failed','refunded')),
  gateway_ref TEXT,
  method TEXT DEFAULT 'card',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS payments_rider_id_idx ON payments(rider_id);
CREATE INDEX IF NOT EXISTS payments_ride_id_idx ON payments(ride_id);
