// 구좌 타입 정의
export interface Quota {
  id: string;
  quotaNumber: number;
  images: { file: File; preview: string; uploadedAt: string }[];
  receipts: { file: File; preview: string; uploadedAt: string }[];
  status?: 'unavailable' | 'available' | 'reserved' | 'complete';
  reserved?: boolean;
  reservation_user_id?: string | null;
  created_at?: string;
  submissionData?: SubmissionHistoryData | null; // 제출된 데이터
  opened_date?: string; // 오픈일시 (date 타입을 string으로 받음)
}

// 제출 이력 데이터 타입
export interface SubmissionHistoryData {
  id: string;
  name: string;
  phone: string;
  nickname: string;
  user_images: string[] | null;
  submitted_at: string;
  updated_at: string;
} 