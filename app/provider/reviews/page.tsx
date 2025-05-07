'use client'
import React, { useState } from "react";
import { mockReviews } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Review } from "@/types";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function ProviderReviewsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("title");
  const [filteredReviews, setFilteredReviews] = useState(mockReviews);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredReviews(mockReviews);
      return;
    }
    
    const filtered = mockReviews.filter(review => {
      const value = review[searchCategory as keyof Review];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
    
    setFilteredReviews(filtered);
    setCurrentPage(1); // 검색 시 첫 페이지로 돌아가기
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, startIndex + itemsPerPage);

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

  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">리뷰 목록</h1>
      <p className="text-muted-foreground">등록된 리뷰를 확인합니다.</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger>
              <SelectValue placeholder="검색 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="title">제목</SelectItem>
              <SelectItem value="authorName">작성자</SelectItem>
              <SelectItem value="productName">제품</SelectItem>
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
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>
      
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-left align-middle font-medium">제목</th>
              <th className="h-12 px-4 text-left align-middle font-medium">작성자</th>
              <th className="h-12 px-4 text-left align-middle font-medium">제품</th>
              <th className="h-12 px-4 text-left align-middle font-medium">평점</th>
              <th className="h-12 px-4 text-left align-middle font-medium">상태</th>
              <th className="h-12 px-4 text-left align-middle font-medium">작성일</th>
            </tr>
          </thead>
          <tbody>
            {paginatedReviews.map((review) => (
              <tr key={review.id} className="border-b">
                <td className="p-4">{review.title}</td>
                <td className="p-4">{review.authorName}</td>
                <td className="p-4">{review.productName}</td>
                <td className="p-4">{review.rating}</td>
                <td className="p-4">
                  <span className={getStatusStyle(review.status)}>
                    {getStatusText(review.status)}
                  </span>
                </td>
                <td className="p-4">{new Date(review.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {filteredReviews.length}개 항목 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredReviews.length)}개 표시
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