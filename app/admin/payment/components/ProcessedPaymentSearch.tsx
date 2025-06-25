"use client";
import React, { useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, CalendarIcon, X } from "lucide-react";
import { format, subDays } from "date-fns";
import { ko } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProcessedPaymentFilters } from "../types";

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
  // 초기 마운트 시 기본 날짜 범위 설정 (이미 설정된 경우 제외)
  useEffect(() => {
    if (!filters.dateRange?.from && !filters.dateRange?.to) {
      onFiltersChange({
        ...filters,
        dateRange: {
          from: subDays(new Date(), 30), // 30일 전
          to: new Date() // 오늘
        }
      });
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFiltersChange({ ...filters, [name]: value });
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSearch();
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    onFiltersChange({ ...filters, [name]: value });
  };

  const handleStatusFilter = (status: string) => {
    onFiltersChange({ ...filters, statusFilter: status });
  };

  const handleStartDateChange = (date: Date | undefined) => {
    onFiltersChange({ 
      ...filters, 
      dateRange: { 
        from: date, 
        to: filters.dateRange?.to 
      } 
    });
  };

  const handleEndDateChange = (date: Date | undefined) => {
    onFiltersChange({ 
      ...filters, 
      dateRange: { 
        from: filters.dateRange?.from, 
        to: date 
      } 
    });
  };

  const clearDateRange = () => {
    onFiltersChange({
      ...filters,
      dateRange: { from: undefined, to: undefined }
    });
  };

  const hasDateRange = filters.dateRange?.from || filters.dateRange?.to;

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
      <div className="flex flex-wrap gap-3 items-center">
        <Select
          value={filters.searchCategory}
          onValueChange={(value) => handleSelectChange("searchCategory", value)}
        >
          <SelectTrigger className="w-[130px]">
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
          className="flex-1 min-w-[200px]"
        />

        {/* 시작일 Date Picker */}
        <div className="flex flex-col gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[150px] justify-start text-left font-normal",
                  !filters.dateRange?.from && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.from ? (
                  format(filters.dateRange.from, "yyyy-MM-dd", { locale: ko })
                ) : (
                  <span>날짜 선택</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange?.from}
                onSelect={handleStartDateChange}
                captionLayout="dropdown"
                className="rounded-md border shadow-sm"
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 종료일 Date Picker */}
        <div className="flex flex-col gap-1">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-[150px] justify-start text-left font-normal",
                  !filters.dateRange?.to && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {filters.dateRange?.to ? (
                  format(filters.dateRange.to, "yyyy-MM-dd", { locale: ko })
                ) : (
                  <span>날짜 선택</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={filters.dateRange?.to}
                onSelect={handleEndDateChange}
                captionLayout="dropdown"
                className="rounded-md border shadow-sm"
                disabled={(date) => {
                  // 시작일이 있으면 시작일보다 이전 날짜는 비활성화
                  if (filters.dateRange?.from) {
                    return date < filters.dateRange.from;
                  }
                  return false;
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* 날짜 범위 초기화 버튼 */}
        {hasDateRange && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearDateRange}
            className="px-2"
          >
            <X className="h-4 w-4" />
          </Button>
        )}

        <Button 
          onClick={onSearch} 
          size="sm" 
          disabled={isLoading}
          className="px-4"
        >
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>

      {/* 선택된 필터 표시 */}
      {(filters.searchTerm || hasDateRange) && (
        <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
          {filters.searchTerm && (
            <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
              <span>검색어: {filters.searchTerm}</span>
            </div>
          )}
          {filters.dateRange?.from && (
            <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
              <span>시작일: {format(filters.dateRange.from, "yyyy-MM-dd", { locale: ko })}</span>
            </div>
          )}
          {filters.dateRange?.to && (
            <div className="flex items-center gap-1 bg-secondary px-2 py-1 rounded">
              <span>종료일: {format(filters.dateRange.to, "yyyy-MM-dd", { locale: ko })}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
