'use client'
import React, { useState } from "react";
import { mockUserHistory } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { UserHistory } from "@/types";
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

export default function AdminHistoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("userName");
  const [filteredHistory, setFilteredHistory] = useState(mockUserHistory);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredHistory(mockUserHistory);
      return;
    }
    
    const filtered = mockUserHistory.filter(history => {
      const value = history[searchCategory as keyof UserHistory];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
    
    setFilteredHistory(filtered);
    setCurrentPage(1); // 검색 시 첫 페이지로 돌아가기
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(startIndex, startIndex + itemsPerPage);

  const getActionStyle = (action: string) => {
    switch (action) {
      case "login":
        return "bg-blue-500 text-white px-2 py-1 rounded-md";
      case "review":
        return "bg-green-500 text-white px-2 py-1 rounded-md";
      default:
        return "bg-gray-500 text-white px-2 py-1 rounded-md";
    }
  };

  const getActionText = (action: string) => {
    switch (action) {
      case "login":
        return "로그인";
      case "review":
        return "리뷰 작성";
      default:
        return action;
    }
  };

  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">회원 이력 검색</h1>
      <p className="text-muted-foreground">사용자들의 활동 이력을 확인합니다.</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger>
              <SelectValue placeholder="검색 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="userName">사용자</SelectItem>
              <SelectItem value="action">활동</SelectItem>
              <SelectItem value="details">상세 정보</SelectItem>
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
              <th className="h-12 px-4 text-left align-middle font-medium">ID</th>
              <th className="h-12 px-4 text-left align-middle font-medium">사용자</th>
              <th className="h-12 px-4 text-left align-middle font-medium">활동</th>
              <th className="h-12 px-4 text-left align-middle font-medium">상세 정보</th>
              <th className="h-12 px-4 text-left align-middle font-medium">시간</th>
            </tr>
          </thead>
          <tbody>
            {paginatedHistory.map((history) => (
              <tr key={history.id} className="border-b">
                <td className="p-4">{history.id}</td>
                <td className="p-4">{history.userName}</td>
                <td className="p-4">
                  <span className={getActionStyle(history.action)}>
                    {getActionText(history.action)}
                  </span>
                </td>
                <td className="p-4">{history.details}</td>
                <td className="p-4">{new Date(history.timestamp).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {filteredHistory.length}개 항목 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredHistory.length)}개 표시
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