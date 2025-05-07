// 회원 타입
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'provider' | 'client';
  createdAt: string;
  updatedAt: string;
}

// 리뷰 타입
export type Review = {
  id: string;
  platform: string;
  imageUrl: string;
  productName: string;
  optionName: string;
  price: number;
  shippingFee: number;
  seller: string;
  participants: number;
  period: string;
  createdAt: string;
  status: "pending" | "approved" | "rejected";
};

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