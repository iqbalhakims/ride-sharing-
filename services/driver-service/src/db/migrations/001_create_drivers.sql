CREATE TABLE IF NOT EXISTS drivers (
  id UUID PRIMARY KEY,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  license_no TEXT UNIQUE NOT NULL DEFAULT '',
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_plate TEXT UNIQUE NOT NULL DEFAULT '',
  rating NUMERIC(3,2) DEFAULT 5.0,
  is_available BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
