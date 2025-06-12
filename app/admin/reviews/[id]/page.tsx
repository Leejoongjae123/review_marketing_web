'use client'
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
import { Plus, X, Eye, Upload, Trash2 } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { MultiProviderSelector, Provider } from "@/components/MultiProviderSelector";
import {Spinner} from "@/components/ui/spinner";
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
  images: { file: File; preview: string; uploadedAt: string }[];
  receipts: { file: File; preview: string; uploadedAt: string }[];
  status?: 'unopened' | 'available' | 'reserved' | 'complete';
  slotId?: string; // 실제 DB의 슬롯 ID
  openedDate?: string; // 슬롯이 오픈된 날짜
}

// 파일을 base64로 변환하는 함수
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
};

export default function EditReviewPage() {
  const router = useRouter();
  const params = useParams();
  const reviewId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);
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
    totalCount: "", // 전체 건수 추가
    reviewGuide: "", // 리뷰 가이드 추가
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
  
  // 슬롯 상태 관리 관련 상태
  const [selectedQuotas, setSelectedQuotas] = useState<Set<number>>(new Set());
  const [isAllSelected, setIsAllSelected] = useState(false);
  const [isUpdatingSlots, setIsUpdatingSlots] = useState(false);

  // 리뷰 데이터 로드
  useEffect(() => {
    const loadReviewData = async () => {
      if (!reviewId) return;
      
      try {
        setIsLoading(true);
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
        
        // 폼 데이터 설정
        setFormData({
          platform: review.platform || "",
          productName: review.product_name || "",
          optionName: review.option_name || "",
          price: review.price ? review.price.toString() : "",
          shippingFee: review.shipping_fee ? review.shipping_fee.toString() : "",
          seller: review.seller || "",
          participants: review.participants ? review.participants.toString() : "",
          status: review.status || "approved",
          startDate: review.start_date ? new Date(review.start_date).toISOString().slice(0, 16) : "",
          endDate: review.end_date ? new Date(review.end_date).toISOString().slice(0, 16) : "",
          title: review.title || "",
          content: review.content || "",
          rating: review.rating ? review.rating.toString() : "3",
          productUrl: review.product_url || "",
          storeName: review.store_name || "",
          storeUrl: review.store_url || "",
          reviewFee: review.review_fee ? review.review_fee.toString() : "",
          reservationAmount: review.reservation_amount ? review.reservation_amount.toString() : "",
          dailyCount: review.daily_count ? review.daily_count.toString() : "",
          searchKeyword: review.search_keyword || "",
          purchaseCost: review.purchase_cost ? review.purchase_cost.toString() : "",
          totalCount: review.slots ? review.slots.length.toString() : "",
          reviewGuide: review.guide || "",
        });
        
        // 광고주 설정
        const providers: Provider[] = [];
        if (review.provider1) {
          providers.push({
            id: review.provider1,
            full_name: review.provider1_name || "광고주1",
            email: ""
          });
        }
        if (review.provider2) {
          providers.push({
            id: review.provider2,
            full_name: review.provider2_name || "광고주2",
            email: ""
          });
        }
        if (review.provider3) {
          providers.push({
            id: review.provider3,
            full_name: review.provider3_name || "광고주3",
            email: ""
          });
        }
        setSelectedProviders(providers);

        // 구좌 정보 설정
        if (review.slots && review.slots.length > 0) {
          setQuotaCount(review.slots.length.toString());
          
          // 기존 구좌 데이터를 새로운 형식으로 변환
          const loadedQuotas: Quota[] = review.slots.map((slot: any) => ({
            id: slot.slot_number,
            quotaNumber: slot.slot_number,
            slotId: slot.id, // 실제 DB의 슬롯 ID 저장
            status: slot.status || 'unopened',
            openedDate: slot.opened_date, // 오픈 날짜 추가
            images: (slot.images || []).map((url: string, index: number) => ({
              file: new File([], `existing-image-${index}`, { type: 'image/jpeg' }),
              preview: url,
              uploadedAt: slot.images_updated_at ? new Date(slot.images_updated_at).toLocaleString('ko-KR') : new Date(slot.created_at).toLocaleString('ko-KR')
            })),
            receipts: (slot.receipts || []).map((url: string, index: number) => ({
              file: new File([], `existing-receipt-${index}`, { type: 'image/jpeg' }),
              preview: url,
              uploadedAt: slot.receipts_updated_at ? new Date(slot.receipts_updated_at).toLocaleString('ko-KR') : new Date(slot.created_at).toLocaleString('ko-KR')
            }))
          }));
          
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
  
  // 선택된 광고주 상태 변경 시 로그 출력
  useEffect(() => {
    console.log("선택된 광고주 목록:", selectedProviders);
  }, [selectedProviders]);

  // 구좌 수 변경 시 테이블 생성 (기존 데이터 보존)
  useEffect(() => {
    const count = parseInt(quotaCount);
    if (!isNaN(count) && count > 0) {
      setQuotas(prevQuotas => {
        const newQuotas: Quota[] = [];
        
        // 기존 구좌 데이터 보존
        for (let i = 0; i < count; i++) {
          const quotaNumber = i + 1;
          const existingQuota = prevQuotas.find(q => q.quotaNumber === quotaNumber);
          
          if (existingQuota) {
            // 기존 구좌가 있으면 그대로 사용
            newQuotas.push(existingQuota);
          } else {
            // 새로운 구좌 생성
            newQuotas.push({
              id: quotaNumber,
              quotaNumber: quotaNumber,
              status: 'unopened',
              openedDate: undefined,
              images: [],
              receipts: []
            });
          }
        }
        
        return newQuotas;
      });
    } else {
      setQuotas([]);
    }
  }, [quotaCount]);

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
    if (!formData.reviewGuide) validationErrors.push("리뷰 가이드");
    
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
      // 구좌 데이터 준비 - 새로 추가된 파일만 전송
      const quotasData = await Promise.all(quotas.map(async (quota) => {
        const quotaData: any = {
          quotaNumber: quota.quotaNumber,
          images: [],
          receipts: []
        };

        // 새로 추가된 이미지들만 base64로 변환
        for (const image of quota.images) {
          // 기존 파일이 아닌 새로 업로드된 파일만 처리
          const isNewFile = image.file.size > 0 && 
                           !image.file.name.startsWith('existing-') && 
                           image.file.type.startsWith('image/');
          
          if (isNewFile) {
            try {
              const base64 = await fileToBase64(image.file);
              quotaData.images.push({ base64 });
            } catch (error) {
              console.error('이미지 변환 실패:', error);
            }
          }
        }

        // 새로 추가된 영수증들만 base64로 변환
        for (const receipt of quota.receipts) {
          // 기존 파일이 아닌 새로 업로드된 파일만 처리
          const isNewFile = receipt.file.size > 0 && 
                           !receipt.file.name.startsWith('existing-') && 
                           receipt.file.type.startsWith('image/');
          
          if (isNewFile) {
            try {
              const base64 = await fileToBase64(receipt.file);
              quotaData.receipts.push({ base64 });
            } catch (error) {
              console.error('영수증 변환 실패:', error);
            }
          }
        }

        return quotaData;
      }));

      // JSON 데이터 준비
      const requestData = {
        platform: formData.platform,
        product_name: isProductPlatform ? formData.productName : null,
        option_name: formData.optionName,
        price: formData.price,
        shipping_fee: formData.shippingFee,
        seller: formData.seller,
        status: formData.status,
        start_date: formData.startDate,
        end_date: formData.endDate,
        title: formData.title,
        content: formData.content,
        rating: formData.rating,
        product_url: isProductPlatform ? formData.productUrl : null,
        store_name: !isProductPlatform ? formData.storeName : null,
        store_url: !isProductPlatform ? formData.storeUrl : null,
        review_fee: formData.reviewFee,
        reservation_amount: formData.reservationAmount,
        daily_count: formData.dailyCount,
        search_keyword: formData.searchKeyword,
        purchase_cost: formData.purchaseCost,
        provider1: selectedProviders[0]?.id || null,
        provider2: selectedProviders[1]?.id || null,
        provider3: selectedProviders[2]?.id || null,
        guide: formData.reviewGuide,
        quotas_data: quotasData.filter(quota => 
          // 새로 추가된 파일이 하나라도 있는 구좌만 전송
          quota.images.length > 0 || quota.receipts.length > 0
        )
      };
      
      // API 호출
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '리뷰 수정에 실패했습니다.');
      }
      
      toast({
        title: "리뷰 수정 성공",
        description: "리뷰가 성공적으로 수정되었습니다.",
      });
      
      // 성공 시 데이터 다시 로드
      const loadReviewData = async () => {
        try {
          setIsLoading(true);
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
          
          // 구좌 정보 재설정
          if (review.slots && review.slots.length > 0) {
            setQuotaCount(review.slots.length.toString());
            
            const loadedQuotas: Quota[] = review.slots.map((slot: any) => ({
              id: slot.slot_number,
              quotaNumber: slot.slot_number,
              slotId: slot.id, // 실제 DB의 슬롯 ID 저장
              status: slot.status || 'unopened',
              openedDate: slot.opened_date, // 오픈 날짜 추가
              images: (slot.images || []).map((url: string, index: number) => ({
                file: new File([], `existing-image-${index}`, { type: 'image/jpeg' }),
                preview: url,
                uploadedAt: slot.images_updated_at ? new Date(slot.images_updated_at).toLocaleString('ko-KR') : new Date(slot.created_at).toLocaleString('ko-KR')
              })),
              receipts: (slot.receipts || []).map((url: string, index: number) => ({
                file: new File([], `existing-receipt-${index}`, { type: 'image/jpeg' }),
                preview: url,
                uploadedAt: slot.receipts_updated_at ? new Date(slot.receipts_updated_at).toLocaleString('ko-KR') : new Date(slot.created_at).toLocaleString('ko-KR')
              }))
            }));
            
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
      
      await loadReviewData();
    } catch (error) {
      toast({
        title: "리뷰 수정 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/reviews/${reviewId}`, {
        method: 'DELETE',
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '리뷰 삭제에 실패했습니다.');
      }
      
      toast({
        title: "리뷰 삭제 성공",
        description: "리뷰가 성공적으로 삭제되었습니다.",
      });
      
      // 성공 시 리뷰 목록 페이지로 이동
      router.push('/admin/reviews');
    } catch (error) {
      toast({
        title: "리뷰 삭제 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: "destructive",
      });
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
      const currentTime = new Date().toLocaleString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      const newFiles = Array.from(e.target.files).map((file, index) => ({
        file,
        preview: URL.createObjectURL(file),
        uploadedAt: `${currentTime} (신규 ${index + 1})`
      }));
      
      setQuotas(prev => prev.map(quota => 
        quota.id === quotaId 
          ? { ...quota, [type]: [...quota[type], ...newFiles] }
          : quota
      ));
    }
    
    // 파일 입력 초기화 (같은 파일을 다시 선택할 수 있도록)
    e.target.value = '';
  };

  // 구좌별 이미지/영수증 제거 핸들러
  const handleRemoveQuotaFile = async (quotaId: number, type: 'images' | 'receipts', fileIndex: number) => {
    const quota = quotas.find(q => q.id === quotaId);
    if (!quota) return;

    const fileToRemove = quota[type][fileIndex];
    const isExistingFile = fileToRemove.file.name.startsWith('existing-');
    
    // 기존 파일인 경우 서버에서 삭제
    if (isExistingFile) {
      try {
        const response = await fetch(`/api/reviews/${reviewId}/slots`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            slotNumber: quota.quotaNumber,
            fileType: type,
            fileUrl: fileToRemove.preview,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          toast({
            title: "파일 삭제 실패",
            description: errorData.error || "파일을 삭제할 수 없습니다.",
            variant: "destructive",
          });
          return;
        }

        toast({
          title: "파일 삭제 성공",
          description: "파일이 성공적으로 삭제되었습니다.",
        });
      } catch (error) {
        toast({
          title: "파일 삭제 실패",
          description: "파일 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
        return;
      }
    } else {
      // 새로 추가된 파일의 경우 미리보기 URL 해제
      URL.revokeObjectURL(fileToRemove.preview);
    }

    // 로컬 상태에서 파일 제거
    setQuotas(prev => prev.map(q => {
      if (q.id === quotaId) {
        const newFiles = [...q[type]];
        newFiles.splice(fileIndex, 1);
        return { ...q, [type]: newFiles };
      }
      return q;
    }));
  };

  // 구좌별 파일 추가 버튼 핸들러
  const handleAddQuotaFile = (quotaId: number, type: 'images' | 'receipts') => {
    const inputRef = quotaFileInputRefs.current[`${quotaId}-${type}`];
    if (inputRef) {
      inputRef.click();
    }
  };

  // 슬롯 상태 관리 핸들러들
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

  // 선택된 슬롯들의 상태를 일괄 변경 (실제 DB 업데이트)
  const handleBulkSlotStatusChange = async (newStatus: 'unopened' | 'available') => {
    if (selectedQuotas.size === 0) {
      toast({
        title: "선택된 슬롯이 없습니다",
        description: "상태를 변경할 슬롯을 먼저 선택해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsUpdatingSlots(true);
    
    try {
      // 선택된 슬롯들의 업데이트 데이터 준비
      const slotUpdates = quotas
        .filter(quota => selectedQuotas.has(quota.id) && quota.slotId)
        .map(quota => ({
          slotId: quota.slotId,
          status: newStatus,
          slotNumber: quota.quotaNumber
        }));

      if (slotUpdates.length === 0) {
        toast({
          title: "업데이트할 슬롯이 없습니다",
          description: "선택된 슬롯 중 유효한 슬롯이 없습니다.",
          variant: "destructive",
        });
        return;
      }

      // 일괄 업데이트 API 호출
      const response = await fetch(`/api/reviews/${reviewId}/bulk-update-slots`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slotUpdates: slotUpdates
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || '슬롯 상태 업데이트에 실패했습니다.');
      }

      // 로컬 상태 업데이트
      const currentDate = new Date().toISOString().split('T')[0];
      setQuotas(prev => prev.map(quota => 
        selectedQuotas.has(quota.id) 
          ? { 
              ...quota, 
              status: newStatus,
              openedDate: newStatus === 'available' ? currentDate : (newStatus === 'unopened' ? undefined : quota.openedDate)
            }
          : quota
      ));

      toast({
        title: "슬롯 상태 변경 완료",
        description: `선택된 ${selectedQuotas.size}개 슬롯의 상태가 ${newStatus === 'available' ? '활성' : '미오픈'}으로 변경되었습니다.`,
      });

      // 경고가 있는 경우 표시
      if (result.warnings && result.warnings.length > 0) {
        toast({
          title: "일부 업데이트 실패",
          description: `${result.warnings.length}개의 슬롯 업데이트에 실패했습니다.`,
          variant: "destructive",
        });
      }

      // 선택 해제
      setSelectedQuotas(new Set());
      setIsAllSelected(false);

    } catch (error) {
      toast({
        title: "슬롯 상태 변경 실패",
        description: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
        variant: "destructive",
      });
    } finally {
      setIsUpdatingSlots(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">이벤트 수정</h1>
      </div>

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

          {/* 리뷰 가이드 */}
          <div className="space-y-2 col-span-2">
            <Label htmlFor="reviewGuide">리뷰 가이드 <span className="text-red-500">*</span></Label>
            <Textarea
              id="reviewGuide"
              value={formData.reviewGuide}
              onChange={(e) => setFormData(prev => ({ ...prev, reviewGuide: e.target.value }))}
              placeholder="리뷰 작성 가이드를 입력하세요"
              className={!formData.reviewGuide ? "border-red-300 focus:border-red-500" : ""}
              rows={4}
              aria-required="true"
            />
            {!formData.reviewGuide && (
              <p className="text-red-500 text-sm mt-1">리뷰 가이드는 필수 입력사항입니다.</p>
            )}
          </div>

        </div>

        {/* 구좌 관리 섹션 */}
        <Separator />
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">구좌 관리</h2>
          
          <div className="space-y-2">
            <Label htmlFor="quotaCount">작성 가능한 구좌 수</Label>
            <div className="flex items-center gap-4">
              <Input
                id="quotaCount"
                type="number"
                min="0"
                max="100"
                value={quotaCount}
                onChange={(e) => setQuotaCount(e.target.value)}
                placeholder="구좌 수를 입력하세요"
                className="w-48"
              />
              <span className="text-sm text-muted-foreground">
                {quotas.length > 0 && `${quotas.length}개의 구좌가 생성되었습니다.`}
              </span>
            </div>
          </div>

          {quotas.length > 0 && (
            <div className="space-y-4">
              {/* 슬롯 상태 일괄 조작 버튼들 */}
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
                    선택된 슬롯: {selectedQuotas.size}개
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkSlotStatusChange('available')}
                    disabled={selectedQuotas.size === 0 || isUpdatingSlots}
                    className="text-green-600 border-green-300 hover:bg-green-50"
                  >
                    {isUpdatingSlots ? "업데이트 중..." : "선택 슬롯 활성화"}
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkSlotStatusChange('unopened')}
                    disabled={selectedQuotas.size === 0 || isUpdatingSlots}
                    className="text-gray-600 border-gray-300 hover:bg-gray-50"
                  >
                    {isUpdatingSlots ? "업데이트 중..." : "선택 슬롯 미오픈"}
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12 text-center">선택</TableHead>
                    <TableHead className="w-20 text-center">구좌번호</TableHead>
                    <TableHead className="w-15 text-center">상태</TableHead>
                    <TableHead className="w-20 text-center">오픈일자</TableHead>
                    <TableHead className="text-center">이미지</TableHead>
                    <TableHead className="text-center">영수증</TableHead>
                    <TableHead className="text-center">작성일시</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {quotas.map((quota) => (
                    <TableRow key={quota.id} className={quota.status === 'unopened' ? 'bg-gray-50' : ''}>
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
                            : quota.status === 'reserved'
                            ? 'bg-blue-100 text-blue-800'
                            : quota.status === 'complete'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {quota.status === 'available' ? '오픈' 
                           : quota.status === 'reserved' ? '예약됨'
                           : quota.status === 'complete' ? '완료'
                           : '미오픈'}
                        </span>
                      </TableCell>
                      
                      {/* 오픈일자 */}
                      <TableCell className="text-center border-r">
                        <span className="text-sm text-gray-600">
                          {quota.openedDate ? new Date(quota.openedDate).toLocaleDateString('ko-KR') : '-'}
                        </span>
                      </TableCell>
                      
                      {/* 이미지 셀 */}
                      <TableCell className="border-r">
                        <div 
                          className="min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center"
                          onClick={() => handleAddQuotaFile(quota.id, 'images')}
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
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center">
                              <Plus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                              <span className="text-xs text-gray-500">이미지 첨부</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* 영수증 셀 */}
                      <TableCell className="border-r">
                        <div 
                          className="min-h-[60px] border-2 border-dashed border-gray-300 rounded-lg p-2 hover:border-primary transition-colors cursor-pointer flex flex-col items-center justify-center"
                          onClick={() => handleAddQuotaFile(quota.id, 'receipts')}
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
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center">
                              <Plus className="h-6 w-6 text-gray-400 mx-auto mb-1" />
                              <span className="text-xs text-gray-500">영수증 첨부</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* 작성일시 셀 */}
                      <TableCell className="text-center">
                        <div className="space-y-3">
                          {/* 이미지 작성일시 */}
                          {quota.images.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-blue-600 border-b border-blue-200 pb-1">이미지</div>
                              {quota.images.map((image, imageIndex) => (
                                <div key={imageIndex} className="text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded">
                                  파일 {imageIndex + 1}: {image.uploadedAt}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {/* 영수증 작성일시 */}
                          {quota.receipts.length > 0 && (
                            <div className="space-y-1">
                              <div className="text-xs font-medium text-green-600 border-b border-green-200 pb-1">영수증</div>
                              {quota.receipts.map((receipt, receiptIndex) => (
                                <div key={receiptIndex} className="text-xs text-gray-600 bg-green-50 px-2 py-1 rounded">
                                  파일 {receiptIndex + 1}: {receipt.uploadedAt}
                                </div>
                              ))}
                            </div>
                          )}
                          
                          {quota.images.length === 0 && quota.receipts.length === 0 && (
                            <span className="text-sm text-gray-400">파일 없음</span>
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
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">
                삭제
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>리뷰 삭제</AlertDialogTitle>
                <AlertDialogDescription>
                  정말로 이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>취소</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                  삭제
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button 
            type="submit" 
            disabled={isSubmitting || !formData.startDate || !formData.endDate}
          >
            {isSubmitting ? "수정 중..." : "수정"}
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
    </div>
  );
} 