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
import { Plus, X, Eye } from "lucide-react";
import Image from "next/image";
import { toast } from "@/components/ui/use-toast";
import { MultiProviderSelector, Provider } from "@/components/MultiProviderSelector";

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
  
  // 선택된 광고주 상태 변경 시 로그 출력
  useEffect(() => {
    console.log("선택된 광고주 목록:", selectedProviders);
  }, [selectedProviders]);

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

  const handleViewReview = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 시작일과 종료일 필수 입력 검증
    if (!formData.startDate || formData.startDate.trim() === '' || !formData.endDate || formData.endDate.trim() === '') {
      toast({
        title: "필수 정보 누락",
        description: "시작일과 종료일은 필수 입력사항입니다.",
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
      
      // JSON 데이터 준비
      const requestData = {
        platform: formData.platform,
        productName: formData.productName,
        optionName: formData.optionName,
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
        imageFiles: imageFiles,
        participants_data: participants.length > 0 ? participants : undefined,
        providers_data: selectedProviders.length > 0 ? selectedProviders : undefined,
      };
      
      // API 호출
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestData),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || '리뷰 등록에 실패했습니다.');
      }
      
      if (result.warning) {
        toast({
          title: "일부 데이터만 저장됨",
          description: result.warning,
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
                <SelectItem value="네이버 영수증">네이버 영수증</SelectItem>
                <SelectItem value="네이버 예약자">네이버 예약자</SelectItem>
                <SelectItem value="카카오">카카오</SelectItem>
                <SelectItem value="구글">구글</SelectItem>
                <SelectItem value="쿠팡">쿠팡</SelectItem>
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

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="productName">제품명</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              placeholder="제품명을 입력하세요"
              className={!formData.productName ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.productName && (
              <p className="text-red-500 text-sm mt-1">제품명은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 md:col-span-1">
            <Label htmlFor="optionName">옵션명</Label>
            <Input
              id="optionName"
              value={formData.optionName}
              onChange={(e) => setFormData(prev => ({ ...prev, optionName: e.target.value }))}
              placeholder="옵션명을 입력하세요"
              className={!formData.optionName ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.optionName && (
              <p className="text-red-500 text-sm mt-1">옵션명은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2">
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
            <Label htmlFor="price">가격</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="가격을 입력하세요"
              className={!formData.price ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.price && (
              <p className="text-red-500 text-sm mt-1">가격은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="shippingFee">배송비</Label>
            <Input
              id="shippingFee"
              type="number"
              value={formData.shippingFee}
              onChange={(e) => setFormData(prev => ({ ...prev, shippingFee: e.target.value }))}
              placeholder="배송비를 입력하세요"
              className={!formData.shippingFee ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.shippingFee && (
              <p className="text-red-500 text-sm mt-1">배송비는 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="seller">판매자</Label>
            <Input
              id="seller"
              value={formData.seller}
              onChange={(e) => setFormData(prev => ({ ...prev, seller: e.target.value }))}
              placeholder="판매자를 입력하세요"
              className={!formData.seller ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.seller && (
              <p className="text-red-500 text-sm mt-1">판매자는 필수 입력사항입니다.</p>
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

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="제목을 입력하세요"
              className={!formData.title ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.title && (
              <p className="text-red-500 text-sm mt-1">제목은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="content">내용</Label>
            <Input
              id="content"
              value={formData.content}
              onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="내용을 입력하세요"
              className={!formData.content ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.content && (
              <p className="text-red-500 text-sm mt-1">내용은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="rating">평점</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData(prev => ({ ...prev, rating: e.target.value }))}
              placeholder="평점을 입력하세요 (1-5)"
              className={!formData.rating ? "border-red-300 focus:border-red-500" : ""}
              aria-required="true"
            />
            {!formData.rating && (
              <p className="text-red-500 text-sm mt-1">평점은 필수 입력사항입니다.</p>
            )}
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="productUrl">상품 URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="productUrl"
                value={formData.productUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, productUrl: e.target.value }))}
                placeholder="상품 URL을 입력하세요"
                className={!formData.productUrl ? "border-red-300 focus:border-red-500" : ""}
                aria-required="true"
              />
              {formData.productUrl && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="whitespace-nowrap"
                >
                  <a
                    href={formData.productUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    링크 이동
                  </a>
                </Button>
              )}
            </div>
            {!formData.productUrl && (
              <p className="text-red-500 text-sm mt-1">상품 URL은 필수 입력사항입니다.</p>
            )}
          </div>
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
    </div>
  );
} 