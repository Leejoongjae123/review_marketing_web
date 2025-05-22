'use client'
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Download, Plus, Edit, Trash2 } from "lucide-react";
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
import { Spinner } from "@/components/ui/spinner";

// Review 타입 정의
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
  created_at: string;
  updated_at?: string;
}

export default function AdminReviewsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("product_name");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pageSize, setPageSize] = useState(10);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [selectedReviews, setSelectedReviews] = useState<Set<string | number>>(new Set());
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [reviewToDelete, setReviewToDelete] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/reviews?searchCategory=${searchCategory}&searchTerm=${encodeURIComponent(searchTerm)}&startDate=${startDate}&endDate=${endDate}&page=${currentPage}&pageSize=${pageSize}`
      );
      
      if (!response.ok) {
        console.log('데이터를 불러오는데 실패했습니다');
      }
      
      const data = await response.json();
      setReviews(data.reviews);
      setTotalCount(data.totalCount);
      setTotalPages(data.totalPages);
    } catch (error) {
      console.error('리뷰 데이터를 불러오는데 실패했습니다:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [currentPage, pageSize]);

  // 페이지 진입 시나 포커스가 돌아올 때 데이터 리로드
  useEffect(() => {
    const handleFocus = () => {
      fetchReviews();
    };

    // 페이지가 로드될 때 데이터 로드
    fetchReviews();
    
    // 브라우저 창이 포커스를 다시 얻었을 때 데이터 리로드
    window.addEventListener('focus', handleFocus);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchReviews();
  };

  // 페이지네이션 계산
  const startIndex = (currentPage - 1) * pageSize;

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-500 text-white px-2 py-1 rounded-md";
      case "rejected":
        return "bg-red-500 text-white px-2 py-1 rounded-md";
      default:
        return "bg-yellow-500 text-white px-2 py-1 rounded-md";
    }
  };

  const getStatusText = (status: string) => {
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
        const response = await fetch(`/api/admin/reviews/${reviewToDelete}`, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error('삭제에 실패했습니다');
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
    router.push('/admin/reviews/add');
  };

  const handleEditProduct = (id: string | number) => {
    router.push(`/admin/reviews/${id}`);
  };

  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">이벤트 목록</h1>
      <p className="text-muted-foreground">플랫폼에 등록된 모든 이벤트를 관리합니다.</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger>
              <SelectValue placeholder="검색 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">제목</SelectItem>
              <SelectItem value="product_name">제품</SelectItem>
              <SelectItem value="author_name">작성자</SelectItem>
              <SelectItem value="content">내용</SelectItem>
              <SelectItem value="platform">플랫폼</SelectItem>
              <SelectItem value="seller">판매자</SelectItem>
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
        <div className="flex gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full"
            placeholder="시작일"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full"
            placeholder="종료일"
          />
        </div>
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>
      
      <div className="flex justify-end gap-2 mb-4">
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
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          제품 등록
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-40">
          <Spinner size="lg" className="text-primary" />
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full min-w-[1200px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-center align-middle font-medium w-20">번호</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">플랫폼</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">이미지</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-32">제품명</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-32">옵션명</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">가격</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">배송비</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">판매자</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">참여자</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-24">기간</th>
                <th className="h-12 px-4 text-center align-middle font-medium w-32">관리</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((review, index) => (
                <tr key={review.id} className="border-b hover:bg-muted/50 cursor-pointer transition-colors"
                    onClick={() => handleEditProduct(review.id)}>
                  <td className="p-4 text-center">{startIndex + index + 1}</td>
                  <td className="p-4 text-center">{review.platform}</td>
                  <td className="p-4 text-center">
                    {review.image_url ? (
                      <img 
                        src={review.image_url} 
                        alt={review.product_name} 
                        className="w-16 h-16 object-cover mx-auto rounded-md"
                      />
                    ) : (
                      <img src="/noimage.jpg" alt="상품 이미지" className="w-16 h-16 object-cover mx-auto" />
                    )}
                  </td>
                  <td className="p-4 text-center">{review.product_name}</td>
                  <td className="p-4 text-center">{review.option_name}</td>
                  <td className="p-4 text-center">{review.price?.toLocaleString() ?? '0'}원</td>
                  <td className="p-4 text-center">{review.shipping_fee?.toLocaleString() ?? '0'}원</td>
                  <td className="p-4 text-center">{review.seller}</td>
                  <td className="p-4 text-center">{review.participants}</td>
                  <td className="p-4 text-center">
                    {review.start_date && review.end_date ? 
                      `${new Date(review.start_date).toLocaleDateString()} - ${new Date(review.end_date).toLocaleDateString()}` : 
                      review.period || '-'}
                  </td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteReview(review.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
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
            <AlertDialogTitle>리뷰 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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