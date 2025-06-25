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
import { PaymentFilters } from "../types";

interface PaymentSearchProps {
  filters: PaymentFilters;
  onFiltersChange: (filters: PaymentFilters) => void;
  onSearch: () => void;
}

export default function PaymentSearch({ filters, onFiltersChange, onSearch }: PaymentSearchProps) {
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFiltersChange({ ...filters, [name]: value });
  };

  const handleSelectChange = (name: string, value: string) => {
    onFiltersChange({ ...filters, [name]: value });
  };

  return (
    <div className="space-y-4 w-full">
      <div className="flex gap-4 w-full">
        <div className="flex items-center space-x-2 w-full">
          <Select
            value={filters.searchCategory}
            onValueChange={(value) => handleSelectChange('searchCategory', value)}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="검색 분류" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">이름</SelectItem>
              <SelectItem value="nickname">닉네임</SelectItem>
              <SelectItem value="phone">전화번호</SelectItem>
              <SelectItem value="all">전체</SelectItem>
            </SelectContent>
          </Select>
          
          <Input
            name="searchTerm"
            value={filters.searchTerm}
            onChange={handleInputChange}
            placeholder="검색어를 입력하세요"
            className="w-full"
          />
        </div>
        
        <Button onClick={onSearch}>검색</Button>
      </div>
    </div>
  );
} 