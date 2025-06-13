"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, Eye, Pencil, X } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import SlotManagementDialog from "./components/SlotManagementDialog";
import ProfileValidationDialog from "./components/ProfileValidationDialog";
import { Quota, SubmissionHistoryData } from "./types";

// 일일 제한 상태 타입 추가
interface DailyLimitStatus {
  platform: string;
  count: number;
  limit: number;
}

export default function ReviewDetailPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    platform: "",
    productName: "",
    optionName: "",
    price: "",
    shippingFee: "",
    seller: "",
    participants: "",
    status: "approved",
    startDate: "",
    endDate: "",
    title: "",
    content: "",
    rating: "3",
    productUrl: "",
    storeName: "",
    storeUrl: "",
    reviewFee: "",
    reservationAmount: "",
    dailyCount: "",
    searchKeyword: "",
    purchaseCost: "",
    reviewGuide: "",
  });
  const [selectedProviders, setSelectedProviders] = useState<any[]>([]);

  // 구좌 관련 상태
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [userReservationCount, setUserReservationCount] = useState<number>(0);
  const [totalUserReservations, setTotalUserReservations] = useState<number>(0);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Quota | null>(null);
  const [isReservingSlot, setIsReservingSlot] = useState(false);
  const [isSlotManagementOpen, setIsSlotManagementOpen] = useState(false);
  const [managementSlot, setManagementSlot] = useState<Quota | null>(null);
  const [isCancellingSlot, setIsCancellingSlot] = useState(false);
  const [cancellingSlotId, setCancellingSlotId] = useState<string | null>(null);

  // 프로필 검증 관련 상태 추가
  const [isProfileValidationOpen, setIsProfileValidationOpen] = useState(false);
  const [missingProfileFields, setMissingProfileFields] = useState<string[]>([]);

  // 일일 제한 상태 추가
  const [dailyLimitStatus, setDailyLimitStatus] = useState<DailyLimitStatus | null>(null);

  // 모든 제출 데이터를 한 번에 가져오는 함수
  const fetchAllSubmissionData = async (): Promise<Record<string, SubmissionHistoryData>> => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/submissions`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        return result.data;
      }
      return {};
    } catch (error) {
      return {};
    }
  };

  // 일일 제한 상태를 체크하는 함수 (영수증리뷰, 구글만)
  const checkDailyLimit = async (platform?: string): Promise<void> => {
    try {
      // 영수증리뷰나 구글 플랫폼인 경우만 체크
      const checkPlatform = platform || formData.platform;
      if (checkPlatform === "영수증리뷰" || checkPlatform === "구글") {
        const response = await fetch(`/api/reviews/${reviewId}/daily-limit`);
        const result = await response.json();
        
        if (response.ok && result.data) {
          setDailyLimitStatus(result.data);
        }
      } else {
        setDailyLimitStatus(null);
      }
    } catch (error) {
      // 에러가 발생해도 조용히 처리
      setDailyLimitStatus(null);
    }
  };

  // 리뷰 데이터 로드
  useEffect(() => {
    const loadReviewData = async () => {
      if (!reviewId) return;

      try {
        setIsLoading(true);
        
        // 먼저 현재 사용자 정보 로드
        const userId = await loadCurrentUser();

        const response = await fetch(`/api/reviews/${reviewId}`);
        const result = await response.json();

        if (!response.ok) {
          toast({
            title: "데이터 로드 실패",
            description: result.error || "리뷰 데이터를 불러올 수 없습니다.",
            variant: "destructive",
          });
          return;
        }

        const review = result.review;

        // 일일 제한 상태 체크 (플랫폼 정보와 함께)
        await checkDailyLimit(review.platform);

        // 폼 데이터 설정
        setFormData({
          platform: review.platform || "",
          productName: review.product_name || "",
          optionName: review.option_name || "",
          price: review.price ? review.price.toString() : "",
          shippingFee: review.shipping_fee
            ? review.shipping_fee.toString()
            : "",
          seller: review.seller || "",
          participants: review.participants
            ? review.participants.toString()
            : "",
          status: review.status || "approved",
          startDate: review.start_date
            ? new Date(review.start_date).toISOString().slice(0, 16)
            : "",
          endDate: review.end_date
            ? new Date(review.end_date).toISOString().slice(0, 16)
            : "",
          title: review.title || "",
          content: review.content || "",
          rating: review.rating ? review.rating.toString() : "3",
          productUrl: review.product_url || "",
          storeName: review.store_name || "",
          storeUrl: review.store_url || "",
          reviewFee: review.review_fee ? review.review_fee.toString() : "",
          reservationAmount: review.reservation_amount
            ? review.reservation_amount.toString()
            : "",
          dailyCount: review.daily_count ? review.daily_count.toString() : "",
          searchKeyword: review.search_keyword || "",
          purchaseCost: review.purchase_cost
            ? review.purchase_cost.toString()
            : "",
          reviewGuide: review.guide || "",
        });

        // 광고주 설정
        const providers: any[] = [];
        if (review.provider1) {
          providers.push({
            id: review.provider1,
            full_name: review.provider1_name || "광고주1",
            email: "",
          });
        }
        if (review.provider2) {
          providers.push({
            id: review.provider2,
            full_name: review.provider2_name || "광고주2",
            email: "",
          });
        }
        if (review.provider3) {
          providers.push({
            id: review.provider3,
            full_name: review.provider3_name || "광고주3",
            email: "",
          });
        }
        setSelectedProviders(providers);

        // 구좌 정보 설정
        if (review.slots && review.slots.length > 0) {
          console.log("받아온 slots 데이터:", review.slots);
          
          // 모든 제출 데이터를 한 번에 가져오기
          const allSubmissionData = await fetchAllSubmissionData();
          
          // 기존 구좌 데이터를 새로운 형식으로 변환
          const loadedQuotas: Quota[] = review.slots.map((slot: any) => {
            console.log(`슬롯 ${slot.slot_number} - 상태: ${slot.status}`);
            
            // 해당 슬롯의 제출 데이터 찾기
            const submissionData = allSubmissionData[slot.id] || null;

            const quotaData = {
              id: slot.id,
              quotaNumber: slot.slot_number,
              images: (slot.images || []).map((url: string, index: number) => ({
                file: new File([], `existing-image-${index}`, {
                  type: "image/jpeg",
                }),
                preview: url,
                uploadedAt: slot.images_updated_at
                  ? new Date(slot.images_updated_at).toLocaleString("ko-KR")
                  : new Date(slot.created_at).toLocaleString("ko-KR"),
              })),
              receipts: (slot.receipts || []).map(
                (url: string, index: number) => ({
                  file: new File([], `existing-receipt-${index}`, {
                    type: "image/jpeg",
                  }),
                  preview: url,
                  uploadedAt: slot.receipts_updated_at
                    ? new Date(slot.receipts_updated_at).toLocaleString("ko-KR")
                    : new Date(slot.created_at).toLocaleString("ko-KR"),
                })
              ),
              status: slot.status || "unavailable",
              reserved: !!slot.reservation_user_id,
              reservation_user_id: slot.reservation_user_id,
              created_at: slot.created_at,
              opened_date: slot.opened_date,
              submissionData,
            };
            
            console.log(`구좌 ${quotaData.quotaNumber} 최종 상태: ${quotaData.status}`);
            return quotaData;
          });

          console.log("최종 구좌 데이터:", loadedQuotas);
          setQuotas(loadedQuotas);
          
          // 사용자 예약 수 계산
          if (userId) {
            // 'reserved'와 'complete' 상태인 구좌 모두 카운트하도록 수정
            const userReservations = loadedQuotas.filter(quota => 
              quota.reservation_user_id === userId && 
              (quota.status === 'reserved' || quota.status === 'complete')
            );
            setUserReservationCount(userReservations.length);
            
            // 디버깅을 위한 로깅
            console.log("현재 리뷰에서 나의 예약 수(reserved+complete):", userReservations.length);
            console.log("전체 구좌 중 나의 구좌:", loadedQuotas.filter(q => q.reservation_user_id === userId).map(q => ({
              id: q.id,
              number: q.quotaNumber,
              status: q.status
            })));
          }
        }
      } catch (error) {
        toast({
          title: "데이터 로드 실패",
          description: "리뷰 데이터를 불러오는 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadReviewData();
  }, [reviewId]);

  // 현재 로그인한 사용자 정보 가져오기
  const loadCurrentUser = async (): Promise<string | null> => {
    try {
      const response = await fetch("/api/user");
      const data = await response.json();

      if (response.ok && data.user) {
        setCurrentUserId(data.user.id);
        
        // 전체 예약 현황도 함께 로드
        await loadUserTotalReservations();
        
        return data.user.id;
      }
      return null;
    } catch (error) {
      // 사용자 정보 로드 실패 시 조용히 처리
      return null;
    }
  };

  // 사용자의 전체 예약 현황 로드
  const loadUserTotalReservations = async (): Promise<void> => {
    try {
      const response = await fetch("/api/user/reservations");
      const result = await response.json();

      if (response.ok && result.data) {
        setTotalUserReservations(result.data.totalReservations);
        console.log("전체 예약 현황:", result.data.totalReservations);
        if (result.data.reservations && result.data.reservations.length > 0) {
          console.log("예약 상세 목록:", result.data.reservations);
        }
      }
    } catch (error) {
      // 전체 예약 현황 로드 실패 시 조용히 처리
      setTotalUserReservations(0);
    }
  };

  // 리뷰 신청 완료 알림톡 발송
  const sendReviewApplicationAlimtalk = async (): Promise<void> => {
    try {
      // 현재 사용자 정보 가져오기
      const userResponse = await fetch("/api/user");
      const userData = await userResponse.json();

      if (!userResponse.ok || !userData.user || !userData.user.phone) {
        console.log("사용자 전화번호 정보를 가져올 수 없습니다.");
        return;
      }

      const phoneNumber = userData.user.phone;
      const subject = "알림톡톡";
      const message = `신청하신 리뷰의 마감 기한이 오늘까지입니다!
소중한 리뷰, 꼭 부탁드립니다

이미지 업로드 시
닉네임이 보이도록 캡처하는 것 잊지 마세요!

▼지금 바로 리뷰 남기러 가기`;

      // 알림톡 발송 API 호출
      const alimtalkResponse = await fetch("/api/send-alimtalk", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phone_number: phoneNumber,
          subject,
          message,
        }),
      });

      const alimtalkResult = await alimtalkResponse.json();

      if (alimtalkResponse.ok) {
        console.log("알림톡 발송 성공:", alimtalkResult);
      } else {
        console.log("알림톡 발송 실패:", alimtalkResult.error);
      }
    } catch (error) {
      console.log("알림톡 발송 중 오류 발생");
    }
  };

  // 프로필 정보 검증 함수
  const validateProfileInfo = async (): Promise<boolean> => {
    try {
      if (!currentUserId) return false;
      
      const response = await fetch("/api/user");
      const data = await response.json();
      
      if (!response.ok || !data.user) {
        return false;
      }
      
      // 필수 필드 확인
      const requiredFields = ["phone", "bank_name", "account_number", "citizen_no"];
      const missing = requiredFields.filter(field => !data.user[field]);
      
      if (missing.length > 0) {
        // 누락된 필드가 있으면 상태 업데이트 및 다이얼로그 표시
        setMissingProfileFields(missing);
        setIsProfileValidationOpen(true);
        return false;
      }
      
      return true;
    } catch (error) {
      console.log("프로필 검증 중 오류 발생");
      return false;
    }
  };

  // 리뷰 신청 처리 함수
  const handleReserveSlot = async (slot: Quota) => {
    if (!currentUserId) {
      toast({
        title: "로그인 필요",
        description: "리뷰 신청을 위해 로그인이 필요합니다.",
        variant: "destructive",
      });
      router.push("/login");
      return;
    }

    // 프로필 정보 검증
    const isProfileValid = await validateProfileInfo();
    if (!isProfileValid) {
      // 검증 실패 시 여기서 종료 (다이얼로그는 이미 표시됨)
      return;
    }

    // 1단계: 일일 제한 체크 (영수증리뷰, 구글만)
    const hasLimitPlatform = formData.platform === "영수증리뷰" || formData.platform === "구글";
    if (hasLimitPlatform && dailyLimitStatus && dailyLimitStatus.count >= 5) {
      toast({
        title: "일일 신청 한도 초과",
        description: `${formData.platform} 플랫폼은 하루에 최대 5개까지만 신청할 수 있습니다. (현재: ${dailyLimitStatus.count}/5)`,
        variant: "destructive",
      });
      return;
    }

    // 2단계: 현재 리뷰에서의 신청 한도 체크 (모든 플랫폼 5개 제한으로 변경)
    if (userReservationCount >= 5) {
      toast({
        title: "현재 리뷰 신청 한도 초과",
        description: `한 리뷰에는 최대 5개까지만 신청할 수 있습니다. (현재: ${userReservationCount}/5)`,
        variant: "destructive",
      });
      return;
    }

    // 슬롯 상태 확인
    if (slot.status === 'reserved') {
      toast({
        title: "이미 예약된 구좌",
        description: "이미 다른 사용자가 예약한 구좌입니다.",
        variant: "destructive",
      });
      return;
    }

    if (slot.status === 'unavailable') {
      toast({
        title: "예약 불가",
        description: "아직 오픈되지 않은 구좌입니다.",
        variant: "destructive",
      });
      return;
    }

    if (slot.status !== 'available') {
      toast({
        title: "예약 불가",
        description: "예약할 수 없는 상태의 구좌입니다.",
        variant: "destructive",
      });
      return;
    }

    setSelectedSlot(slot);
    setIsReservationDialogOpen(true);
  };

  // 예약 확인 후 실제 예약 처리
  const confirmReservation = async () => {
    if (!selectedSlot || !currentUserId) return;

    setIsReservingSlot(true);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/reserve`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: selectedSlot.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "리뷰 신청에 실패했습니다.");
      }

      toast({
        title: "리뷰 신청 성공",
        description: "성공적으로 리뷰를 신청했습니다.",
      });

      // 상태 업데이트
      setQuotas((prev) =>
        prev.map((q) =>
          q.id === selectedSlot.id
            ? { 
                ...q, 
                status: 'reserved',
                reserved: true, 
                reservation_user_id: currentUserId
              }
            : q
        )
      );
      
      // 사용자 예약 수 증가 (reserved + complete 합계)
      setUserReservationCount(prev => prev + 1);
      setTotalUserReservations(prev => prev + 1);
      
      // 디버깅을 위한 로깅
      console.log("예약 후 예약 수 증가: ", userReservationCount + 1);

      // 일일 제한 상태 새로고침
      await checkDailyLimit();

      // 리뷰 신청 완료 알림톡 발송
      await sendReviewApplicationAlimtalk();

      setIsReservationDialogOpen(false);
    } catch (error) {
      toast({
        title: "리뷰 신청 실패",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsReservingSlot(false);
    }
  };

  // 개별 슬롯의 제출 데이터를 새로고침하는 함수
  const refreshSlotSubmissionData = async (slotId: string): Promise<SubmissionHistoryData | null> => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/slots/${slotId}/submission`);
      const result = await response.json();
      
      if (response.ok && result.data) {
        return result.data;
      }
      return null;
    } catch (error) {
      return null;
    }
  };

  // 내가 예약한 구좌 관리 다이얼로그 열기
  const handleManageSlot = async (slot: Quota) => {
    // 제출 데이터를 최신 상태로 로드
    if (!slot.submissionData) {
      const submissionData = await refreshSlotSubmissionData(slot.id);
      slot.submissionData = submissionData;
    }
    
    setManagementSlot(slot);
    setIsSlotManagementOpen(true);
  };

  // 구좌 업데이트 처리
  const handleSlotUpdate = async (updatedSlot: Quota) => {
    // 제출 데이터 새로고침
    const submissionData = await refreshSlotSubmissionData(updatedSlot.id);
    updatedSlot.submissionData = submissionData;
    
    setQuotas((prev) =>
      prev.map((q) => (q.id === updatedSlot.id ? updatedSlot : q))
    );
  };

  // 리뷰 신청 취소 처리 함수
  const handleCancelReservation = async (slot: Quota) => {
    if (!currentUserId) {
      toast({
        title: "로그인 필요",
        description: "취소를 위해 로그인이 필요합니다.",
        variant: "destructive",
      });
      return;
    }

    // 제출 완료된 상태는 취소 불가
    if (slot.status === 'complete') {
      toast({
        title: "취소 불가",
        description: "이미 제출 완료된 리뷰는 취소할 수 없습니다.",
        variant: "destructive",
      });
      return;
    }

    // 내가 예약한 슬롯이 아닌 경우
    if (slot.reservation_user_id !== currentUserId) {
      toast({
        title: "취소 불가",
        description: "본인이 신청한 리뷰만 취소할 수 있습니다.",
        variant: "destructive",
      });
      return;
    }

    setIsCancellingSlot(true);
    setCancellingSlotId(slot.id);

    try {
      const response = await fetch(`/api/reviews/${reviewId}/reserve`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId: slot.id,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "리뷰 신청 취소에 실패했습니다.");
      }

      toast({
        title: "신청 취소 성공",
        description: "리뷰 신청이 성공적으로 취소되었습니다.",
      });

      // 상태 업데이트
      setQuotas((prev) =>
        prev.map((q) =>
          q.id === slot.id
            ? { 
                ...q, 
                status: 'available',
                reserved: false, 
                reservation_user_id: null,
                submissionData: null // 제출 데이터도 초기화
              }
            : q
        )
      );
      
      // 사용자 예약 수 감소 (reserved + complete 합계)
      setUserReservationCount(prev => Math.max(0, prev - 1));
      setTotalUserReservations(prev => Math.max(0, prev - 1));

      // 일일 제한 상태 새로고침
      await checkDailyLimit();

    } catch (error) {
      toast({
        title: "신청 취소 실패",
        description:
          error instanceof Error
            ? error.message
            : "알 수 없는 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsCancellingSlot(false);
      setCancellingSlotId(null);
    }
  };

  // 플랫폼에 따른 필드 표시 여부 결정
  const isReceiptReview = formData.platform === "영수증리뷰";
  const isReservationReview = formData.platform === "예약자리뷰";
  const isGoogle = formData.platform === "구글";
  const isKakao = formData.platform === "카카오";
  const isCoupang = formData.platform === "쿠팡";
  const isStore = formData.platform === "스토어";
  const isProductPlatform = isCoupang || isStore;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }
  console.log("quotas with status: ", quotas.map(q => ({ id: q.id, number: q.quotaNumber, status: q.status })));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">리뷰 상세 정보</h1>
      </div>

      <div className="space-y-6 w-full">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="platform">플랫폼</Label>
            <Input
              id="platform"
              value={formData.platform}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="status">상태</Label>
            <Input
              id="status"
              value={
                formData.status === "approved"
                  ? "승인됨"
                  : formData.status === "pending"
                    ? "대기중"
                    : "거부됨"
              }
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2 col-span-1">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={formData.title}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* 공통 필드: 상호명/제품명 */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor={isProductPlatform ? "productName" : "storeName"}>
              {isProductPlatform ? "제품명" : "상호명"}
            </Label>
            <Input
              id={isProductPlatform ? "productName" : "storeName"}
              value={
                isProductPlatform ? formData.productName : formData.storeName
              }
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* 검색어 (쿠팡, 스토어만) */}
          {isProductPlatform && (
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="searchKeyword">검색어</Label>
              <Input
                id="searchKeyword"
                value={formData.searchKeyword}
                readOnly
                className="bg-gray-50"
              />
            </div>
          )}

          {/* 상호링크/제품링크 */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor={isProductPlatform ? "productUrl" : "storeUrl"}>
              {isProductPlatform ? "제품링크" : "상호링크"}
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id={isProductPlatform ? "productUrl" : "storeUrl"}
                value={
                  isProductPlatform ? formData.productUrl : formData.storeUrl
                }
                readOnly
                className="bg-gray-50"
              />
              {(formData.productUrl || formData.storeUrl) && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="whitespace-nowrap"
                >
                  <a
                    href={
                      isProductPlatform
                        ? formData.productUrl
                        : formData.storeUrl
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    링크 이동
                  </a>
                </Button>
              )}
            </div>
          </div>

          {/* 리뷰비 (모든 플랫폼) */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="reviewFee">리뷰비</Label>
            <Input
              id="reviewFee"
              value={`${Number(formData.reviewFee).toLocaleString()}원`}
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* 예약금액 (예약자리뷰만) */}
          {isReservationReview && (
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="reservationAmount">예약금액</Label>
              <Input
                id="reservationAmount"
                value={`${Number(formData.reservationAmount).toLocaleString()}원`}
                readOnly
                className="bg-gray-50"
              />
            </div>
          )}

          {/* 구매비용 (쿠팡, 스토어만) */}
          {isProductPlatform && (
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="purchaseCost">구매비용</Label>
              <Input
                id="purchaseCost"
                value={`${Number(formData.purchaseCost).toLocaleString()}원`}
                readOnly
                className="bg-gray-50"
              />
            </div>
          )}

          {/* 일건수 (모든 플랫폼) */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="dailyCount">일건수</Label>
            <Input
              id="dailyCount"
              value={formData.dailyCount}
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2 col-span-1">
            <Label>광고주</Label>
            <div className="flex flex-wrap gap-1 mt-1">
              {selectedProviders.map((provider, index) => (
                <div
                  key={index}
                  className="bg-gray-100 px-3 py-1 rounded-full text-sm"
                >
                  {provider.full_name}
                </div>
              ))}
              {selectedProviders.length === 0 && (
                <div className="text-gray-500">지정된 광고주가 없습니다</div>
              )}
            </div>
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="startDate">시작일</Label>
            <Input
              id="startDate"
              value={
                formData.startDate
                  ? new Date(formData.startDate).toLocaleString("ko-KR")
                  : ""
              }
              readOnly
              className="bg-gray-50"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="endDate">종료일</Label>
            <Input
              id="endDate"
              value={
                formData.endDate
                  ? new Date(formData.endDate).toLocaleString("ko-KR")
                  : ""
              }
              readOnly
              className="bg-gray-50"
            />
          </div>

          {/* 리뷰 가이드 */}
          {formData.reviewGuide && (
            <div className="space-y-2 col-span-2">
              <Label htmlFor="reviewGuide">리뷰 작성 가이드</Label>
              <Textarea
                id="reviewGuide"
                value={formData.reviewGuide}
                readOnly
                rows={4}
                className="bg-gray-50"
              />
            </div>
          )}
        </div>

        {/* 구좌 관리 섹션 */}
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">구좌 정보</h2>
            {currentUserId && (
              <div className="flex items-center gap-6 text-sm text-gray-600">
                {/* 일일 제한 상황 (영수증리뷰, 구글만) */}
                {(formData.platform === "영수증리뷰" || formData.platform === "구글") && dailyLimitStatus && (
                  <div>
                    {formData.platform} 오늘: <span className={`font-medium ${
                      dailyLimitStatus.count >= 5 ? 'text-red-600' : 'text-blue-600'
                    }`}>
                      {dailyLimitStatus.count}/5
                    </span>
                  </div>
                )}
                
                {/* 현재 리뷰에서 내가 신청한 개수 (영수증리뷰, 구글만 5개 제한) */}
                <div>
                  현재 리뷰: <span className={`font-medium ${
                    userReservationCount >= 5 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {userReservationCount}/5
                  </span>
                  <span className="text-xs text-gray-500 ml-1">(진행 중 + 완료 포함)</span>
                </div>
                
                {/* 전체 리뷰에서 내가 진행 중인 예약 상태 (reserved 상태만) */}
                {/* <div>
                  전체 진행 중: <span className={`font-medium ${
                    totalUserReservations >= 5 ? 'text-red-600' : 'text-blue-600'
                  }`}>
                    {totalUserReservations}/5
                  </span>
                </div> */}
              </div>
            )}
          </div>

          {quotas.length > 0 && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">구좌번호</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-center">오픈일시</TableHead>
                    <TableHead className="text-center">단계</TableHead>
                    <TableHead className="text-center">비고</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((quota) => {
                    // 내가 예약한 구좌인지 확인
                    const isMyReservation =
                      quota.reservation_user_id === currentUserId;

                    return (
                      <TableRow key={quota.id}>
                        {/* 구좌번호 */}
                        <TableCell className="text-center font-medium">
                          {quota.quotaNumber}
                        </TableCell>

                        {/* 상태 */}
                        <TableCell className="text-center">
                          {quota?.status === 'unavailable' ? (
                            <div className="flex items-center justify-center">
                              <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-500">
                                미오픈
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center">
                              <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                                오픈
                              </span>
                            </div>
                          )}
                        </TableCell>

                        {/* 오픈일시 */}
                        <TableCell className="text-center text-sm">
                          {quota.opened_date 
                            ? new Date(quota.opened_date).toLocaleDateString("ko-KR")
                            : "-"
                          }
                        </TableCell>

                        {/* 관리 */}
                        <TableCell className="text-center">
                          {/* 예약된 상태이고 내 ID가 아닌 경우 우선적으로 신청 불가 표시 */}
                          {(quota.status === 'reserved' || quota.status === 'complete') && !isMyReservation ? (
                            <div className="flex items-center justify-center">
                              <X className="h-5 w-5 text-red-500 mr-1" />
                              <span className="text-red-500 text-sm font-medium">
                                신청 불가
                              </span>
                            </div>
                          ) : quota.status === 'complete' && isMyReservation ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-green-600 mr-1" />
                                <span className="text-sm text-green-600">
                                  제출 완료
                                </span>
                              </div>
                            </div>
                          ) : quota.status === 'reserved' && isMyReservation ? (
                            <div className="flex flex-col items-center gap-2">
                              <div className="flex items-center">
                                <CheckCircle className="h-5 w-5 text-blue-600 mr-1" />
                                <span className="text-sm text-blue-600">
                                  신청 완료
                                </span>
                              </div>
                            </div>
                          ) : quota.status === 'available' ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className=""
                              onClick={() => handleReserveSlot(quota)}
                              disabled={
                                (formData.platform === "영수증리뷰" || formData.platform === "구글") 
                                  ? (dailyLimitStatus && dailyLimitStatus.count >= 5) || userReservationCount >= 5
                                  : userReservationCount >= 5
                              }
                            >
                              {(formData.platform === "영수증리뷰" || formData.platform === "구글") 
                                ? (dailyLimitStatus && dailyLimitStatus.count >= 5) 
                                  ? "일일 한도 초과"
                                  : userReservationCount >= 5
                                    ? "리뷰 한도 초과"
                                    : "리뷰 신청"
                                : userReservationCount >= 5
                                  ? "리뷰 한도 초과"
                                  : "리뷰 신청"
                              }
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              미오픈
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isMyReservation && (quota.status === 'reserved' || quota.status === 'complete') ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleManageSlot(quota)}
                                className=""
                              >
                                <Pencil className="w-4 h-4 mr-1" />
                                {quota.status === 'complete' ? "제출 내역 수정" : "리뷰 작성"}
                              </Button>
                              {quota.status === 'reserved' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleCancelReservation(quota)}
                                  disabled={isCancellingSlot && cancellingSlotId === quota.id}
                                  className="text-red-600 border-red-300 hover:bg-red-50"
                                >
                                  <X className="w-4 h-4 mr-1" />
                                  {isCancellingSlot && cancellingSlotId === quota.id ? "취소 중..." : "신청 취소"}
                                </Button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            뒤로 가기
          </Button>
        </div>
      </div>

      {/* 리뷰 신청 확인 다이얼로그 */}
      <AlertDialog
        open={isReservationDialogOpen}
        onOpenChange={setIsReservationDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>리뷰 신청 확인</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedSlot &&
                `구좌 #${selectedSlot.quotaNumber}에 대한 리뷰를 신청하시겠습니까?`}
              <br />
              신청 후에는 취소가 어려울 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isReservingSlot}>
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmReservation();
              }}
              disabled={isReservingSlot}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isReservingSlot ? "처리 중..." : "신청 확인"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 구좌 관리 다이얼로그 */}
      <SlotManagementDialog
        isOpen={isSlotManagementOpen}
        onOpenChange={setIsSlotManagementOpen}
        slot={managementSlot}
        reviewId={reviewId}
        onSlotUpdate={handleSlotUpdate}
        submissionHistory={managementSlot?.submissionData || null}
      />
      
      {/* 프로필 검증 다이얼로그 */}
      <ProfileValidationDialog 
        isOpen={isProfileValidationOpen}
        onOpenChange={setIsProfileValidationOpen}
        missingFields={missingProfileFields}
      />
    </div>
  );
}
