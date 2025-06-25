'use client'
import React, { useEffect, useState } from "react";
import { mockReviews } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Download, Plus, Edit, Trash2, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useRouter } from "next/navigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { createClient } from "@/utils/supabase/client";
import { useToast } from "@/components/ui/use-toast";

interface Review {
  id: string | number;
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
  start_date: string;
  end_date: string;
  period?: string;
  product_url?: string;
  store_url?: string;
  store_name?: string;
  created_at: string;
  updated_at?: string;
  provider_id?: string;
  slots?: any[]; // 구좌 정보 배열
  daily_count: number;
  review_fee: number;
  reservation_amount?: number;
  purchase_cost?: number;
  search_keyword?: string;
}

export default function ProviderReviewsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pageSize, setPageSize] = useState(10);
  const [platformFilter, setPlatformFilter] = useState("전체");
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedReviews, setSelectedReviews] = useState<Set<string | number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

  // 플랫폼 필터 옵션 정의
  const platformOptions = [
    { label: "전체", value: "전체" },
    { label: "영수증리뷰", value: "영수증리뷰" },
    { label: "예약자리뷰", value: "예약자리뷰" },
    { label: "구글", value: "구글" },
    { label: "카카오", value: "카카오" },
    { label: "쿠팡", value: "쿠팡" },
    { label: "스토어", value: "스토어" }
  ];

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        toast({
          title: "오류",
          description: "사용자 정보를 가져오는데 실패했습니다.",
          variant: "destructive",
        });
        return;
      }
      
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    
    fetchUserData();
  }, []);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        searchTerm,
        startDate,
        endDate,
        page: currentPage.toString(),
        pageSize: pageSize.toString(),
        platformFilter: platformFilter === "전체" ? "" : platformFilter,
        providerId: userId || ''
      });
      
      const response = await fetch(`/api/provider/reviews?${params}`);
      
      if (!response.ok) {
        toast({
          title: "오류",
          description: "데이터를 불러오는데 실패했습니다.",
          variant: "destructive",
        });
        return; 
      }
      
      const data = await response.json();
      setReviews(data.reviews);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (error) {
      toast({
        title: "오류",
        description: "리뷰 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  console.log("reviews:", reviews);

  useEffect(() => {
    if (userId) {
      fetchReviews();
    }
  }, [currentPage, pageSize, platformFilter, userId]);

  useEffect(() => {
    const handleFocus = () => {
      if (userId) {
        fetchReviews();
      }
    };
    
    if (userId) {
      fetchReviews();
    }
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [userId]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchReviews();
  };

  const handlePlatformFilter = (platform: string) => {
    setPlatformFilter(platform);
    setCurrentPage(1);
  };

  const startIndex = (currentPage - 1) * pageSize;

  const getStatusStyle = (status: Review["status"]) => {
    switch (status) {
      case "approved":
        return "bg-green-500 text-white px-2 py-1 rounded-md";
      case "rejected":
        return "bg-red-500 text-white px-2 py-1 rounded-md";
      default:
        return "bg-yellow-500 text-white px-2 py-1 rounded-md";
    }
  };

  const getStatusText = (status: Review["status"]) => {
    switch (status) {
      case "approved":
        return "승인됨";
      case "rejected":
        return "거부됨";
      default:
        return "대기중";
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allIds = reviews.map(review => review.id);
      setSelectedReviews(new Set(allIds));
    } else {
      setSelectedReviews(new Set());
    }
  };

  const handleSelectReview = (reviewId: string | number, checked: boolean) => {
    const newSelected = new Set(selectedReviews);
    if (checked) {
      newSelected.add(reviewId);
    } else {
      newSelected.delete(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleExcelDownload = () => {
    // 엑셀 다운로드 로직 구현
    console.log('엑셀 다운로드');
  };

  const handleDeleteReview = (id: string | number) => {
    setReviewToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (reviewToDelete) {
      try {
        setLoading(true);
        const response = await fetch(`/api/provider/reviews/${reviewToDelete}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          return;
        }
        
        // 삭제 후 리스트 새로고침
        await fetchReviews();
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
      } catch (error) {
        console.error('리뷰 삭제 중 오류 발생:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddProduct = () => {
    router.push('/provider/reviews/add');
  };

  const handleEditProduct = (id: string | number) => {
    router.push(`/provider/reviews/${id}`);
  };

  const handleViewReview = (id: string | number) => {
    router.push(`/provider/reviews/${id}`);
  };

  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">이벤트 목록</h1>
      <p className="text-muted-foreground">플랫폼에 등록된 모든 이벤트를 관리합니다.</p>
      
      <div className="flex justify-between items-center gap-4 mb-4">
        {/* 플랫폼 필터 버튼들 */}
        <div className="flex gap-2 flex-wrap">
          {platformOptions.map((option) => (
            <Button
              key={option.value}
              variant={platformFilter === option.value ? "default" : "outline"}
              size="sm"
              onClick={() => handlePlatformFilter(option.value)}
              className="h-8"
            >
              {option.label}
            </Button>
          ))}
        </div>

        {/* 오른쪽 컨트롤들 */}
        <div className="flex gap-2">
          <Select value={pageSize.toString()} onValueChange={(value) => {
            setPageSize(Number(value));
            setCurrentPage(1);
            fetchReviews();
          }}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="페이지 크기" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10개</SelectItem>
              <SelectItem value="50">50개</SelectItem>
              <SelectItem value="100">100개</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExcelDownload}>
            <Download className="h-4 w-4 mr-2" />
            엑셀 다운로드
          </Button>
          {/* <Button onClick={handleAddProduct}>
            <Plus className="h-4 w-4 mr-2" />
            제품 등록
          </Button> */}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="상호명 또는 제목으로 검색하세요"
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

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-center align-middle font-medium w-20">번호</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">플랫폼</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">이미지</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-32">제목</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-32">
                  {platformFilter === "쿠팡" || platformFilter === "스토어" ? "제품명" : "상호명"}
                </th>
                {(platformFilter === "쿠팡" || platformFilter === "스토어") && (
                  <th className="h-12 px-4 text-center align-middle font-medium w-24">검색어</th>
                )}
                <th className="h-12 px-4 text-center align-middle font-medium w-32">
                  {platformFilter === "쿠팡" || platformFilter === "스토어" ? "제품링크" : "상호링크"}
                </th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">일건수</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">구좌수</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-32">작성기간</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, index) => {
                const isProductPlatform = review.platform === "쿠팡" || review.platform === "스토어";
                return (
                  <tr 
                    key={review.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer transition-colors" 
                    onClick={() => handleViewReview(review.id)}
                  >
                    <td className="p-4 text-center">{startIndex + index + 1}</td>
                    <td className="p-4 text-center">{review.platform}</td>
                    <td className="p-4 text-center">
                      {review.image_url ? (
                        <img 
                          src={review.image_url}
                          alt={isProductPlatform ? review.product_name : review.store_name || review.product_name}
                          className="w-16 h-16 object-cover mx-auto rounded-md"
                        />
                      ) : (
                        <img src="/noimage.jpg" alt="상품 이미지" className="w-16 h-16 object-cover mx-auto" />
                      )}
                    </td>
                    <td className="p-4 text-center">
                      <div className="w-full truncate text-center" title={review.title}>
                        {review.title || '-'}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {isProductPlatform ? review.product_name : (review.store_name || review.product_name)}
                    </td>
                    {(platformFilter === "쿠팡" || platformFilter === "스토어") && (
                      <td className="p-4 text-center">{review.search_keyword || review.option_name || '-'}</td>
                    )}
                    <td className="p-4 text-center">
                      {(() => {
                        const url = isProductPlatform ? review.product_url : review.store_url;
                        return url ? (
                          <a 
                            href={url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                            onClick={(e) => e.stopPropagation()}
                          >
                            링크
                          </a>
                        ) : '-';
                      })()}
                    </td>
                    <td className="p-4 text-center">{review.daily_count || '-'}</td>
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                        review?.daily_count 
                          ? 'bg-blue-100 text-blue-800' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {review.slots ? review.slots.length : 0}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      {review.start_date && review.end_date ? 
                        `${new Date(review.start_date).toLocaleDateString()} - ${new Date(review.end_date).toLocaleDateString()}` : 
                        review.period || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {totalCount}개 항목 중 {(currentPage - 1) * pageSize + 1}-{Math.min(currentPage * pageSize, totalCount)}개 표시
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <div className="flex items-center">
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
                  variant={currentPage === pageNumber ? "default" : "outline"}
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
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이벤트 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 이벤트를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 