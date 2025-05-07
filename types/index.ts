// 회원 타입
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'provider' | 'client';
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

// 리뷰 타입
export type Review = {
  id: string;
  title: string;
  content: string;
  rating: number;
  status: "pending" | "approved" | "rejected";
  authorId: string;
  authorName: string;
  productId: string;
  productName: string;
  platform: string;
  imageUrl: string;
  optionName: string;
  price: number;
  shippingFee: number;
  seller: string;
  participants: number;
  period: string;
  createdAt: string;
  updatedAt: string;
  endDate?: string;
};

// 회원 이력 타입
export interface UserHistory {
  id: string;
  name: string;
  phone: string;
  email: string;
  eventAccount: string;
  reviewImage?: string;
  timestamp: string;
  eventName: string;
  status: 'pending' | 'completed' | 'canceled';
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