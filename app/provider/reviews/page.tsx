'use client'
import React, { useEffect, useState } from "react";
import { mockReviews } from "@/lib/mock-data";
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
  created_at: string;
  updated_at?: string;
  provider_id?: string;
}

export default function ProviderReviewsPage() {
  const router = useRouter();
  const { toast } = useToast();
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
  const [userId, setUserId] = useState<string | null>(null);
  const supabase = createClient();

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
      const response = await fetch(
        `/api/provider/reviews?searchCategory=${searchCategory}&searchTerm=${encodeURIComponent(searchTerm)}&startDate=${startDate}&endDate=${endDate}&page=${currentPage}&pageSize=${pageSize}&providerId=${userId || ''}`
      );
      
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
  }, [currentPage, pageSize, userId]);

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
    toast({ title: "알림", description: "엑셀 다운로드 기능이 준비중입니다." });
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
          toast({
            title: "오류",
            description: "삭제에 실패했습니다.",
            variant: "destructive",
          });
          return;
        }
        
        toast({ title: "성공", description: "리뷰가 삭제되었습니다." });
        await fetchReviews();
        setDeleteDialogOpen(false);
        setReviewToDelete(null);
      } catch (error) {
        toast({
          title: "오류",
          description: "리뷰 삭제 중 오류가 발생했습니다.",
          variant: "destructive",
        });
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
        <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(Number(value))}>
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
        
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-center align-middle font-medium">번호</th>
              <th className="h-12 px-4 text-center align-middle font-medium">플랫폼</th>
              <th className="h-12 px-4 text-center align-middle font-medium">이미지</th>
              <th className="h-12 px-4 text-center align-middle font-medium">제품명</th>
              <th className="h-12 px-4 text-center align-middle font-medium">옵션명</th>
              <th className="h-12 px-4 text-center align-middle font-medium">가격</th>
              <th className="h-12 px-4 text-center align-middle font-medium">배송비</th>
              <th className="h-12 px-4 text-center align-middle font-medium">판매자</th>
              <th className="h-12 px-4 text-center align-middle font-medium">기간</th>
              <th className="h-12 px-4 text-center align-middle font-medium">URL</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="text-center p-4">
                  로딩 중...
                </td>
              </tr>
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan={11} className="text-center p-4">
                  데이터가 없습니다.
                </td>
              </tr>
            ) : (
              reviews.map((review, index) => (
                <tr 
                  key={review.id} 
                  className="border-b hover:bg-muted/50 cursor-pointer" 
                  onClick={() => handleViewReview(review.id)}
                >
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
                  <td className="p-4 text-center">{review.period}</td>
                  <td className="p-4 text-center">
                    <a 
                      href={review.product_url}
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700 underline"
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                    >
                      링크
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {totalCount}개 항목 중 {reviews.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + pageSize, totalCount)}개 표시
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-9"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
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