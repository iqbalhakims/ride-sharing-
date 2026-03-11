export interface Driver {
  id: string;
  first_name: string;
  last_name: string;
  license_no: string;
  vehicle_make?: string;
  vehicle_model?: string;
  vehicle_plate: string;
  rating: number;
  is_available: boolean;
  is_verified: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DriverLocation {
  id: string;
  driver_id: string;
  lat: number;
  lng: number;
  heading?: number;
  recorded_at: Date;
}
