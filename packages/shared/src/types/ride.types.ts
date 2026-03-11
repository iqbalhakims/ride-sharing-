export type RideStatus = 'requested' | 'accepted' | 'started' | 'completed' | 'cancelled';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Ride {
  id: string;
  rider_id: string;
  driver_id?: string;
  status: RideStatus;
  pickup_lat: number;
  pickup_lng: number;
  pickup_address?: string;
  dropoff_lat: number;
  dropoff_lng: number;
  dropoff_address?: string;
  fare_estimate?: number;
  fare_actual?: number;
  distance_km?: number;
  duration_sec?: number;
  requested_at: Date;
  accepted_at?: Date;
  started_at?: Date;
  completed_at?: Date;
  cancelled_at?: Date;
  cancel_reason?: string;
}
