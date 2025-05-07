// 회원 타입
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'provider' | 'client';
  createdAt: string;
  updatedAt: string;
}

// 리뷰 타입
export interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  status: 'pending' | 'approved' | 'rejected';
  authorId: string;
  authorName: string;
  productId: string;
  productName: string;
  createdAt: string;
  updatedAt: string;
}

// 회원 이력 타입
export interface UserHistory {
  id: string;
  userId: string;
  userName: string;
  action: string;
  details: string;
  timestamp: string;
}

// 참여 이력 타입
export interface Participation {
  id: string;
  userId: string;
  reviewId: string;
  reviewTitle: string;
  reward: string;
  status: 'pending' | 'completed' | 'canceled';
  createdAt: string;
} 