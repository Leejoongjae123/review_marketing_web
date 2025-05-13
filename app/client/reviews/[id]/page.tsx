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
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Plus,
  X,
  Eye,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { useToast } from "@/components/ui/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

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

// 커스텀 사용자 타입 정의 (필요한 경우)
interface CustomUserData {
  id: string;
  email?: string;
  role?: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: {
    name?: string;
    phone_number?: string;
    email?: string;
    [key: string]: any;
  };
}

export default function ClientEditReviewPage() {
  const params = useParams();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
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
  const [filteredParticipants, setFilteredParticipants] = useState<
    Participant[]
  >([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedParticipant, setSelectedParticipant] =
    useState<Participant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [newParticipant, setNewParticipant] = useState<Omit<Participant, "id">>(
    {
      name: "",
      phone: "",
      login_account: "",
      event_account: "",
      nickname: "",
    }
  );
  const [newParticipantImages, setNewParticipantImages] = useState<
    { file: File; preview: string }[]
  >([]);
  const newParticipantFileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const supabase = createClient();

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredParticipants.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedParticipants = filteredParticipants.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  // 이벤트계정 기준 검색 함수
  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredParticipants(participants);
    } else {
      const filtered = participants.filter((participant) =>
        participant.event_account
          .toLowerCase()
          .includes(searchTerm.toLowerCase())
      );
      setFilteredParticipants(filtered);
    }
    setCurrentPage(1);
  };

  // 검색어 변경 시 핸들러
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  // Enter 키 입력 시 검색 실행
  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  // 참여자 데이터가 변경될 때마다 필터링된 참여자 목록 업데이트
  useEffect(() => {
    setFilteredParticipants(participants);
  }, [participants]);

  const getUser = async () => {
    try {
      const { data, error } = await supabase.auth.getUser();
      if (error) {
        throw error;
      }

      setUser(data.user);

      // 새 참여자 초기값 설정
      setNewParticipant({
        name: data.user?.user_metadata?.name || "",
        phone: data.user?.user_metadata?.phone_number || "",
        login_account: data.user?.email || "",
        event_account: "",
        nickname: "",
      });
    } catch (error) {
      console.error("사용자 정보 불러오기 오류:", error);
    }
  };

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    const fetchReviewData = async () => {
      setIsLoading(true);
      try {
        // 리뷰 데이터 가져오기
        const reviewResponse = await fetch(`/api/reviews/${params.id}`);
        if (!reviewResponse.ok) {
          const errorData = await reviewResponse.json().catch(() => ({}));
          console.error('리뷰 데이터 요청 실패:', {
            status: reviewResponse.status,
            statusText: reviewResponse.statusText,
            error: errorData.error || '알 수 없는 오류'
          });
          throw new Error(`리뷰 데이터를 가져오는데 실패했습니다. 상태: ${reviewResponse.status}`);
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
            productName: review.product_name || "",
            optionName: review.option_name || "",
            price: review.price?.toString() || "",
            shippingFee: review.shipping_fee?.toString() || "",
            seller: review.seller || "",
            participants: review.participants?.toString() || "",
            status: review.status || "pending",
            startDate: review.start_date
              ? new Date(review.start_date).toISOString().split("T")[0]
              : "",
            endDate: review.end_date
              ? new Date(review.end_date).toISOString().split("T")[0]
              : "",
            title: review.title || "",
            content: review.content || "",
            rating: review.rating?.toString() || "",
            productUrl: review.product_url || "",
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
          `/api/reviews/${params.id}/participants`
        );
        if (!participantsResponse.ok) {
          const errorData = await participantsResponse.json().catch(() => ({}));
          console.error('참여자 데이터 요청 실패:', {
            status: participantsResponse.status,
            statusText: participantsResponse.statusText,
            error: errorData.error || '알 수 없는 오류'
          });
          throw new Error(`참여자 데이터를 가져오는데 실패했습니다. 상태: ${participantsResponse.status}`);
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
  }, [params.id]);

  // startDate나 endDate가 변경될 때 period 자동 업데이트
  useEffect(() => {
    if (formData.startDate && formData.endDate) {
      const startDate = new Date(formData.startDate);
      const endDate = new Date(formData.endDate);

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
  }, [formData.startDate, formData.endDate]);

  const handleViewReview = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: API 연동
    console.log("리뷰 수정:", { ...formData, images });
    // 페이지 이동 방지
    // router.push("/client/reviews");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setImages((prev) => [...prev, ...newImages]);
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

  const handleAddParticipant = async () => {
    try {
      // 필수 필드 검증
      if (
        !newParticipant.name ||
        !newParticipant.phone ||
        !newParticipant.login_account ||
        !newParticipant.event_account ||
        !newParticipant.nickname
      ) {
        // Alert Dialog로 변경
        setError("모든 필수 필드를 입력해주세요.");
        return;
      }

      setIsSubmitting(true);

      // 이미지 업로드 처리
      let reviewImageUrl = "";
      if (newParticipantImages.length > 0) {
        const formData = new FormData();
        formData.append("file", newParticipantImages[0].file);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("이미지 업로드에 실패했습니다.");
        }

        const uploadData = await uploadResponse.json();
        reviewImageUrl = uploadData.url;
      }

      // 참여자 등록 API 호출
      const response = await fetch(`/api/reviews/${params.id}/participants`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newParticipant,
          review_image: reviewImageUrl,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "참여자 등록에 실패했습니다.");
      }

      // 성공적으로 등록된 경우 참여자 목록 새로고침
      const participantsResponse = await fetch(
        `/api/reviews/${params.id}/participants`
      );
      if (!participantsResponse.ok) {
        throw new Error("참여자 데이터를 가져오는데 실패했습니다.");
      }
      const participantsData = await participantsResponse.json();
      setParticipants(participantsData.participants || []);

      // 모달 닫기 및 입력값 초기화
      setIsAddModalOpen(false);
      setIsSuccessModalOpen(true);
      setNewParticipant({
        name: user?.user_metadata?.name || "",
        phone: user?.user_metadata?.phone_number || "",
        login_account: user?.email || "",
        event_account: "",
        nickname: "",
      });
      setNewParticipantImages([]);
    } catch (error) {
      console.error("참여자 등록 오류:", error);
      // Alert Dialog로 변경
      setError(
        error instanceof Error
          ? error.message
          : "참여자 등록 중 오류가 발생했습니다."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNewParticipantImageChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files && e.target.files.length > 0) {
      const newImages = Array.from(e.target.files).map((file) => ({
        file,
        preview: URL.createObjectURL(file),
      }));
      setNewParticipantImages((prev) => [...prev, ...newImages]);
    }
  };

  const handleRemoveNewParticipantImage = (index: number) => {
    setNewParticipantImages((prev) => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleAddNewParticipantImage = () => {
    newParticipantFileInputRef.current?.click();
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
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2  gap-4">
          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="platform">플랫폼</Label>
            <Input
              id="platform"
              value={formData.platform}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, platform: e.target.value }))
              }
              placeholder="플랫폼을 입력하세요"
              disabled
            />
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
            <Label htmlFor="productName">제품명</Label>
            <Input
              id="productName"
              value={formData.productName}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  productName: e.target.value,
                }))
              }
              placeholder="제품명을 입력하세요"
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="optionName">옵션명</Label>
            <Input
              id="optionName"
              value={formData.optionName}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, optionName: e.target.value }))
              }
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
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, price: e.target.value }))
              }
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
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  shippingFee: e.target.value,
                }))
              }
              placeholder="배송비를 입력하세요"
              disabled
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
              disabled
            />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="title">제목</Label>
            <Input id="title" value={formData.title || ""} disabled />
          </div>

          <div className="space-y-2 col-span-2 md:col-span-1">
            <Label htmlFor="content">내용</Label>
            <Input id="content" value={formData.content || ""} disabled />
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
            <Input id="period" value={formData.period || ""} disabled />
          </div>
        </div>

        <Separator className="my-6" />

        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">참여 내용</h2>
          </div>

          {/* 검색 입력 필드 추가 */}
          <div className="flex w-full items-center justify-between space-x-2 mb-4">
            <div className="flex items-center space-x-2">
              <Input
                type="text"
                placeholder="이벤트계정으로 검색"
                value={searchTerm}
                onChange={handleSearchChange}
                onKeyPress={handleKeyPress}
              />
              <Button type="button" onClick={handleSearch}>
                <Search className="h-4 w-4 mr-1" />
                검색
              </Button>
            </div>
            <div>
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
                {paginatedParticipants.map((participant, index) => (
                  <TableRow key={participant.id}>
                    <TableCell>{startIndex + index + 1}</TableCell>
                    <TableCell>{participant.name}</TableCell>
                    <TableCell>{participant.phone}</TableCell>
                    <TableCell>{participant.login_account}</TableCell>
                    <TableCell>{participant.event_account}</TableCell>
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

          {/* 페이지네이션 추가 */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-muted-foreground">
              전체 {filteredParticipants.length}개 항목 중 {startIndex + 1}-
              {Math.min(startIndex + itemsPerPage, filteredParticipants.length)}
              개 표시
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                이전
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let pageNumber;
                  if (totalPages <= 5) {
                    pageNumber = i + 1;
                  } else if (currentPage <= 3) {
                    pageNumber = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNumber = totalPages - 4 + i;
                  } else {
                    pageNumber = currentPage - 2 + i;
                  }
                  return (
                    <Button
                      key={pageNumber}
                      type="button"
                      variant={
                        currentPage === pageNumber ? "default" : "outline"
                      }
                      size="sm"
                      className="w-9"
                      onClick={() => setCurrentPage(pageNumber)}
                    >
                      {pageNumber}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
                disabled={currentPage === totalPages || totalPages === 0}
              >
                다음
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
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
                    <div className="relative aspect-square rounded-lg overflow-hidden border mt-2 w-32">
                      <Image
                        src={selectedParticipant.review_image}
                        alt="리뷰 인증 이미지"
                        fill
                        className="object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
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
                onChange={(e) =>
                  setNewParticipant((prev) => ({
                    ...prev,
                    name: e.target.value,
                  }))
                }
                placeholder="이름을 입력하세요"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>전화번호</Label>
              <Input
                value={newParticipant.phone}
                onChange={(e) =>
                  setNewParticipant((prev) => ({
                    ...prev,
                    phone: e.target.value,
                  }))
                }
                placeholder="전화번호를 입력하세요"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>로그인 계정</Label>
              <Input
                value={newParticipant.login_account}
                onChange={(e) =>
                  setNewParticipant((prev) => ({
                    ...prev,
                    login_account: e.target.value,
                  }))
                }
                placeholder="로그인 계정을 입력하세요"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>이벤트 계정</Label>
              <Input
                value={newParticipant.event_account}
                onChange={(e) =>
                  setNewParticipant((prev) => ({
                    ...prev,
                    event_account: e.target.value,
                  }))
                }
                placeholder="이벤트 계정을 입력하세요"
                disabled={isSubmitting}
              />
            </div>
            <div className="space-y-2">
              <Label>닉네임</Label>
              <Input
                value={newParticipant.nickname}
                onChange={(e) =>
                  setNewParticipant((prev) => ({
                    ...prev,
                    nickname: e.target.value,
                  }))
                }
                placeholder="닉네임을 입력하세요"
                disabled={isSubmitting}
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
                disabled={isSubmitting}
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
                      disabled={isSubmitting}
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={handleAddNewParticipantImage}
                  className="aspect-square border-2 border-dashed rounded-lg flex items-center justify-center hover:border-primary transition-colors"
                  disabled={isSubmitting}
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
                disabled={isSubmitting}
              >
                취소
              </Button>
              <Button
                type="button"
                onClick={handleAddParticipant}
                disabled={isSubmitting}
                className={isSubmitting ? "relative" : ""}
              >
                {isSubmitting ? (
                  <>
                    <Spinner size="sm" className="text-white" /> 등록 중...
                  </>
                ) : (
                  "등록"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isSuccessModalOpen} onOpenChange={setIsSuccessModalOpen}>
        <DialogContent className="max-w-md">
          <div className="flex flex-col items-center justify-center space-y-4 py-6">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold">등록이 완료되었습니다</h2>
            <p className="text-center text-muted-foreground">
              리뷰가 성공적으로 등록되었습니다.
            </p>
          </div>
          <DialogFooter>
            <Button
              className="w-full"
              onClick={() => setIsSuccessModalOpen(false)}
            >
              확인
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Error Alert Dialog로 변경 */}
      <AlertDialog
        open={!!error}
        onOpenChange={(open) => {
          if (!open) setError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>입력 오류</AlertDialogTitle>
            <AlertDialogDescription>{error}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={() => setError(null)}>
              확인
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
