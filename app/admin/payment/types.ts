import { DateRange } from "react-day-picker";

// 정산 데이터 타입 정의
export interface Payment {
  id: string;
  // 사용자 정보 (profiles 테이블에서 조인)
  name: string;
  phone: string;
  nickname: string;
  user_bank_name?: string;
  user_account_number?: string;
  
  // 리뷰 정보 (reviews 테이블에서 조인)
  review_title?: string;
  platform?: string;
  
  // 정산 정보 (slot_submissions 테이블)
  payment_amount: number;
  payment_status: 'pending' | 'processing' | 'completed' | 'failed';
  payment_created_at: string;
  payment_processed_at?: string;
  payment_note?: string;
  payment_method?: 'bank_transfer' | 'digital_wallet' | 'other';
  reason?: string;
  
  // 관리자 정보
  admin_id?: string;
  admin_name?: string;
  
  // 기존 호환성을 위한 필드들 (PaymentItem 호환)
  userId?: string;
  userName?: string;
  amount?: number;
  content?: string;
  status?: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  createdAt?: string;
  updatedAt?: string;
  processedAt?: string;
  note?: string;
  bank?: string;
  accountNumber?: string;
}

export interface PaymentFilters {
  searchTerm: string;
  searchCategory: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
}

export interface PendingPaymentFilters {
  searchTerm: string;
  searchCategory: string;
  dateRange: DateRange | undefined;
}

export interface ProcessedPaymentFilters {
  searchTerm: string;
  searchCategory: string;
  statusFilter: string;
  dateRange: DateRange | undefined;
}

export interface PaymentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaymentResponse {
  pending: {
    data: PaymentItem[];
    totalPages: number;
    totalCount: number;
  };
  processing: {
    data: PaymentItem[];
    totalPages: number;
    totalCount: number;
  };
  processed: {
    data: PaymentItem[];
    totalPages: number;
    totalCount: number;
  };
}

export interface PaymentListResponse {
  data: Payment[];
  pagination: PaymentPagination;
}

export interface PaymentUpdateRequest {
  paymentIds: string[];
  status: 'completed' | 'rejected';
  note?: string;
  amount?: number;
  reason?: string;
}

// PaymentItem은 Payment 타입으로 통합됨
export type PaymentItem = Payment;

export interface PaymentStats {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalRejected: number;
  totalAmount: number;
} 