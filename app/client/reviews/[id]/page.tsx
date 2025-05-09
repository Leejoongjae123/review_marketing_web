'use client'
import React, { useState, useEffect, useRef } from "react";
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
import { mockReviews } from "@/lib/mock-data";

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

export default function ClientEditReviewPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const unwrappedParams = React.use(params);
  const [formData, setFormData] = useState({
    platform: "",
    productName: "",
    optionName: "",
    price: "",
    shippingFee: "",
    seller: "",
    participants: "",
    status: "pending",
    startDate: "",
    endDate: "",
    title: "",
    content: "",
    rating: "",
    productUrl: "",
    period: "",
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

  useEffect(() => {
    // TODO: API 연동
    const review = mockReviews.find(r => r.id === unwrappedParams.id);
    if (review) {
      setFormData({
        platform: review.platform,
        productName: review.productName,
        optionName: review.optionName,
        price: review.price?.toString() || "",
        shippingFee: review.shippingFee?.toString() || "",
        seller: review.seller,
        participants: review.participants?.toString() || "",
        status: review.status || "pending",
        startDate: (review as any).startDate || "",
        endDate: (review as any).endDate || "",
        title: review.title || "",
        content: review.content || "",
        rating: review.rating?.toString() || "",
        productUrl: review.productUrl || "",
        period: review.period || "",
      });
      // TODO: 기존 이미지 로드
    }

    // 임시 참여자 데이터
    setParticipants([
      {
        id: 1,
        name: "홍길동",
        phone: "010-1234-5678",
        loginAccount: "user1@example.com",
        eventAccount: "event1@example.com",
        nickname: "길동이",
        reviewImage: "/noimage.jpg"
      },
      // 더 많은 참여자 데이터 추가 가능
    ]);
  }, [unwrappedParams.id]);

  const handleViewReview = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 연동
    console.log('리뷰 수정:', { ...formData, images });
    router.push('/client/reviews');
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
      alert('이미 등록된 이벤트 계정입니다.');
      return;
    }

    const newId = Math.max(...participants.map(p => p.id), 0) + 1;
    setParticipants([...participants, { ...newParticipant, id: newId }]);
    setNewParticipant({
      name: '',
      phone: '',
      loginAccount: '',
      eventAccount: '',
      nickname: '',
    });
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">이벤트 상세</h1>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="space-y-4">
          <Label>리뷰 이미지</Label>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled
          />
          <div className="grid grid-cols-2 sm:grid-cols-6 gap-4">
            {images.map((image, index) => (
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

        <div className="grid grid-cols-2  gap-4">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="platform">플랫폼</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              disabled
            >
              <SelectTrigger>
                <SelectValue placeholder="플랫폼 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="coupang">쿠팡</SelectItem>
                <SelectItem value="gmarket">지마켓</SelectItem>
                <SelectItem value="11st">11번가</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              disabled
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
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="optionName">옵션명</Label>
            <Input
              id="optionName"
              value={formData.optionName}
              onChange={(e) => setFormData(prev => ({ ...prev, optionName: e.target.value }))}
              placeholder="옵션명을 입력하세요"
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="price">가격</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="가격을 입력하세요"
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="shippingFee">배송비</Label>
            <Input
              id="shippingFee"
              type="number"
              value={formData.shippingFee}
              onChange={(e) => setFormData(prev => ({ ...prev, shippingFee: e.target.value }))}
              placeholder="배송비를 입력하세요"
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="seller">판매자</Label>
            <Input
              id="seller"
              value={formData.seller}
              onChange={(e) => setFormData(prev => ({ ...prev, seller: e.target.value }))}
              placeholder="판매자를 입력하세요"
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="startDate">작성일</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={formData.title || ""}
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="content">내용</Label>
            <Input
              id="content"
              value={formData.content || ""}
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="rating">평점</Label>
            <Input
              id="rating"
              type="number"
              value={formData.rating || ""}
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="productUrl">상품 URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="productUrl"
                value={formData.productUrl || ""}
                disabled
                className="flex-1"
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
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="period">이벤트 기간</Label>
            <Input
              id="period"
              value={formData.period || ""}
              disabled
            />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">참여 내용</h2>
            <Button 
              type="button"
              onClick={(e) => {
                e.preventDefault();
                setIsAddModalOpen(true);
              }}
            >
              리뷰 작성
            </Button>
          </div>
          <div className="border rounded-lg overflow-x-auto">
            <Table className="min-w-[1000px] w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">번호</TableHead>
                  <TableHead className="w-[120px]">이름</TableHead>
                  <TableHead className="w-[150px]">연락처</TableHead>
                  <TableHead className="w-[200px]">로그인계정</TableHead>
                  <TableHead className="w-[200px]">이벤트계정</TableHead>
                  <TableHead className="w-[120px]">닉네임</TableHead>
                  <TableHead className="w-[100px]">리뷰인증</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant) => (
                  <TableRow key={participant.id}>
                    <TableCell>{participant.id}</TableCell>
                    <TableCell>{participant.name}</TableCell>
                    <TableCell>{participant.phone}</TableCell>
                    <TableCell>{participant.loginAccount}</TableCell>
                    <TableCell>{participant.eventAccount}</TableCell>
                    <TableCell>{participant.nickname}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleViewReview(participant);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        보기
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
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
            <DialogTitle>리뷰 작성</DialogTitle>
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