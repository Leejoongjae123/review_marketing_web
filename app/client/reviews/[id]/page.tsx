"use client";
import React, { useState, useRef, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Quota, SubmissionHistoryData } from "./types";

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
  });
  const [selectedProviders, setSelectedProviders] = useState<any[]>([]);

  // 구좌 관련 상태
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isReservationDialogOpen, setIsReservationDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Quota | null>(null);
  const [isReservingSlot, setIsReservingSlot] = useState(false);
  const [isSlotManagementOpen, setIsSlotManagementOpen] = useState(false);
  const [managementSlot, setManagementSlot] = useState<Quota | null>(null);
  const [dailyQuotaInfo, setDailyQuotaInfo] = useState<{
    available_slots: number;
    reserved_slots: number;
  } | null>(null);

  // 제출 데이터 확인 함수
  const fetchSubmissionData = async (slotId: string): Promise<SubmissionHistoryData | null> => {
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

  // 일별 할당량 정보 로드
  const loadDailyQuotaInfo = async () => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/daily-slots`);
      const result = await response.json();
      
      if (response.ok && result.quota) {
        setDailyQuotaInfo(result.quota);
      }
    } catch (error) {
      // 조용히 처리
    }
  };

  // 슬롯 동기화 함수
  const syncSlots = async () => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}/sync-slots`, {
        method: 'POST',
      });
      const result = await response.json();
      
      if (response.ok && result.data?.totalChanges > 0) {
        // 슬롯 변경사항이 있는 경우 토스트 표시
        const { slotsOpened, slotsClosed } = result.data;
        let message = "";
        
        if (slotsOpened > 0 && slotsClosed > 0) {
          message = `${slotsOpened}개 슬롯이 오픈되고 ${slotsClosed}개 슬롯이 닫혔습니다.`;
        } else if (slotsOpened > 0) {
          message = `${slotsOpened}개의 슬롯이 새로 오픈되었습니다.`;
        } else if (slotsClosed > 0) {
          message = `${slotsClosed}개의 슬롯이 닫혔습니다.`;
        }
        
        if (message) {
          toast({
            title: "슬롯 동기화 완료",
            description: message,
          });
        }
        
        return true; // 새로고침 필요함을 알림
      }
    } catch (error) {
      // 동기화 실패는 조용히 처리
    }
    return false;
  };

  // 리뷰 데이터 로드
  useEffect(() => {
    const loadReviewData = async () => {
      if (!reviewId) return;

      try {
        setIsLoading(true);
        
        // 먼저 현재 사용자 정보 로드
        const userId = await loadCurrentUser();

        // 슬롯 동기화 실행 (일건수 변경 대응)
        const shouldRefresh = await syncSlots();

        // 일별 할당량 정보 로드
        await loadDailyQuotaInfo();

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

        // 슬롯이 새로 오픈된 경우 약간의 지연 후 데이터 재로드
        if (shouldRefresh) {
          setTimeout(async () => {
            await loadDailyQuotaInfo();
            const refreshResponse = await fetch(`/api/reviews/${reviewId}`);
            const refreshResult = await refreshResponse.json();
            if (refreshResponse.ok) {
              // 구좌 정보만 업데이트
              if (refreshResult.review.slots && refreshResult.review.slots.length > 0) {
                const refreshedQuotas: Quota[] = await Promise.all(
                  refreshResult.review.slots.map(async (slot: any) => {
                    let submissionData = null;
                    submissionData = await fetchSubmissionData(slot.id);

                    return {
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
                      status: slot.status || "unopened",
                      reserved: !!slot.reservation_user_id,
                      reservation_user_id: slot.reservation_user_id,
                      created_at: slot.created_at,
                      submissionData,
                    };
                  })
                );
                setQuotas(refreshedQuotas);
              }
            }
          }, 1000);
        }

        const review = result.review;

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
          
          // 기존 구좌 데이터를 새로운 형식으로 변환
          const loadedQuotas: Quota[] = await Promise.all(
            review.slots.map(async (slot: any) => {
              console.log(`슬롯 ${slot.slot_number} - 상태: ${slot.status}`);
              
              // 제출 데이터 확인 - 제출 데이터가 있는지 확인
              let submissionData = null;
              
              // status와 관계없이 제출 데이터 확인
              submissionData = await fetchSubmissionData(slot.id);

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
                status: slot.status || "unopened",
                reserved: !!slot.reservation_user_id,
                reservation_user_id: slot.reservation_user_id,
                created_at: slot.created_at,
                submissionData,
              };
              
              console.log(`구좌 ${quotaData.quotaNumber} 최종 상태: ${quotaData.status}`);
              return quotaData;
            })
          );

          console.log("최종 구좌 데이터:", loadedQuotas);
          setQuotas(loadedQuotas);
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
        return data.user.id;
      }
      return null;
    } catch (error) {
      // 사용자 정보 로드 실패 시 조용히 처리
      return null;
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

    // 슬롯 상태 확인
    if (slot.status === 'reserved') {
      toast({
        title: "이미 예약된 구좌",
        description: "이미 다른 사용자가 예약한 구좌입니다.",
        variant: "destructive",
      });
      return;
    }

    if (slot.status === 'unopened') {
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

  // 내가 예약한 구좌 관리 다이얼로그 열기
  const handleManageSlot = async (slot: Quota) => {
    // 제출 데이터를 최신 상태로 로드
    if (!slot.submissionData) {
      const submissionData = await fetchSubmissionData(slot.id);
      slot.submissionData = submissionData;
    }
    
    setManagementSlot(slot);
    setIsSlotManagementOpen(true);
  };

  // 구좌 업데이트 처리
  const handleSlotUpdate = async (updatedSlot: Quota) => {
    // 제출 데이터 새로고침
    const submissionData = await fetchSubmissionData(updatedSlot.id);
    updatedSlot.submissionData = submissionData;
    
    setQuotas((prev) =>
      prev.map((q) => (q.id === updatedSlot.id ? updatedSlot : q))
    );
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
        </div>

        {/* 구좌 관리 섹션 */}
        <Separator />
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">구좌 정보</h2>
            <div className="flex items-center gap-4">

            </div>
          </div>

          {quotas.length > 0 && (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16 text-center">구좌번호</TableHead>
                    <TableHead className="text-center">상태</TableHead>
                    <TableHead className="text-center">작성일시</TableHead>
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
                          {quota.status === 'unopened' ? (
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

                        {/* 작성일시 */}
                        <TableCell className="text-center text-sm">
                          {quota.created_at ? new Date(quota.created_at).toLocaleDateString('ko-KR') : '-'}
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
                            >
                              리뷰 신청
                            </Button>
                          ) : (
                            <span className="text-gray-400 text-sm">
                              미오픈
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isMyReservation && (quota.status === 'reserved' || quota.status === 'complete') ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleManageSlot(quota)}
                              className=""
                            >
                              <Pencil className="w-4 h-4 mr-1" />
                              {quota.status === 'complete' ? "제출 내역 수정" : "리뷰 작성"}
                            </Button>
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
    </div>
  );
}
