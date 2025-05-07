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

export default function EditReviewPage({ params }: { params: Promise<{ id: string }> }) {
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
  });
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
    console.log('제품 수정:', { ...formData, images });
    router.push('/provider/reviews');
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">제품 상세</h1>

      <div className="space-y-6 w-full">
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
          <div className="grid grid-cols-6 gap-4">
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
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              disabled={true}
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

          <div className="space-y-2">
            <Label htmlFor="platform">플랫폼</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) => setFormData(prev => ({ ...prev, platform: value }))}
              disabled={true}
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

          <div className="space-y-2">
            <Label htmlFor="productName">제품명</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
              placeholder="제품명을 입력하세요"
              readOnly={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="optionName">옵션명</Label>
            <Input
              id="optionName"
              value={formData.optionName}
              onChange={(e) => setFormData(prev => ({ ...prev, optionName: e.target.value }))}
              placeholder="옵션명을 입력하세요"
              readOnly={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">가격</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
              placeholder="가격을 입력하세요"
              readOnly={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shippingFee">배송비</Label>
            <Input
              id="shippingFee"
              type="number"
              value={formData.shippingFee}
              onChange={(e) => setFormData(prev => ({ ...prev, shippingFee: e.target.value }))}
              placeholder="배송비를 입력하세요"
              readOnly={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="seller">판매자</Label>
            <Input
              id="seller"
              value={formData.seller}
              onChange={(e) => setFormData(prev => ({ ...prev, seller: e.target.value }))}
              placeholder="판매자를 입력하세요"
              readOnly={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">참여자 수</Label>
            <Input
              id="participants"
              type="number"
              value={formData.participants}
              onChange={(e) => setFormData(prev => ({ ...prev, participants: e.target.value }))}
              placeholder="참여자 수를 입력하세요"
              className="text-center"
              readOnly={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="startDate">시작일</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
              readOnly={true}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="endDate">종료일</Label>
            <Input
              id="endDate"
              type="date"
              value={formData.endDate}
              onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
              readOnly={true}
            />
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">참여자 목록</h2>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12 text-center">번호</TableHead>
                  <TableHead>이름</TableHead>
                  <TableHead>전화번호</TableHead>
                  <TableHead>로그인 계정</TableHead>
                  <TableHead>이벤트 계정</TableHead>
                  <TableHead>닉네임</TableHead>
                  <TableHead className="text-center">리뷰</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {participants.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell className="text-center">{index + 1}</TableCell>
                    <TableCell>{participant.name}</TableCell>
                    <TableCell>{participant.phone}</TableCell>
                    <TableCell>{participant.loginAccount}</TableCell>
                    <TableCell>{participant.eventAccount}</TableCell>
                    <TableCell>{participant.nickname}</TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewReview(participant)}
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
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>리뷰 보기 - {selectedParticipant?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {selectedParticipant && (
              <div className="grid grid-cols-2 gap-4 p-4 border rounded-lg">
                <div className="space-y-2">
                  <Label className="font-semibold">ID</Label>
                  <p>{selectedParticipant.id}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">이름</Label>
                  <p>{selectedParticipant.name}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">전화번호</Label>
                  <p>{selectedParticipant.phone}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">로그인 계정</Label>
                  <p>{selectedParticipant.loginAccount}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">이벤트 계정</Label>
                  <p>{selectedParticipant.eventAccount}</p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold">닉네임</Label>
                  <p>{selectedParticipant.nickname}</p>
                </div>
              </div>
            )}
            {selectedParticipant?.reviewImage && (
              <div className="flex justify-center">
                <div className="relative w-full h-[500px]">
                  <Image
                    src={selectedParticipant.reviewImage}
                    alt="리뷰 이미지"
                    fill
                    className="object-contain"
                  />
                </div>
              </div>
            )}
            <div className="border rounded-lg p-4 bg-muted/50">
              <p className="text-sm text-muted-foreground">제품에 대한 리뷰 내용이 표시됩니다.</p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 