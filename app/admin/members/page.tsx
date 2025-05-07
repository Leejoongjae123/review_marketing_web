'use client'
import React, { useState } from "react";
import { mockUsers } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { User } from "@/types";
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

export default function AdminMembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("name");
  const [filteredUsers, setFilteredUsers] = useState(mockUsers);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(mockUsers);
      return;
    }
    
    const filtered = mockUsers.filter(user => {
      const value = user[searchCategory as keyof User];
      if (typeof value === 'string') {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
    
    setFilteredUsers(filtered);
    setCurrentPage(1); // 검색 시 첫 페이지로 돌아가기
  };

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  const getRoleStyle = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "bg-purple-500 text-white px-2 py-1 rounded-md";
      case "provider":
        return "bg-blue-500 text-white px-2 py-1 rounded-md";
      default:
        return "bg-green-500 text-white px-2 py-1 rounded-md";
    }
  };

  const getRoleText = (role: User["role"]) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "provider":
        return "광고주";
      default:
        return "리뷰어";
    }
  };

  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">회원 관리</h1>
      <p className="text-muted-foreground">플랫폼에 등록된 모든 회원을 관리합니다.</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger>
              <SelectValue placeholder="검색 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">이름</SelectItem>
              <SelectItem value="email">이메일</SelectItem>
              <SelectItem value="role">역할</SelectItem>
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
              <th className="h-12 px-4 text-left align-middle font-medium">이름</th>
              <th className="h-12 px-4 text-left align-middle font-medium">이메일</th>
              <th className="h-12 px-4 text-left align-middle font-medium">역할</th>
              <th className="h-12 px-4 text-left align-middle font-medium">가입일</th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user) => (
              <tr key={user.id} className="border-b">
                <td className="p-4">{user.id}</td>
                <td className="p-4">{user.name}</td>
                <td className="p-4">{user.email}</td>
                <td className="p-4">
                  <span className={getRoleStyle(user.role)}>
                    {getRoleText(user.role)}
                  </span>
                </td>
                <td className="p-4">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {filteredUsers.length}개 항목 중 {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)}개 표시
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