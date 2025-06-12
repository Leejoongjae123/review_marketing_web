'use client'
import React, { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
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
import { Separator } from "@/components/ui/separator";
import { Plus, X, Eye, Upload } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { MultiProviderSelector, Provider } from "@/components/MultiProviderSelector";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";

// 참여자 타입 정의
interface Participant {
  id: number;
  name: string;
  phone: string;
  loginAccount: string;
  eventAccount: string;
  nickname: string;
  reviewImage?: string;
}

// 구좌 타입 정의
interface Quota {
  id: number;
  quotaNumber: number;
  status: 'available' | 'unavailable';
  images: { file: File; preview: string; uploadedAt: string }[];
  receipts: { file: File; preview: string; uploadedAt: string }[];
}

export default function AddReviewPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    guide: "",
  });
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newParticipant, setNewParticipant] = useState<Omit<Participant, 'id'>>({
    name: '',
    phone: '',
    loginAccount: '',
    eventAccount: '',
    nickname: '',
  });
  const [newParticipantImages, setNewParticipantImages] = useState<{ file: File; preview: string }[]>([]);
  const newParticipantFileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([]);
  
  // 구좌 관련 상태
  const [quotaCount, setQuotaCount] = useState<string>("");
  const [quotas, setQuotas] = useState<Quota[]>([]);
  const quotaFileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  
  // 일괄 선택 관련 상태
  const [selectedQuotas, setSelectedQuotas] = useState<Set<number>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  

  
  // API 호출 진행 상황 관련 상태 추가
  const [isSubmittingQuotas, setIsSubmittingQuotas] = useState(false);
  const [quotaSubmissionProgress, setQuotaSubmissionProgress] = useState(0);
  const [currentQuotaIndex, setCurrentQuotaIndex] = useState(0);
  const [totalQuotasToSubmit, setTotalQuotasToSubmit] = useState(0);
  const [submissionStatus, setSubmissionStatus] = useState<string>("");
  
  // 선택된 광고주 상태 변경 시 로그 출력
  useEffect(() => {
    console.log("선택된 광고주 목록:", selectedProviders);
  }, [selectedProviders]);

  // 구좌 수와 일건수 변경 시 테이블 생성 및 상태 설정
  useEffect(() => {
    const totalCount = parseInt(quotaCount);
    const dailyCount = parseInt(formData.dailyCount);
    
    if (!isNaN(totalCount) && totalCount > 0) {
      createSlots(totalCount, dailyCount);
    } else {
      setQuotas([]);
    }
  }, [quotaCount, formData.dailyCount]);

  // 슬롯을 바로 생성하는 함수
  const createSlots = (totalCount: number, dailyCount: number) => {
    if (totalCount <= 0) return;
    
    const newQuotas: Quota[] = [];
    
    for (let i = 0; i < totalCount; i++) {
      const quota: Quota = {
        id: i + 1,
        quotaNumber: i + 1,
        status: (!isNaN(dailyCount) && dailyCount > 0 && i < dailyCount) ? 'available' : 'unavailable',
        images: [],
        receipts: []
      };
      
      newQuotas.push(quota);
    }
    
    setQuotas(newQuotas);
  };

  // 페이지 로드 시 스토리지 버킷 초기화 요청
  useEffect(() => {
    const initStorage = async () => {
      try {
        // 앱 초기화 API 호출 (reviews 버킷 생성 포함)
        const response = await fetch('/api/init');
        if (!response.ok) {
          const errorData = await response.json();
          console.log('스토리지 초기화 실패:', errorData);
        }
      } catch (error) {
        console.log('스토리지 초기화 요청 중 오류 발생');
      }
    };

    initStorage();
  }, []);

  // 플랫폼에 따른 필드 표시 여부 결정
  const isReceiptReview = formData.platform === "영수증리뷰";
  const isReservationReview = formData.platform === "예약자리뷰";
  const isGoogle = formData.platform === "구글";
  const isKakao = formData.platform === "카카오";
  const isCoupang = formData.platform === "쿠팡";
  const isStore = formData.platform === "스토어";
  const isProductPlatform = isCoupang || isStore;

  const handleViewReview = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 플랫폼별 필수 입력 검증
    const validationErrors = [];
    
    // 공통 필수 필드
    if (!formData.platform) validationErrors.push("플랫폼");
    if (!formData.startDate) validationErrors.push("시작일");
    if (!formData.endDate) validationErrors.push("종료일");
    if (!formData.title) validationErrors.push("타이틀");
    if (!formData.reviewFee) validationErrors.push("리뷰비");
    if (!formData.dailyCount) validationErrors.push("일건수");
    
    // 플랫폼별 필수 필드
    if (isProductPlatform) {
      if (!formData.productName) validationErrors.push("제품명");
      if (!formData.searchKeyword) validationErrors.push("검색어");
      if (!formData.productUrl) validationErrors.push("제품링크");
      if (!formData.purchaseCost) validationErrors.push("구매비용");
    } else {
      if (!formData.storeName) validationErrors.push("상호명");
      if (!formData.storeUrl) validationErrors.push("상호링크");
    }
    
    // 예약자리뷰인 경우 예약금액 필수
    if (isReservationReview && !formData.reservationAmount) {
      validationErrors.push("예약금액");
    }
    
    if (validationErrors.length > 0) {
      toast({
        title: "필수 정보 누락",
        description: `다음 항목들은 필수 입력사항입니다: ${validationErrors.join(", ")}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 이미지 파일을 base64로 변환
      const imageFilesPromises = images.map(async (image) => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(image.file);
        });
      });
      
      const imageFiles = await Promise.all(imageFilesPromises);

      // 먼저 기본 리뷰 데이터를 생성
      const baseReviewData = {
        platform: formData.platform,
        productName: formData.productName,
        storeName: formData.storeName,
        price: formData.price,
        shippingFee: formData.shippingFee,
        seller: formData.seller,
        status: formData.status,
        startDate: formData.startDate,
        endDate: formData.endDate,
        title: formData.title,
        content: formData.content,
        rating: formData.rating,
        productUrl: formData.productUrl,
        storeUrl: formData.storeUrl,
        store_name: formData.storeName || formData.productName,
        store_url: formData.storeUrl || formData.productUrl,
        imageFiles: imageFiles,
        participants_data: participants.length > 0 ? participants : undefined,
        providers_data: selectedProviders.length > 0 ? selectedProviders : undefined,
        reviewFee: formData.reviewFee,
        reservationAmount: formData.reservationAmount,
        totalCount: quotaCount,
        dailyCount: formData.dailyCount,
        searchKeyword: formData.searchKeyword,
        purchaseCost: formData.purchaseCost,
        guide: formData.guide,
      };

      // 기본 리뷰 생성 API 호출
      setSubmissionStatus("기본 리뷰 정보를 생성하고 있습니다...");
      const baseResponse = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(baseReviewData),
      });
      
      const baseResult = await baseResponse.json();
      
      if (!baseResponse.ok) {
        throw new Error(baseResult.error || '리뷰 등록에 실패했습니다.');
      }

      const reviewId = baseResult.reviewId;

      // 구좌가 있는 경우에만 구좌별 API 호출 진행
      if (quotas.length > 0) {
        setIsSubmittingQuotas(true);
        setTotalQuotasToSubmit(quotas.length);
        setCurrentQuotaIndex(0);
        setQuotaSubmissionProgress(0);

        // 각 구좌별로 API 호출
        for (let i = 0; i < quotas.length; i++) {
          const quota = quotas[i];
          setCurrentQuotaIndex(i + 1);
          setSubmissionStatus(`구좌 ${quota.quotaNumber}번을 처리하고 있습니다...`);

          // 구좌 이미지들을 base64로 변환
          const quotaImageFiles = await Promise.all(
            quota.images.map(async (image) => {
              return new Promise<{ base64: string; uploadedAt: string }>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve({
                    base64: reader.result as string,
                    uploadedAt: image.uploadedAt
                  });
                };
                reader.readAsDataURL(image.file);
              });
            })
          );

          const quotaReceiptFiles = await Promise.all(
            quota.receipts.map(async (receipt) => {
              return new Promise<{ base64: string; uploadedAt: string }>((resolve) => {
                const reader = new FileReader();
                reader.onloadend = () => {
                  resolve({
                    base64: reader.result as string,
                    uploadedAt: receipt.uploadedAt
                  });
                };
                reader.readAsDataURL(receipt.file);
              });
            })
          );

          // 개별 구좌 API 호출
          const quotaData = {
            reviewId: reviewId,
            quotaNumber: quota.quotaNumber,
            status: quota.status,
            images: quotaImageFiles,
            receipts: quotaReceiptFiles
          };

          const quotaResponse = await fetch('/api/reviews/quotas', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(quotaData),
          });

          if (!quotaResponse.ok) {
            const errorResult = await quotaResponse.json();
            console.error(`구좌 ${quota.quotaNumber} 처리 실패:`, errorResult);
            // 개별 구좌 실패는 로그만 남기고 계속 진행
          }

          // 진행률 업데이트
          const progress = ((i + 1) / quotas.length) * 100;
          setQuotaSubmissionProgress(progress);

          // API 호출 간격 조절 (너무 빠르게 호출하지 않도록)
          if (i < quotas.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        setSubmissionStatus("모든 구좌 처리가 완료되었습니다!");
        
        // 완료 후 약간의 지연
        setTimeout(() => {
          setIsSubmittingQuotas(false);
          setQuotaSubmissionProgress(0);
          setCurrentQuotaIndex(0);
          setTotalQuotasToSubmit(0);
          setSubmissionStatus("");
        }, 1000);
      }
      
      if (baseResult.warning) {
        toast({
          title: "일부 데이터만 저장됨",
          description: baseResult.warning,
          variant: "destructive",
        });
      } else {
        toast({
          title: "리뷰 등록 성공",
          description: "리뷰가 성공적으로 등록되었습니다.",
        });
      }
      
      // 성공 시 리뷰 목록 페이지로 이동
      router.push('/admin/reviews');
    } catch (error) {
      console.error('리뷰 등록 오류:', error);
      toast({
        title: "리뷰 등록 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
      setIsSubmittingQuotas(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  const handleAddParticipant = () => {
    // 이벤트 계정 중복 체크
    const isDuplicate = participants.some(p => p.eventAccount === newParticipant.eventAccount);
    if (isDuplicate) {
      toast({
        title: "중복된 계정",
        description: "이미 등록된 이벤트 계정입니다.",
        variant: "destructive",
      });
      return;
    }

    const newId = Math.max(...participants.map(p => p.id), 0) + 1;
    
    // 새 참여자 정보 생성
    const participantToAdd = { 
      ...newParticipant, 
      id: newId 
    };
    
    // 리뷰 이미지가 있는 경우 첫 번째 이미지 URL 저장
    if (newParticipantImages.length > 0) {
      // 실제 구현에서는 이미지 업로드 후 URL을 설정해야 함
      // 일단 미리보기 URL을 임시로 사용
      participantToAdd.reviewImage = newParticipantImages[0].preview;
    }
    
    setParticipants([...participants, participantToAdd]);
    
    // 폼 초기화
    setNewParticipant({
      name: '',
      phone: '',
      loginAccount: '',
      eventAccount: '',
      nickname: '',
    });
    setNewParticipantImages([]);
    setIsAddModalOpen(false);
  };

  const handleNewParticipantImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));
      setNewParticipantImages(prev => [...prev, ...newImages]);
    }
  };

  const handleRemoveNewParticipantImage = (index: number) => {
    setNewParticipantImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleAddNewParticipantImage = () => {
    newParticipantFileInputRef.current?.click();
  };

  const handleRemoveParticipant = (id: number) => {
    setParticipants(participants.filter(p => p.id !== id));
  };

  // 구좌별 이미지 첨부 핸들러
  const handleQuotaImageChange = (quotaId: number, type: 'images' | 'receipts', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files).map(file => ({
        file,
        preview: URL.createObjectURL(file),
        uploadedAt: new Date().toLocaleString('ko-KR', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        })
      }));
      
      setQuotas(prev => prev.map(quota => 
        quota.id === quotaId 
          ? { ...quota, [type]: [...quota[type], ...newFiles] }
          : quota
      ));
    }
  };

  // 구좌별 이미지/영수증 제거 핸들러
  const handleRemoveQuotaFile = (quotaId: number, type: 'images' | 'receipts', fileIndex: number) => {
    setQuotas(prev => prev.map(quota => {
      if (quota.id === quotaId) {
        const newFiles = [...quota[type]];
        URL.revokeObjectURL(newFiles[fileIndex].preview);
        newFiles.splice(fileIndex, 1);
        return { ...quota, [type]: newFiles };
      }
      return quota;
    }));
  };

  // 구좌별 파일 추가 버튼 핸들러
  const handleAddQuotaFile = (quotaId: number, type: 'images' | 'receipts') => {
    const inputRef = quotaFileInputRefs.current[`${quotaId}-${type}`];
    if (inputRef) {
      inputRef.click();
    }
  };

  // 일괄 선택 관련 핸들러
  const handleSelectQuota = (quotaId: number) => {
    const newSelected = new Set(selectedQuotas);
    if (newSelected.has(quotaId)) {
      newSelected.delete(quotaId);
    } else {
      newSelected.add(quotaId);
    }
    setSelectedQuotas(newSelected);
    setIsAllSelected(newSelected.size === quotas.length && quotas.length > 0);
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedQuotas(new Set());
      setIsAllSelected(false);
    } else {
      const allIds = new Set(quotas.map(q => q.id));
      setSelectedQuotas(allIds);
      setIsAllSelected(true);
    }
  };

  // 선택된 구좌들의 상태를 일괄 변경
  const handleBulkStatusChange = (newStatus: 'available' | 'unavailable') => {
    if (selectedQuotas.size === 0) {
      toast({
        title: "선택된 구좌가 없습니다",
        description: "상태를 변경할 구좌를 먼저 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setQuotas(prev => prev.map(quota => 
      selectedQuotas.has(quota.id) 
        ? { ...quota, status: newStatus }
        : quota
    ));

    toast({
      title: "상태 변경 완료",
      description: `선택된 ${selectedQuotas.size}개 구좌의 상태가 ${newStatus === 'available' ? '활성' : '비활성'}으로 변경되었습니다.`,
    });

    // 선택 해제
    setSelectedQuotas(new Set());
    setIsAllSelected(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">이벤트 추가</h1>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="space-y-4">
          <Label>제품 이미지</Label>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageChange}
          />
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square relative rounded-lg overflow-hidden border">
                  <Image
                    src={image.preview}
                    alt={`제품 이미지 ${index + 1}`}
                    fill
                    className="object-cover"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveImage(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={handleAddImage}
              className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center hover:border-primary transition-colors"
            >
              <Plus className="h-8 w-8 text-muted-foreground" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="platform">플랫폼</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
            >
              <SelectTrigger className={!formData.platform ? "border-red-300 focus:border-red-500" : ""}>
                <SelectValue placeholder="플랫폼 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="영수증리뷰">영수증리뷰</SelectItem>
                <SelectItem value="예약자리뷰">예약자리뷰</SelectItem>
                <SelectItem value="구글">구글</SelectItem>
                <SelectItem value="카카오">카카오</SelectItem>
                <SelectItem value="쿠팡">쿠팡</SelectItem>
                <SelectItem value="스토어">스토어</SelectItem>
              </SelectContent>
            </Select>
            {!formData.platform && (
              <p className="text-red-500 text-sm mt-1">플랫폼은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="상태 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">대기중</SelectItem>
                <SelectItem value="approved">승인됨</SelectItem>
                <SelectItem value="rejected">거부됨</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 col-span-1">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="타이틀을 입력하세요"
              className={!formData.title ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.title && (
              <p className="text-red-500 text-sm mt-1">타이틀은 필수 입력사항입니다.</p>
            )}
          </div>

          {/* 공통 필드: 상호명/제품명 */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor={isProductPlatform ? "productName" : "storeName"}>
              {isProductPlatform ? "제품명" : "상호명"}
            </Label>
            <Input
              id={isProductPlatform ? "productName" : "storeName"}
              value={isProductPlatform ? formData.productName : formData.storeName}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                [isProductPlatform ? "productName" : "storeName"]: e.target.value 
              }))}
              placeholder={`${isProductPlatform ? "제품명" : "상호명"}을 입력하세요`}
              className={!formData.productName && !formData.storeName ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.productName && !formData.storeName && (
              <p className="text-red-500 text-sm mt-1">{isProductPlatform ? "제품명" : "상호명"}은 필수 입력사항입니다.</p>
            )}
          </div>

          {/* 검색어 (쿠팡, 스토어만) */}
          {isProductPlatform && (
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="searchKeyword">검색어</Label>
              <Input
                id="searchKeyword"
                value={formData.searchKeyword}
                onChange={(e) => setFormData(prev => ({ ...prev, searchKeyword: e.target.value }))}
                placeholder="검색어를 입력하세요"
                className={!formData.searchKeyword ? "border-red-300 focus:border-red-500" : ""}
                aria-required="true"
              />
              {!formData.searchKeyword && (
                <p className="text-red-500 text-sm mt-1">검색어는 필수 입력사항입니다.</p>
              )}
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
                value={isProductPlatform ? formData.productUrl : formData.storeUrl}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  [isProductPlatform ? "productUrl" : "storeUrl"]: e.target.value 
                }))}
                placeholder={`${isProductPlatform ? "제품" : "상호"} URL을 입력하세요`}
                className={!formData.productUrl && !formData.storeUrl ? "border-red-300 focus:border-red-500" : ""}
                aria-required="true"
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
                    href={isProductPlatform ? formData.productUrl : formData.storeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    링크 이동
                  </a>
                </Button>
              )}
            </div>
            {!formData.productUrl && !formData.storeUrl && (
              <p className="text-red-500 text-sm mt-1">{isProductPlatform ? "제품" : "상호"} URL은 필수 입력사항입니다.</p>
            )}
          </div>

          {/* 리뷰비 (모든 플랫폼) */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="reviewFee">리뷰비</Label>
            <Input
              id="reviewFee"
              type="number"
              value={formData.reviewFee}
              onChange={(e) => setFormData(prev => ({ ...prev, reviewFee: e.target.value }))}
              placeholder="리뷰비를 입력하세요"
              className={!formData.reviewFee ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.reviewFee && (
              <p className="text-red-500 text-sm mt-1">리뷰비는 필수 입력사항입니다.</p>
            )}
          </div>

          {/* 예약금액 (예약자리뷰만) */}
          {isReservationReview && (
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="reservationAmount">예약금액</Label>
              <Input
                id="reservationAmount"
                type="number"
                value={formData.reservationAmount}
                onChange={(e) => setFormData(prev => ({ ...prev, reservationAmount: e.target.value }))}
                placeholder="예약금액을 입력하세요"
                className={!formData.reservationAmount ? "border-red-300 focus:border-red-500" : ""}
                aria-required="true"
              />
              {!formData.reservationAmount && (
                <p className="text-red-500 text-sm mt-1">예약금액은 필수 입력사항입니다.</p>
              )}
            </div>
          )}

          {/* 구매비용 (쿠팡, 스토어만) */}
          {isProductPlatform && (
            <div className="space-y-2 col-span-2 md:col-span-1">
              <Label htmlFor="purchaseCost">구매비용</Label>
              <Input
                id="purchaseCost"
                type="number"
                value={formData.purchaseCost}
                onChange={(e) => setFormData(prev => ({ ...prev, purchaseCost: e.target.value }))}
                placeholder="구매비용을 입력하세요"
                className={!formData.purchaseCost ? "border-red-300 focus:border-red-500" : ""}
                aria-required="true"
              />
              {!formData.purchaseCost && (
                <p className="text-red-500 text-sm mt-1">구매비용은 필수 입력사항입니다.</p>
              )}
            </div>
          )}

          {/* 일건수 (모든 플랫폼) */}
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="dailyCount">일건수</Label>
            <Input
              id="dailyCount"
              type="number"
              value={formData.dailyCount}
              onChange={(e) => setFormData(prev => ({ ...prev, dailyCount: e.target.value }))}
              placeholder="일건수를 입력하세요"
              className={!formData.dailyCount ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.dailyCount && (
              <p className="text-red-500 text-sm mt-1">일건수는 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-1">
            <Label>광고주</Label>
            <MultiProviderSelector 
              value={selectedProviders}
              onChange={setSelectedProviders}
            />
            {selectedProviders.length === 0 && (
              <div className="border-red-300 focus:border-red-500"></div>
            )}
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="startDate">시작일 <span className="text-red-500">*</span></Label>
            <Input
              id="startDate"
              type="datetime-local"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              required
              className={!formData.startDate ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.startDate && (
              <p className="text-red-500 text-sm mt-1">시작일은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="endDate">종료일 <span className="text-red-500">*</span></Label>
            <Input
              id="endDate"
              type="datetime-local"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              required
              className={!formData.endDate ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.endDate && (
              <p className="text-red-500 text-sm mt-1">종료일은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2">
            <Label htmlFor="guide">리뷰 가이드</Label>
            <Textarea
              id="guide"
              value={formData.guide}
              onChange={(e) => setFormData(prev => ({ ...prev, guide: e.target.value }))}
              placeholder="리뷰 작성 가이드를 입력하세요"
              rows={6}
              className="resize-none"
            />

          </div>

        </div>

        {/* 구좌 관리 섹션 */}
        <Separator />
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">구좌 관리</h2>
          
          <div className="space-y-2">
            <Label htmlFor="quotaCount">전체 슬롯 개수</Label>
            <div className="flex items-center gap-4">
              <Input
                id="quotaCount"
                type="number"
                min="0"
                max="100"
                value={quotaCount}
                onChange={(e) => setQuotaCount(e.target.value)}
                placeholder="전체 슬롯 개수를 입력하세요"
                className="w-48"
              />
              <span className="text-sm text-muted-foreground">
                {quotas.length > 0 && (
                  <>
                    전체 {quotas.length}개 슬롯 중 {quotas.filter(q => q.status === 'available').length}개 활성화
                    {formData.dailyCount && ` (일건수: ${formData.dailyCount}개)`}
                  </>
                )}
              </span>
            </div>
          </div>

          {quotas.length > 0 && (
            <div className="space-y-4">
              {/* 일괄 조작 버튼들 */}
              <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium">전체 선택</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    선택된 구좌: {selectedQuotas.size}개
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('available')}
                    disabled={selectedQuotas.size === 0}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    선택 항목 활성화
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusChange('unavailable')}
                    disabled={selectedQuotas.size === 0}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    선택 항목 비활성화
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">선택</TableHead>
                    <TableHead className="w-20 text-center">구좌번호</TableHead>
                    <TableHead className="w-20 text-center">상태</TableHead>
                    <TableHead className="text-center">이미지</TableHead>
                    <TableHead className="text-center">영수증</TableHead>
                    <TableHead className="text-center">작성일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((quota) => (
                    <TableRow key={quota.id} className={quota.status === 'unavailable' ? 'bg-gray-50' : ''}>
                      {/* 선택 체크박스 */}
                      <TableCell className="text-center border-r">
                        <input
                          type="checkbox"
                          checked={selectedQuotas.has(quota.id)}
                          onChange={() => handleSelectQuota(quota.id)}
                          className="w-4 h-4"
                        />
                      </TableCell>
                      
                      {/* 구좌번호 */}
                      <TableCell className="text-center font-medium border-r">
                        {quota.quotaNumber}
                      </TableCell>
                      
                      {/* 상태 */}
                      <TableCell className="text-center border-r">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          quota.status === 'available' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {quota.status === 'available' ? '활성' : '비활성'}
                        </span>
                      </TableCell>
                      
                      {/* 이미지 셀 */}
                      <TableCell className="border-r">
                        <div 
                          className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 transition-colors cursor-pointer flex flex-col items-center justify-center ${
                            quota.status === 'available' 
                              ? 'border-gray-300 hover:border-primary' 
                              : 'border-gray-200 cursor-not-allowed bg-gray-50'
                          }`}
                          onClick={() => quota.status === 'available' && handleAddQuotaFile(quota.id, 'images')}
                        >
                          <input
                            type="file"
                            ref={(el) => {
                              quotaFileInputRefs.current[`${quota.id}-images`] = el;
                            }}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleQuotaImageChange(quota.id, 'images', e)}
                            disabled={quota.status === 'unavailable'}
                          />
                          
                          {quota.images.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center w-full">
                              {quota.images.map((image, imageIndex) => (
                                <div key={imageIndex} className="relative group">
                                  <div className="w-12 h-12 relative rounded-lg overflow-hidden border">
                                    <Image
                                      src={image.preview}
                                      alt={`구좌 ${quota.quotaNumber} 이미지 ${imageIndex + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  {quota.status === 'available' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveQuotaFile(quota.id, 'images', imageIndex);
                                      }}
                                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center">
                              <Plus className={`h-6 w-6 mx-auto mb-1 ${
                                quota.status === 'available' ? 'text-gray-400' : 'text-gray-300'
                              }`} />
                              <span className={`text-xs ${
                                quota.status === 'available' ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                {quota.status === 'available' ? '이미지 첨부' : '비활성'}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* 영수증 셀 */}
                      <TableCell className="border-r">
                        <div 
                          className={`min-h-[60px] border-2 border-dashed rounded-lg p-2 transition-colors cursor-pointer flex flex-col items-center justify-center ${
                            quota.status === 'available' 
                              ? 'border-gray-300 hover:border-primary' 
                              : 'border-gray-200 cursor-not-allowed bg-gray-50'
                          }`}
                          onClick={() => quota.status === 'available' && handleAddQuotaFile(quota.id, 'receipts')}
                        >
                          <input
                            type="file"
                            ref={(el) => {
                              quotaFileInputRefs.current[`${quota.id}-receipts`] = el;
                            }}
                            className="hidden"
                            accept="image/*"
                            multiple
                            onChange={(e) => handleQuotaImageChange(quota.id, 'receipts', e)}
                            disabled={quota.status === 'unavailable'}
                          />
                          
                          {quota.receipts.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-center w-full">
                              {quota.receipts.map((receipt, receiptIndex) => (
                                <div key={receiptIndex} className="relative group">
                                  <div className="w-12 h-12 relative rounded-lg overflow-hidden border">
                                    <Image
                                      src={receipt.preview}
                                      alt={`구좌 ${quota.quotaNumber} 영수증 ${receiptIndex + 1}`}
                                      fill
                                      className="object-cover"
                                    />
                                  </div>
                                  {quota.status === 'available' && (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveQuotaFile(quota.id, 'receipts', receiptIndex);
                                      }}
                                      className="absolute -top-1 -right-1 p-0.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                                    >
                                      <X className="h-2 w-2" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center">
                              <Plus className={`h-6 w-6 mx-auto mb-1 ${
                                quota.status === 'available' ? 'text-gray-400' : 'text-gray-300'
                              }`} />
                              <span className={`text-xs ${
                                quota.status === 'available' ? 'text-gray-500' : 'text-gray-400'
                              }`}>
                                {quota.status === 'available' ? '영수증 첨부' : '비활성'}
                              </span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* 작성일시 셀 */}
                      <TableCell className="text-center">
                        <div className="space-y-2">
                          {/* 이미지 작성일시 */}
                          {quota.images.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-blue-600 mb-1">이미지</div>
                              {quota.images.map((image, imageIndex) => (
                                <div key={imageIndex} className="text-xs text-gray-600 mb-1">
                                  {image.uploadedAt}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* 영수증 작성일시 */}
                          {quota.receipts.length > 0 && (
                            <div>
                              <div className="text-xs font-medium text-green-600 mb-1">영수증</div>
                              {quota.receipts.map((receipt, receiptIndex) => (
                                <div key={receiptIndex} className="text-xs text-gray-600 mb-1">
                                  {receipt.uploadedAt}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {quota.images.length === 0 && quota.receipts.length === 0 && (
                            <span className="text-sm text-gray-400">-</span>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            취소
          </Button>
          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.startDate || !formData.endDate}
          >
            {isSubmitting ? "등록 중..." : "등록"}
          </Button>
        </div>
      </form>

      <Dialog open={isModalOpen} onOpenChange={(open) => {
        if (!open) {
          setIsModalOpen(false);
          setSelectedParticipant(null);
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>리뷰 인증 정보</DialogTitle>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>이름</Label>
                  <Input value={selectedParticipant.name} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>연락처</Label>
                  <Input value={selectedParticipant.phone} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>로그인계정</Label>
                  <Input value={selectedParticipant.loginAccount} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>이벤트계정</Label>
                  <Input value={selectedParticipant.eventAccount} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>닉네임</Label>
                  <Input value={selectedParticipant.nickname} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>리뷰 인증 이미지</Label>
                  {selectedParticipant.reviewImage ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border mt-2 w-32">
                      <Image
                        src={selectedParticipant.reviewImage}
                        alt="리뷰 인증 이미지"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  ) : (
                    <Input value="리뷰 이미지가 없습니다." readOnly />
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>참여자 추가</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>이름</Label>
              <Input
                value={newParticipant.name}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                placeholder="이름을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>전화번호</Label>
              <Input
                value={newParticipant.phone}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="전화번호를 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>로그인 계정</Label>
              <Input
                value={newParticipant.loginAccount}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, loginAccount: e.target.value }))}
                placeholder="로그인 계정을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>이벤트 계정</Label>
              <Input
                value={newParticipant.eventAccount}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, eventAccount: e.target.value }))}
                placeholder="이벤트 계정을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>닉네임</Label>
              <Input
                value={newParticipant.nickname}
                onChange={(e) => setNewParticipant(prev => ({ ...prev, nickname: e.target.value }))}
                placeholder="닉네임을 입력하세요"
              />
            </div>
            <div className="space-y-2">
              <Label>리뷰 이미지</Label>
              <input
                type="file"
                ref={newParticipantFileInputRef}
                className="hidden"
                accept="image/*"
                multiple
                onChange={handleNewParticipantImageChange}
              />
              <div className="grid grid-cols-4 gap-4">
                {newParticipantImages.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className="aspect-square relative rounded-lg overflow-hidden border">
                      <Image
                        src={image.preview}
                        alt={`리뷰 이미지 ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveNewParticipantImage(index)}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddNewParticipantImage}
                  className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center hover:border-primary transition-colors"
                >
                  <Plus className="h-8 w-8 text-muted-foreground" />
                </button>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button 
                variant="outline" 
                type="button"
                onClick={() => {
                  setNewParticipantImages([]);
                  setIsAddModalOpen(false);
                }}
              >
                취소
              </Button>
              <Button 
                type="button"
                onClick={() => {
                  handleAddParticipant();
                  setNewParticipantImages([]);
                }}
              >
                등록
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>



      {/* API 호출 진행 상황 모달 */}
      <Dialog open={isSubmittingQuotas} onOpenChange={() => {}}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center flex items-center justify-center gap-2">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              {submissionStatus}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2 transition-all duration-300">
                {currentQuotaIndex} / {totalQuotasToSubmit}
              </div>
              <div className="text-sm text-muted-foreground mb-4">
                {quotaSubmissionProgress === 100 ? '모든 구좌 처리가 완료되었습니다!' : '구좌를 처리하고 있습니다...'}
              </div>
            </div>
            
            <div className="space-y-3">
              <Progress 
                value={quotaSubmissionProgress} 
                className="w-full h-4 transition-all duration-300" 
              />
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">진행률</span>
                <span className="font-medium text-primary">
                  {Math.round(quotaSubmissionProgress)}%
                </span>
              </div>
            </div>
            
            {quotaSubmissionProgress < 100 && (
              <div className="text-center text-xs text-muted-foreground animate-pulse">
                잠시만 기다려주세요...
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 