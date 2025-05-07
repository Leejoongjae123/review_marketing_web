'use client'
import React, { useState } from "react";
import { mockReviews } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { Review } from "@/types";
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

export default function AdminReviewsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("title");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [pageSize, setPageSize] = useState(10);
  const [filteredReviews, setFilteredReviews] = useState(mockReviews);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());

  const handleSearch = () => {
    if (!searchTerm.trim() && !startDate && !endDate) {
      setFilteredReviews(mockReviews);
      return;
    }
    
    const filtered = mockReviews.filter(review => {
      const matchesSearch = !searchTerm.trim() || 
        (searchCategory in review && 
         typeof review[searchCategory as keyof Review] === 'string' &&
         (review[searchCategory as keyof Review] as string).toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesDate = (!startDate || new Date(review.createdAt) >= new Date(startDate)) &&
                         (!endDate || new Date(review.createdAt) <= new Date(endDate));
      
      return matchesSearch && matchesDate;
    });
    
    setFilteredReviews(filtered);
    setCurrentPage(1);
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredReviews.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + pageSize);

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
      const allIds = paginatedReviews.map(review => review.id);
      setSelectedReviews(new Set(allIds));
    } else {
      setSelectedReviews(new Set());
    }
  };

  const handleSelectReview = (reviewId: string, checked: boolean) => {
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

  const handleDeleteReview = (id: string) => {
    if (window.confirm('정말로 이 제품을 삭제하시겠습니까?')) {
      // TODO: API 연동
      console.log('제품 삭제:', id);
    }
  };

  const handleAddProduct = () => {
    router.push('/admin/reviews/add');
  };

  const handleEditProduct = (id: string) => {
    router.push(`/admin/reviews/${id}`);
  };

  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">리뷰 목록 관리</h1>
      <p className="text-muted-foreground">플랫폼에 등록된 모든 리뷰를 관리합니다.</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger>
              <SelectValue placeholder="검색 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">제목</SelectItem>
              <SelectItem value="productName">제품</SelectItem>
              <SelectItem value="authorName">작성자</SelectItem>
              <SelectItem value="content">내용</SelectItem>
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
        <Button onClick={handleAddProduct}>
          <Plus className="h-4 w-4 mr-2" />
          제품 등록
        </Button>
      </div>

      <div className="rounded-md border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-center align-middle font-medium w-12">
                <Checkbox
                  checked={selectedReviews.size === paginatedReviews.length}
                  onCheckedChange={handleSelectAll}
                />
              </th>
              <th className="h-12 px-4 text-center align-middle font-medium w-20">번호</th>
              <th className="h-12 px-4 text-center align-middle font-medium w-24">상태</th>
              <th className="h-12 px-4 text-center align-middle font-medium w-32">제목</th>
              <th className="h-12 px-4 text-center align-middle font-medium w-32">작성자</th>
              <th className="h-12 px-4 text-center align-middle font-medium w-32">제품명</th>
              <th className="h-12 px-4 text-center align-middle font-medium w-24">평점</th>
              <th className="h-12 px-4 text-center align-middle font-medium w-32">작성일</th>
              <th className="h-12 px-4 text-center align-middle font-medium w-32">관리</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReviews.map((review, index) => (
              <tr key={review.id} className="border-b">
                <td className="p-4 text-center">
                  <Checkbox
                    checked={selectedReviews.has(review.id)}
                    onCheckedChange={(checked) => handleSelectReview(review.id, checked as boolean)}
                  />
                </td>
                <td className="p-4 text-center">{startIndex + index + 1}</td>
                <td className="p-4 text-center">
                  <span className={getStatusStyle(review.status)}>
                    {getStatusText(review.status)}
                  </span>
                </td>
                <td className="p-4 text-center">{review.title}</td>
                <td className="p-4 text-center">{review.authorName}</td>
                <td className="p-4 text-center">{review.productName}</td>
                <td className="p-4 text-center">{review.rating}</td>
                <td className="p-4 text-center">{new Date(review.createdAt).toLocaleDateString()}</td>
                <td className="p-4 text-center">
                  <div className="flex justify-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEditProduct(review.id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteReview(review.id)}
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
      
      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {filteredReviews.length}개 항목 중 {startIndex + 1}-{Math.min(startIndex + pageSize, filteredReviews.length)}개 표시
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
    </div>
  );
} 