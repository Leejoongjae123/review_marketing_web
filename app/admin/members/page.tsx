"use client";
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState<User["role"] | "all">("all");

  const handleRoleChange = (userId: string, newRole: User["role"]) => {
    setFilteredUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user
      )
    );
  };

  const handleStatusChange = (userId: string, newStatus: "active" | "inactive") => {
    setFilteredUsers((prevUsers) =>
      prevUsers.map((user) =>
        user.id === userId ? { ...user, status: newStatus } : user
      )
    );
  };

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredUsers(mockUsers);
      return;
    }

    const filtered = mockUsers.filter((user) => {
      const value = user[searchCategory as keyof User];
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });

    setFilteredUsers(filtered);
    setCurrentPage(1);
  };

  // 역할 필터링 적용
  const filteredByRole =
    selectedRole === "all"
      ? filteredUsers
      : filteredUsers.filter((user) => user.role === selectedRole);

  // 페이지네이션 계산
  const totalPages = Math.ceil(filteredByRole.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredByRole.slice(
    startIndex,
    startIndex + itemsPerPage
  );

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
      <p className="text-muted-foreground">
        플랫폼에 등록된 모든 회원을 관리합니다.
      </p>

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
      <div className="flex justify-between items-center mb-4">
        <div className="flex gap-2">
          <Button
            variant={selectedRole === "all" ? "default" : "outline"}
            onClick={() => setSelectedRole("all")}
          >
            전체 ({mockUsers.length})
          </Button>
          <Button
            variant={selectedRole === "admin" ? "default" : "outline"}
            onClick={() => setSelectedRole("admin")}
          >
            관리자 ({mockUsers.filter((user) => user.role === "admin").length})
          </Button>
          <Button
            variant={selectedRole === "provider" ? "default" : "outline"}
            onClick={() => setSelectedRole("provider")}
          >
            광고주 ({mockUsers.filter((user) => user.role === "provider").length})
          </Button>
          <Button
            variant={selectedRole === "client" ? "default" : "outline"}
            onClick={() => setSelectedRole("client")}
          >
            리뷰어 ({mockUsers.filter((user) => user.role === "client").length})
          </Button>
        </div>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(Number(value));
            setCurrentPage(1);
          }}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="표시 개수" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10개씩 보기</SelectItem>
            <SelectItem value="50">50개씩 보기</SelectItem>
            <SelectItem value="100">100개씩 보기</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="rounded-md border overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="h-12 px-4 text-center align-middle font-medium w-1/5">
                번호
              </th>
              <th className="h-12 px-4 text-center align-middle font-medium w-1/5">
                회원ID
              </th>
              <th className="h-12 px-4 text-center align-middle font-medium w-1/5">
                업체명
              </th>
              <th className="h-12 px-4 text-center align-middle font-medium w-1/5">
                전화번호
              </th>
              <th className="h-12 px-4 text-center align-middle font-medium w-1/5">
                계정권한
              </th>
              <th className="h-12 px-4 text-center align-middle font-medium w-1/5">
                계정상태
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedUsers.map((user, index) => (
              <tr key={user.id} className="border-b">
                <td className="p-4 text-center">{startIndex + index + 1}</td>
                <td className="p-4 text-center">{user.id}</td>
                <td className="p-4 text-center">{user.name}</td>
                <td className="p-4 text-center">{user.phone || "-"}</td>
                <td className="p-4 text-center">
                  <Select
                    value={user.role}
                    onValueChange={(value) =>
                      handleRoleChange(user.id, value as User["role"])
                    }
                  >
                    <SelectTrigger className="w-[120px] mx-auto">
                      <SelectValue>{getRoleText(user.role)}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">관리자</SelectItem>
                      <SelectItem value="provider">광고주</SelectItem>
                      <SelectItem value="client">리뷰어</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-4 text-center">
                  <Select
                    value={user.status || "active"}
                    onValueChange={(value) =>
                      handleStatusChange(user.id, value as "active" | "inactive")
                    }
                  >
                    <SelectTrigger className="w-[120px] mx-auto">
                      <SelectValue>
                        {user.status === "inactive" ? "비활성화" : "활성화"}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">활성화</SelectItem>
                      <SelectItem value="inactive">비활성화</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {filteredByRole.length}개 항목 중 {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredByRole.length)}개 표시
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <div className="flex items-center">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
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
            onClick={() =>
              setCurrentPage((prev) => Math.min(prev + 1, totalPages))
            }
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
