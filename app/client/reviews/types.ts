export interface Review {
  id: string | number;
  title: string;
  content: string;
  rating: number;
  status: string;
  author_id?: string;
  author_name?: string;
  product_id?: string;
  product_name: string;
  platform: string;
  image_url?: string;
  option_name?: string;
  price?: number;
  shipping_fee?: number;
  seller?: string;
  participants?: number;
  start_date: string;
  end_date: string;
  period?: string;
  product_url?: string;
  store_url?: string;
  store_name?: string;
  created_at: string;
  updated_at?: string;
  slots?: Slot[];
  daily_count: number;
  review_fee: number;
  reservation_amount?: number;
  purchase_cost?: number;
  search_keyword?: string;
}

export interface Slot {
  id: string;
  review_id: string;
  slot_number: number;
  reservation_date: string;
  reservation_user_id: string | null;
  reservation_updated_at: string | null;
  status: 'available' | 'reserved' | 'completed';
  images?: string[];
  receipts?: string[];
  created_at: string;
  images_updated_at?: string;
  receipts_updated_at?: string;
}

export interface SlotSummary {
  total: number;
  available: number;
  reserved: number;
  date: string;
}

export interface SlotApiResponse {
  review: {
    id: string;
    platform: string;
    name: string;
    daily_count: number;
    start_date: string;
    end_date: string;
  };
  slots: Slot[];
  summary: SlotSummary;
}

export interface ReservationRequest {
  slotId: string;
  userId: string;
  reservationDate: string;
} 