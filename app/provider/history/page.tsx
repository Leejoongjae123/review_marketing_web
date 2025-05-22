"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
  X,
} from "lucide-react";
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
import { Label } from "@/components/ui/label";
import Image from "next/image";
import Link from "next/link";
import { useToast } from "@/components/ui/use-toast";

// 페이지 컴포넌트에서 필요한 UserHistory 타입 선언
interface ReviewParticipant {
  id: string;
  name: string;
  phone: string;
  login_account: string;
  event_account: string;
  nickname: string;
  review_image: string | null;
  created_at: string;
  updated_at: string | null;
  review_id: string;
  reviews: {
    id: string;
    title: string;
    platform: string;
    product_name: string;
    option_name: string;
    price: number;
    shipping_fee: number;
    seller: string;
    period: string;
  };
}

interface ApiResponse {
  data: ReviewParticipant[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
  error?: string;
}

export default function AdminHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("name");
  const [participants, setParticipants] = useState<ReviewParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState<ReviewParticipant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchParticipants();
  }, [currentPage, itemsPerPage]);

  const fetchParticipants = async (search = false) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        pageSize: itemsPerPage.toString(),
      });

      if (search && searchTerm) {
        params.append('searchTerm', searchTerm);
        params.append('searchCategory', searchCategory);
      }

      const response = await fetch(`/api/provider/history?${params.toString()}`);
      const data: ApiResponse = await response.json();
      
      console.log('API Response:', data);

      if (data.error) {
        throw new Error(data.error);
      }

      setParticipants(data.data || []);
      setTotalCount(data.count || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.log('Error details:', error);
      toast({
        title: "오류",
        description: "데이터를 불러오는 중 오류가 발생했습니다.",
        variant: "destructive",
      });
      setParticipants([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    fetchParticipants(true);
  };

  const handleRowClick = (participant: ReviewParticipant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleDownloadExcel = () => {
    // 엑셀 다운로드 로직 구현
    const headers = [
      "번호",
      "이름",
      "연락처",
      "이메일",
      "참여계정",
      "참여 이벤트",
      "상태",
      "타임스탬프",
    ];
    const data = participants.map((participant) => [
      participant.id,
      participant.name,
      participant.phone,
      participant.login_account,
      participant.event_account,
      participant.reviews.title,
      "완료", // 기본값으로 완료 상태 설정
      new Date(participant.created_at).toLocaleString(),
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `응모이력_${new Date().toLocaleDateString()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  console.log("participants", participants);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 모달이 열리는 것을 방지
    if (window.confirm("정말로 이 항목을 삭제하시겠습니까?")) {
      try {
        const response = await fetch(`/api/participants/${id}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('삭제 중 오류가 발생했습니다.');
        }
        
        toast({
          title: "삭제 완료",
          description: "참가자 정보가 삭제되었습니다.",
        });
        
        // 데이터 다시 불러오기
        fetchParticipants();
      } catch (error) {
        console.error('Error deleting participant:', error);
        toast({
          title: "오류",
          description: "삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
      }
    }
  };

  // 상태값에 따른 스타일 및 텍스트 가져오기 (현재는 모두 완료 상태로 처리)
  const getStatusStyle = (status: string = "completed") => {
    switch (status) {
      case "completed":
        return {
          className: "bg-green-100 text-green-800",
          text: "완료"
        };
      case "pending":
        return {
          className: "bg-yellow-100 text-yellow-800",
          text: "대기중"
        };
      case "canceled":
        return {
          className: "bg-red-100 text-red-800",
          text: "취소"
        };
      default:
        return {
          className: "bg-gray-100 text-gray-800",
          text: "알수없음"
        };
    }
  };

  // 이미지 클릭 핸들러
  const handleImageClick = (imageUrl: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 이벤트 버블링 방지
    setSelectedImage(imageUrl);
    setIsImageModalOpen(true);
  };

  return (
    <div className="space-y-4 w-full h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">응모 관리</h1>
          <p className="text-muted-foreground">
            사용자들의 응모 이력을 확인합니다.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger>
              <SelectValue placeholder="검색 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">이름</SelectItem>
              <SelectItem value="phone">연락처</SelectItem>
              <SelectItem value="email">이메일</SelectItem>
              <SelectItem value="eventAccount">참여계정</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Input
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>
      <div className="flex justify-end items-center gap-4">
        <Button onClick={handleDownloadExcel} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(Number(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="페이지당 항목 수" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10개씩 보기</SelectItem>
            <SelectItem value="50">50개씩 보기</SelectItem>
            <SelectItem value="100">100개씩 보기</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">번호</TableHead>
              <TableHead className="w-[120px]">이름</TableHead>
              <TableHead className="w-[150px]">연락처</TableHead>
              <TableHead className="w-[200px]">이메일</TableHead>
              <TableHead className="w-[200px]">참여계정</TableHead>
              <TableHead className="w-[200px]">참여 이벤트</TableHead>
              <TableHead className="w-[100px]">상태</TableHead>
              <TableHead className="w-[120px]">리뷰이미지</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  데이터를 불러오는 중...
                </TableCell>
              </TableRow>
            ) : !participants || participants.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  데이터가 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              participants.map((participant) => (
                <TableRow
                  key={participant.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(participant)}
                >
                  <TableCell>{participant.id.substring(0, 8)}</TableCell>
                  <TableCell>{participant.name}</TableCell>
                  <TableCell>{participant.phone}</TableCell>
                  <TableCell>{participant.login_account}</TableCell>
                  <TableCell>{participant.event_account}</TableCell>
                  <TableCell 
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                  >
                    <Link 
                      href={`/provider/reviews/${encodeURIComponent(participant.reviews.id)}`}
                      className="text-blue-600 hover:underline"
                    >
                      {participant.reviews.title}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-md text-xs ${
                        getStatusStyle("completed").className
                      }`}
                    >
                      {getStatusStyle("completed").text}
                    </span>
                  </TableCell>
                  <TableCell>
                    {participant.review_image ? (
                      <div 
                        className="relative w-10 h-10 rounded-md overflow-hidden cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation(); // 행 클릭 방지
                          handleImageClick(participant.review_image!, e);
                        }}
                      >
                        <Image
                          src={participant.review_image}
                          alt="리뷰 이미지"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">없음</span>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {totalCount}개 항목 중 {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, totalCount)}개 표시
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1 || loading}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <div className="flex items-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(page => {
                // 현재 페이지 주변의 페이지만 보여주기
                const nearCurrentPage = 
                  page === 1 || 
                  page === totalPages || 
                  Math.abs(page - currentPage) <= 1;
                return nearCurrentPage;
              })
              .map((page, index, array) => {
                // 생략 표시 추가
                if (index > 0 && array[index - 1] !== page - 1) {
                  return (
                    <React.Fragment key={`ellipsis-${page}`}>
                      <span className="mx-1">...</span>
                      <Button
                        variant={currentPage === page ? "default" : "outline"}
                        size="sm"
                        className="w-9"
                        onClick={() => setCurrentPage(page)}
                        disabled={loading}
                      >
                        {page}
                      </Button>
                    </React.Fragment>
                  );
                }
                return (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => setCurrentPage(page)}
                    disabled={loading}
                  >
                    {page}
                  </Button>
                );
              })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
            disabled={currentPage === totalPages || loading}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
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
            <DialogTitle>응모 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedParticipant && (
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">이름</Label>
                <Input
                  id="name"
                  value={selectedParticipant.name}
                  readOnly
                  className=""
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  value={selectedParticipant.phone}
                  readOnly
                  className=""
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  value={selectedParticipant.login_account}
                  readOnly
                  className=""
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="eventAccount">참여계정</Label>
                <Input
                  id="eventAccount"
                  value={selectedParticipant.event_account}
                  readOnly
                  className=""
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="eventName">참여 이벤트</Label>
                <Input
                  id="eventName"
                  value={selectedParticipant.reviews.title}
                  readOnly
                  className=""
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="productInfo">제품 정보</Label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="productName" className="text-xs">상품명</Label>
                    <Input
                      id="productName"
                      value={selectedParticipant.reviews.product_name}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="optionName" className="text-xs">옵션</Label>
                    <Input
                      id="optionName"
                      value={selectedParticipant.reviews.option_name || '없음'}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="price" className="text-xs">가격</Label>
                    <Input
                      id="price"
                      value={`${selectedParticipant.reviews.price.toLocaleString()}원`}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="shippingFee" className="text-xs">배송비</Label>
                    <Input
                      id="shippingFee"
                      value={`${selectedParticipant.reviews.shipping_fee.toLocaleString()}원`}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="platform" className="text-xs">플랫폼</Label>
                    <Input
                      id="platform"
                      value={selectedParticipant.reviews.platform}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label htmlFor="seller" className="text-xs">판매자</Label>
                    <Input
                      id="seller"
                      value={selectedParticipant.reviews.seller}
                      readOnly
                      className="text-sm"
                    />
                  </div>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">상태</Label>
                <div className="h-10 px-3 py-2 rounded-md border border-input flex items-center">
                  <span
                    className={`px-2 py-1 rounded-md text-xs ${
                      getStatusStyle("completed").className
                    }`}
                  >
                    {getStatusStyle("completed").text}
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="createdAt">신청일</Label>
                <Input
                  id="createdAt"
                  value={new Date(selectedParticipant.created_at).toLocaleString()}
                  readOnly
                  className=""
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="reviewImage">리뷰 인증 이미지</Label>
                <div className="min-h-[150px] rounded-md flex items-center justify-start p-4">
                  {selectedParticipant.review_image ? (
                    <div 
                      className="relative aspect-square rounded-lg overflow-hidden w-32 cursor-pointer"
                      onClick={(e) => handleImageClick(selectedParticipant.review_image!, e)}
                    >
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
                    <span className="text-sm text-muted-foreground">
                      리뷰 이미지가 없습니다.
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 이미지 확대 모달 */}
      <Dialog
        open={isImageModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsImageModalOpen(false);
            setSelectedImage(null);
          }
        }}
      >
        <DialogContent className="max-w-5xl h-auto flex items-center justify-center p-2 sm:p-4">
          <div className="relative w-full">

            {selectedImage && (
              <div className="relative w-full flex items-center justify-center">
                <div className="relative max-w-full max-h-[80vh] aspect-auto">
                  <Image
                    src={selectedImage}
                    alt="확대된 이미지"
                    width={800}
                    height={800}
                    className="object-contain"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src =
                        "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
