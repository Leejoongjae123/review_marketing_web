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
import { Plus, X, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/utils/supabase/client";

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
}

// 페이지네이션 컴포넌트 정의
interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const Pagination = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}: PaginationProps) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center space-x-2 py-4">
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      <div className="flex items-center space-x-1">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <Button
            key={page}
            variant={page === currentPage ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className={page === currentPage ? "pointer-events-none" : ""}
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </div>
  );
};

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

  // 페이지네이션 상태 추가
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [formData, setFormData] = useState({
    platform: "",
    product_name: "",
    option_name: "",
    price: "",
    shipping_fee: "",
    seller: "",
    participants: "",
    status: "pending",
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
      console.log("수정 결과:", result);

      // 백엔드 응답에서 바로 리뷰 데이터 사용
      if (result.review) {
        const review = result.review;

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

        // 상태 업데이트
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
      } else {
        // 백엔드에서 리뷰 데이터를 반환하지 않은 경우 별도로 조회
        const refreshResponse = await fetch(
          `/api/reviews/${unwrappedParams.id}`
        );
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const review = refreshData.review;

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

          // 상태 업데이트
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
        }
      }


      // 성공 메시지 표시 후 리스트 페이지로 리다이렉트 제거
      // setTimeout(() => {
      //   router.push("/admin/reviews");
      // }, 1500);
    } catch (err) {
      console.error("리뷰 수정 오류:", err);
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

  // 현재 페이지에 표시할 참여자 목록 계산
  const paginatedParticipants = participants.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner size="lg" className="text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">이벤트 조회</h1>

      <div className="space-y-6 w-full">
        <div className="flex justify-end gap-4"></div>
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
                
              </div>
            ))}
            {images.length === 0 && (
              <div className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center">
                <span className="text-muted-foreground">이미지 없음</span>
              </div>
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
              disabled
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
              readOnly
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
              readOnly
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
              readOnly
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
              readOnly
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
              readOnly
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
              readOnly
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
              readOnly
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
              readOnly
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
              readOnly
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
              readOnly
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
              readOnly
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
                readOnly
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
                {paginatedParticipants.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell>
                      {(currentPage - 1) * itemsPerPage + index + 1}
                    </TableCell>
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
                {participants.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center">
                      등록된 참여자가 없습니다.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {participants.length > 0 && (
            <div className="border-t">{renderPagination()}</div>
          )}
        </div>
      </div>

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
