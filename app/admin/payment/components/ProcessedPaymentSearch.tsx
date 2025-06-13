"use client";
import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ProcessedPaymentFilters {
  searchTerm: string;
  searchCategory: string;
  statusFilter: string;
}

interface ProcessedPaymentSearchProps {
  filters: ProcessedPaymentFilters;
  onFiltersChange: (filters: ProcessedPaymentFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export default function ProcessedPaymentSearch({
  filters,
  onFiltersChange,
  onSearch,
  isLoading = false,
}: ProcessedPaymentSearchProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFiltersChange({ ...filters, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    onFiltersChange({ ...filters, [name]: value });
  };

  const handleStatusFilter = (status: string) => {
    onFiltersChange({ ...filters, statusFilter: status });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  return (
    <div className="space-y-4 mb-4">
      {/* 상태 필터 버튼 영역 */}
      <div className="flex gap-2">
        <Button
          variant={filters.statusFilter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilter("all")}
          disabled={isLoading}
        >
          전체
        </Button>
        <Button
          variant={filters.statusFilter === "completed" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilter("completed")}
          disabled={isLoading}
        >
          입금완료
        </Button>
        <Button
          variant={filters.statusFilter === "failed" ? "default" : "outline"}
          size="sm"
          onClick={() => handleStatusFilter("failed")}
          disabled={isLoading}
        >
          입금불가
        </Button>
      </div>

      {/* 검색 영역 */}
      <div className="flex gap-2 items-center">
        <Select
          value={filters.searchCategory}
          onValueChange={(value) => handleSelectChange("searchCategory", value)}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="검색 분류" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">이름</SelectItem>
            <SelectItem value="bank">은행</SelectItem>
            <SelectItem value="accountNumber">계좌번호</SelectItem>
            <SelectItem value="all">전체</SelectItem>
          </SelectContent>
        </Select>

        <Input
          name="searchTerm"
          value={filters.searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder="검색어를 입력하세요"
          className="flex-1"
        />

        <Button onClick={onSearch} size="sm" disabled={isLoading}>
          <Search className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
