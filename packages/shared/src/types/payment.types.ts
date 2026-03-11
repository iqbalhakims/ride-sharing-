export type PaymentStatus = 'pending' | 'success' | 'failed' | 'refunded';

export interface Payment {
  id: string;
  ride_id: string;
  rider_id: string;
  driver_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  gateway_ref?: string;
  method: string;
  created_at: Date;
  updated_at: Date;
}
