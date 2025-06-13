'use client'
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

interface PendingPaymentFilters {
  searchTerm: string;
  searchCategory: string;
}

interface PendingPaymentSearchProps {
  filters: PendingPaymentFilters;
  onFiltersChange: (filters: PendingPaymentFilters) => void;
  onSearch: () => void;
  isLoading?: boolean;
}

export default function PendingPaymentSearch({ filters, onFiltersChange, onSearch, isLoading = false }: PendingPaymentSearchProps) {
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

  return (
    <div className="flex gap-2 items-center mb-4">
      <Select
        value={filters.searchCategory}
        onValueChange={(value) => handleSelectChange('searchCategory', value)}
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
  );
} 