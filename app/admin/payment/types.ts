// 정산 데이터 타입 정의
export interface Payment {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  content: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  createdAt: string;
  processedAt?: string;
  note?: string;
}

export interface PaymentFilters {
  searchTerm: string;
  searchCategory: string;
  paymentStatus: string;
  startDate: string;
  endDate: string;
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

export interface PaymentUpdateRequest {
  paymentIds: string[];
  status: 'completed' | 'rejected';
  note?: string;
  amount?: number;
  reason?: string;
}

export interface PaymentItem {
  id: string;
  name: string;
  bank: string;
  accountNumber: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'rejected';
  createdAt: string;
  updatedAt: string;
  reason?: string;
}

export interface PaymentStats {
  totalPending: number;
  totalProcessing: number;
  totalCompleted: number;
  totalRejected: number;
  totalAmount: number;
} 