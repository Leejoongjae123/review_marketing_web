"use client";
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
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/utils/supabase/client";
import { MultiProviderSelector, Provider } from "@/components/MultiProviderSelector";

// 참여자 타입 정의
interface Participant {
  id: string;
  name: string;
  phone: string;
  login_account: string;
  event_account: string;
  nickname: string;
  review_image?: string;
}

// 리뷰 타입 정의
interface Review {
  id: string;
  title: string;
  content: string;
  rating: number;
  status: string;
  author_id?: string;
  author_name?: string;
  product_id?: string;
  product_name: string;
  platform: string;
  image_url?: string;
  option_name?: string;
  price?: number;
  shipping_fee?: number;
  seller?: string;
  participants?: number;
  period?: string;
  product_url?: string;
  created_at: string;
  updated_at?: string;
  start_date?: string;
  end_date?: string;
  provider1?: string;
  provider2?: string;
  provider3?: string;
  provider1_name?: string;
  provider2_name?: string;
  provider3_name?: string;
}

export default function EditReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const unwrappedParams = React.use(params);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([]);

  const [formData, setFormData] = useState({
    platform: "",
    product_name: "",
    option_name: "",
    price: "",
    shipping_fee: "",
    seller: "",
    participants: "",
    status: "",
    start_date: "",
    end_date: "",
    title: "",
    content: "",
    rating: "",
    product_url: "",
    period: "",
  });

  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const supabase = createClient();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 현재 페이지에 따라 표시할 데이터 계산
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentParticipants = participants.slice(indexOfFirstItem, indexOfLastItem);

  // 페이지 변경 핸들러
  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
  };

  // 페이지네이션 버튼 생성
  const renderPagination = () => {
    const pageNumbers = [];
    for (let i = 1; i <= Math.ceil(participants.length / itemsPerPage); i++) {
      pageNumbers.push(i);
    }

    return (
      <div className="flex justify-center mt-4">
        {pageNumbers.map((number) => (
          <button
            key={number}
            onClick={() => handlePageChange(number)}
            className={`px-3 py-1 mx-1 border rounded ${
              currentPage === number ? "bg-primary text-white" : "bg-white"
            }`}
          >
            {number}
          </button>
        ))}
      </div>
    );
  };

  useEffect(() => {
    const fetchReviewData = async () => {
      setIsLoading(true);
      try {
        // 리뷰 데이터 가져오기
        const reviewResponse = await fetch(
          `/api/reviews/${unwrappedParams.id}`
        );
        if (!reviewResponse.ok) {
          const errorData = await reviewResponse.json().catch(() => ({}));
          console.error("리뷰 데이터 요청 실패:", {
            status: reviewResponse.status,
            statusText: reviewResponse.statusText,
            error: errorData.error || "알 수 없는 오류",
          });
          throw new Error(
            `리뷰 데이터를 가져오는데 실패했습니다. 상태: ${reviewResponse.status}`
          );
        }
        const reviewData = await reviewResponse.json();
        const review = reviewData.review as Review;

        if (review) {
          // 시작일과 종료일로부터 이벤트 기간 계산
          let periodValue = "";
          if (review.start_date && review.end_date) {
            const startDate = new Date(review.start_date);
            const endDate = new Date(review.end_date);

            // 날짜 형식 변환 (YYYY.MM.DD 형식)
            const formatDate = (date: Date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, "0");
              const day = String(date.getDate()).padStart(2, "0");
              return `${year}.${month}.${day}`;
            };

            periodValue = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
          }

          setFormData({
            platform: review.platform || "",
            product_name: review.product_name || "",
            option_name: review.option_name || "",
            price: review.price?.toString() || "",
            shipping_fee: review.shipping_fee?.toString() || "",
            seller: review.seller || "",
            participants: review.participants?.toString() || "",
            status: review.status || "pending",
            start_date: review.start_date
              ? new Date(review.start_date).toISOString().substring(0, 16)
              : "",
            end_date: review.end_date
              ? new Date(review.end_date).toISOString().substring(0, 16)
              : "",
            title: review.title || "",
            content: review.content || "",
            rating: review.rating?.toString() || "",
            product_url: review.product_url || "",
            period: periodValue || review.period || "",
          });

          // 광고주 정보 설정
          const providers: Provider[] = [];
          if (review.provider1 && review.provider1_name) {
            providers.push({
              id: review.provider1,
              full_name: review.provider1_name,
              email: ""
            });
          }
          if (review.provider2 && review.provider2_name) {
            providers.push({
              id: review.provider2,
              full_name: review.provider2_name,
              email: ""
            });
          }
          if (review.provider3 && review.provider3_name) {
            providers.push({
              id: review.provider3,
              full_name: review.provider3_name,
              email: ""
            });
          }
          setSelectedProviders(providers);

          // 이미지 URL이 있으면 이미지 배열에 추가
          if (review.image_url) {
            setImages([
              {
                file: new File([], "image.jpg"), // 더미 파일 객체
                preview: review.image_url,
              },
            ]);
          }
        }

        // 참여자 데이터 가져오기
        const participantsResponse = await fetch(
          `/api/reviews/${unwrappedParams.id}/participants`
        );
        if (!participantsResponse.ok) {
          const errorData = await participantsResponse.json().catch(() => ({}));
          console.error("참여자 데이터 요청 실패:", {
            status: participantsResponse.status,
            statusText: participantsResponse.statusText,
            error: errorData.error || "알 수 없는 오류",
          });
          throw new Error(
            `참여자 데이터를 가져오는데 실패했습니다. 상태: ${participantsResponse.status}`
          );
        }
        const participantsData = await participantsResponse.json();
        setParticipants(participantsData.participants || []);
      } catch (err) {
        console.error("데이터 로딩 오류:", err);
        setError(
          err instanceof Error
            ? err.message
            : "데이터를 불러오는 중 오류가 발생했습니다."
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviewData();
  }, [unwrappedParams.id]);

  // startDate나 endDate가 변경될 때 period 자동 업데이트
  useEffect(() => {
    if (formData.start_date && formData.end_date) {
      const startDate = new Date(formData.start_date);
      const endDate = new Date(formData.end_date);

      // 날짜 형식 변환 (YYYY.MM.DD 형식)
      const formatDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}.${month}.${day}`;
      };

      const periodValue = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
      setFormData((prev) => ({ ...prev, period: periodValue }));
    }
  }, [formData.start_date, formData.end_date]);

  const handleViewReview = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 이미지 업로드 처리
      let imageUrl = "";
      if (images.length > 0 && images[0].file.size > 0) {
        const formData = new FormData();
        formData.append("file", images[0].file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("이미지 업로드에 실패했습니다.");
        }

        const uploadData = await uploadResponse.json();
        imageUrl = uploadData.url;
      } else if (images.length > 0) {
        // 기존 이미지 URL 유지
        imageUrl = images[0].preview;
      }

      // provider 처리
      const provider1 = selectedProviders.length > 0 ? selectedProviders[0].id : "";
      const provider2 = selectedProviders.length > 1 ? selectedProviders[1].id : "";
      const provider3 = selectedProviders.length > 2 ? selectedProviders[2].id : "";

      console.log("제출하는 광고주 정보:", { provider1, provider2, provider3 });
      
      // 리뷰 데이터 업데이트
      const reviewData = {
        platform: formData.platform,
        product_name: formData.product_name,
        option_name: formData.option_name,
        price: formData.price,
        shipping_fee: formData.shipping_fee,
        seller: formData.seller,
        participants: formData.participants,
        status: formData.status,
        start_date: formData.start_date,
        end_date: formData.end_date,
        title: formData.title,
        content: formData.content,
        rating: formData.rating,
        product_url: formData.product_url,
        image_url: imageUrl,
        provider1,
        provider2,
        provider3
      };

      console.log("제출하는 데이터:", reviewData);

      const response = await fetch(`/api/reviews/${unwrappedParams.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(reviewData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "리뷰 수정에 실패했습니다.");
      }

      const result = await response.json();
      
      // 응답 데이터 확인 로깅
      console.log("API 응답 데이터:", result);
      if (result.review) {
        console.log("받은 광고주 정보:", {
          provider1: result.review.provider1,
          provider2: result.review.provider2,
          provider3: result.review.provider3,
          provider1_name: result.review.provider1_name,
          provider2_name: result.review.provider2_name,
          provider3_name: result.review.provider3_name
        });
      }
      
      // 성공 메시지 표시
      toast({
        title: "수정 완료",
        description: "리뷰가 성공적으로 수정되었습니다.",
      });
      
      if (result.review) {
        const updatedReview = result.review;
        
        // 시작일과 종료일로부터 이벤트 기간 계산
        let periodValue = "";
        if (updatedReview.start_date && updatedReview.end_date) {
          const startDate = new Date(updatedReview.start_date);
          const endDate = new Date(updatedReview.end_date);

          // 날짜 형식 변환 (YYYY.MM.DD 형식)
          const formatDate = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, "0");
            const day = String(date.getDate()).padStart(2, "0");
            return `${year}.${month}.${day}`;
          };

          periodValue = `${formatDate(startDate)} ~ ${formatDate(endDate)}`;
        }
        
        // 광고주 정보 유지
        const updatedProviders: Provider[] = [];
        
        // 서버에서 응답한 광고주 정보가 있으면 사용
        if (updatedReview.provider1 && updatedReview.provider1_name) {
          updatedProviders.push({
            id: updatedReview.provider1,
            full_name: updatedReview.provider1_name,
            email: ""
          });
        }
        if (updatedReview.provider2 && updatedReview.provider2_name) {
          updatedProviders.push({
            id: updatedReview.provider2,
            full_name: updatedReview.provider2_name,
            email: ""
          });
        }
        if (updatedReview.provider3 && updatedReview.provider3_name) {
          updatedProviders.push({
            id: updatedReview.provider3,
            full_name: updatedReview.provider3_name,
            email: ""
          });
        }
        
        // 서버 응답에 광고주 정보가 없고, 선택된 광고주가 있을 경우 기존 선택 정보 유지
        if (updatedProviders.length === 0 && selectedProviders.length > 0) {
          setSelectedProviders(selectedProviders);
        } else {
          setSelectedProviders(updatedProviders);
        }

        setFormData({
          platform: updatedReview.platform || "",
          product_name: updatedReview.product_name || "",
          option_name: updatedReview.option_name || "",
          price: updatedReview.price?.toString() || "",
          shipping_fee: updatedReview.shipping_fee?.toString() || "",
          seller: updatedReview.seller || "",
          participants: updatedReview.participants?.toString() || "",
          status: updatedReview.status || "pending",
          start_date: updatedReview.start_date
            ? new Date(updatedReview.start_date).toISOString().substring(0, 16)
            : "",
          end_date: updatedReview.end_date
            ? new Date(updatedReview.end_date).toISOString().substring(0, 16)
            : "",
          title: updatedReview.title || "",
          content: updatedReview.content || "",
          rating: updatedReview.rating?.toString() || "",
          product_url: updatedReview.product_url || "",
          period: periodValue || updatedReview.period || "",
        });
      }
    } catch (err) {
      toast({
        title: "오류",
        description:
          err instanceof Error
            ? err.message
            : "리뷰 수정 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      // 새 이미지로 교체 (기존 이미지 제거)
      const newImages = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));

      // 기존 미리보기 URL 해제
      images.forEach((img) => URL.revokeObjectURL(img.preview));

      setImages(newImages);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleAddImage = () => {
    fileInputRef.current?.click();
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }
  console.log('selectedProviders', selectedProviders)

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">제품 수정</h1>

      <form onSubmit={handleSubmit} className="space-y-6 w-full">
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline" onClick={() => router.back()}>
            취소
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? <Spinner className="mr-2 h-4 w-4 text-white" /> : null}
            수정
          </Button>
        </div>
        <div className="space-y-4">
          <Label>제품 이미지</Label>
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
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
            {images.length === 0 && (
              <button
                type="button"
                onClick={handleAddImage}
                className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center hover:border-primary transition-colors"
              >
                <Plus className="h-8 w-8 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="platform">플랫폼</Label>
            <Select
              value={formData.platform}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, platform: value }))
              }
            >
              <SelectTrigger>
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
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, status: value }))
              }
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
            <Label htmlFor="product_name">제품명</Label>
            <Input
              id="product_name"
              value={formData.product_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  product_name: e.target.value,
                }))
              }
              placeholder="제품명을 입력하세요"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="option_name">옵션명</Label>
            <Input
              id="option_name"
              value={formData.option_name}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  option_name: e.target.value,
                }))
              }
              placeholder="옵션명을 입력하세요"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label>광고주</Label>
            <MultiProviderSelector 
              value={selectedProviders}
              onChange={setSelectedProviders}
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="price">가격</Label>
            <Input
              id="price"
              type="number"
              value={formData.price}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="가격을 입력하세요"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="shipping_fee">배송비</Label>
            <Input
              id="shipping_fee"
              type="number"
              value={formData.shipping_fee}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  shipping_fee: e.target.value,
                }))
              }
              placeholder="배송비를 입력하세요"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="seller">판매자</Label>
            <Input
              id="seller"
              value={formData.seller}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, seller: e.target.value }))
              }
              placeholder="판매자를 입력하세요"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="participants">참여자 수</Label>
            <Input
              id="participants"
              type="number"
              value={formData.participants}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  participants: e.target.value,
                }))
              }
              placeholder="참여자 수를 입력하세요"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="start_date">시작일</Label>
            <Input
              id="start_date"
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, start_date: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="end_date">종료일</Label>
            <Input
              id="end_date"
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, end_date: e.target.value }))
              }
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="title">제목</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, title: e.target.value }))
              }
              placeholder="제목을 입력하세요"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="content">내용</Label>
            <Input
              id="content"
              value={formData.content}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, content: e.target.value }))
              }
              placeholder="내용을 입력하세요"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="rating">평점</Label>
            <Input
              id="rating"
              type="number"
              value={formData.rating}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, rating: e.target.value }))
              }
              placeholder="평점을 입력하세요"
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="product_url">상품 URL</Label>
            <div className="flex items-center gap-2">
              <Input
                id="product_url"
                value={formData.product_url}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    product_url: e.target.value,
                  }))
                }
                placeholder="상품 URL을 입력하세요"
                className="flex-1"
              />
              {formData.product_url && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="whitespace-nowrap"
                >
                  <a
                    href={formData.product_url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    링크 이동
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">참여 인원</h2>
          <div className="border rounded-lg">
            <Table>
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
                {currentParticipants.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell>{indexOfFirstItem + index + 1}</TableCell>
                    <TableCell>{participant.name}</TableCell>
                    <TableCell>{participant.phone}</TableCell>
                    <TableCell>{participant.login_account}</TableCell>
                    <TableCell>{participant.event_account}</TableCell>
                    <TableCell>{participant.nickname}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
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
                {currentParticipants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      등록된 참여자가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {renderPagination()}
      </form>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setSelectedParticipant(null);
          }
        }}
      >
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
                  <Input value={selectedParticipant.login_account} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>이벤트계정</Label>
                  <Input value={selectedParticipant.event_account} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>닉네임</Label>
                  <Input value={selectedParticipant.nickname} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>리뷰 인증 이미지</Label>
                  {selectedParticipant.review_image ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border mt-2 w-full max-w-md mx-auto">
                      <Image
                        src={selectedParticipant.review_image}
                        alt="리뷰 인증 이미지"
                        fill
                        className="object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  ) : (
                    <div className="text-center p-4 border rounded-md">
                      리뷰 이미지가 없습니다.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
