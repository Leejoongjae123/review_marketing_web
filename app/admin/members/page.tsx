"use client";
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { createClient } from "@/utils/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

// 프로필 타입 정의
interface Profile {
  id: string;
  updated_at?: string;
  username?: string;
  full_name?: string;
  avatar_url?: string;
  website?: string;
  phone?: string;
  role?: "admin" | "provider" | "client" | "master";
  status?: "active" | "inactive";
  email?: string;
}

// 페이지네이션 데이터 타입
interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 역할별 카운트 타입
interface RoleCounts {
  admin: number;
  provider: number;
  client: number;
  total: number;
}

export default function AdminMembersPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("full_name");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedRole, setSelectedRole] = useState<Profile["role"] | "all">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [roleCounts, setRoleCounts] = useState<RoleCounts>({
    admin: 0,
    provider: 0,
    client: 0,
    total: 0
  });
  
  // 광고주 가입 모달 상태
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [providerForm, setProviderForm] = useState({
    companyName: "",
    staffName: "",
    fullName: "",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const { toast } = useToast();
  const supabase = createClient();

  // 데이터 로드 함수
  const fetchProfiles = async (
    page = currentPage,
    limit = itemsPerPage,
    role = selectedRole,
    term = searchTerm,
    category = searchCategory
  ) => {
    setIsLoading(true);
    try {
      // URL 쿼리 파라미터 생성
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      
      if (term) {
        params.append('searchTerm', term);
        params.append('searchCategory', category);
      }
      
      if (role !== 'all') {
        params.append('role', role as string);
      }
      
      const response = await fetch(`/api/admin/members?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '회원 정보를 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      setProfiles(data.members);
      
      // 페이지네이션 정보 설정
      if (data.pagination) {
        setTotalCount(data.pagination.total);
        setTotalPages(data.pagination.totalPages);
      }
      
      // 역할별 카운트 설정
      if (data.counts) {
        setRoleCounts(data.counts);
      }
      
    } catch (error) {
      console.error('회원 데이터 로딩 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "회원 데이터를 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 광고주 폼 입력 핸들러
  const handleProviderFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProviderForm((prev) => ({ ...prev, [name]: value }));
  };

  // 번호를 +82 10-9070-3001 형태로 변환하는 함수
  function formatPhoneToInternational(input: string): string {
    const numbers = input.replace(/\D/g, "");
    if (numbers.length < 10) return input; // 10자리 미만이면 변환 안함
    let local = numbers;
    if (local.startsWith("0")) local = local.slice(1); // 0 제거
    const first = local.slice(0, 2); // 10
    const middle = local.slice(2, 6); // 9070
    const last = local.slice(6, 10); // 3001
    return `+82 ${first}-${middle}-${last}`;
  }

  // 광고주 가입 처리 함수
  const handleProviderRegister = async () => {
    // 유효성 검사
    if (!providerForm.email || !providerForm.password || !providerForm.companyName || 
        !providerForm.staffName || !providerForm.phone) {
      toast({
        title: "오류",
        description: "모든 필드를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 이메일 형식 검사
    const emailRegex = /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/;
    if (!emailRegex.test(providerForm.email)) {
      toast({
        title: "오류",
        description: "유효한 이메일 주소를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 비밀번호 일치 검사
    if (providerForm.password !== providerForm.confirmPassword) {
      toast({
        title: "오류",
        description: "비밀번호가 일치하지 않습니다.",
        variant: "destructive",
      });
      return;
    }

    setRegisterLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName: providerForm.companyName,
          staffName: providerForm.staffName,
          fullName: providerForm.staffName,
          phone: formatPhoneToInternational(providerForm.phone),
          email: providerForm.email,
          password: providerForm.password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({
          title: "성공",
          description: "광고주 계정이 생성되었습니다.",
        });
        
        // 모달 닫기 및 폼 초기화
        setIsProviderModalOpen(false);
        setProviderForm({
          companyName: "",
          staffName: "",
          fullName: "",
          phone: "",
          email: "",
          password: "",
          confirmPassword: "",
        });
        
        // 회원 목록 새로고침
        fetchProfiles();
      } else {
        toast({
          title: "오류",
          description: data.error || "광고주 계정 생성에 실패했습니다.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "오류",
        description: "서버 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setRegisterLoading(false);
    }
  };

  // 초기 데이터 로드
  useEffect(() => {
    fetchProfiles();
  }, [currentPage, itemsPerPage, selectedRole]);

  const handleRoleChange = async (userId: string, newRole: Profile["role"]) => {
    try {
      const response = await fetch(`/api/admin/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '역할 변경에 실패했습니다.');
      }

      const data = await response.json();
      
      // 상태 업데이트
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.id === userId ? { ...profile, role: newRole } : profile
        )
      );

      toast({
        title: "성공",
        description: "회원 역할이 변경되었습니다.",
      });
      
      // 역할 변경 후 카운트 업데이트
      fetchProfiles(currentPage, itemsPerPage, selectedRole);
    } catch (error) {
      console.error('역할 변경 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "역할 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (userId: string, newStatus: "active" | "inactive") => {
    try {
      const response = await fetch(`/api/admin/members/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || '상태 변경에 실패했습니다.');
      }

      const data = await response.json();
      
      // 상태 업데이트
      setProfiles((prevProfiles) =>
        prevProfiles.map((profile) =>
          profile.id === userId ? { ...profile, status: newStatus } : profile
        )
      );

      toast({
        title: "성공",
        description: "회원 상태가 변경되었습니다.",
      });
      
      // 상태 변경 후 카운트 업데이트
      fetchProfiles(currentPage, itemsPerPage, selectedRole);
    } catch (error) {
      console.error('상태 변경 오류:', error);
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "상태 변경에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const handleSearch = () => {
    // 검색 시 첫 페이지로 이동하고 API 요청
    setCurrentPage(1);
    fetchProfiles(1, itemsPerPage, selectedRole, searchTerm, searchCategory);
  };
  
  const handleRoleFilter = (role: Profile["role"] | "all") => {
    setSelectedRole(role);
    setCurrentPage(1);
  };
  
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };
  
  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  const getRoleText = (role?: Profile["role"]) => {
    switch (role) {
      case "admin":
        return "관리자";
      case "provider":
        return "광고주";
      case "client":
        return "리뷰어";
      case "master":
        return "관리자";
      default:
        return "리뷰어";
    }
  };

  if (isLoading && profiles.length === 0) {
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
                <SelectItem value="full_name">이름</SelectItem>
                <SelectItem value="email">이메일</SelectItem>
                <SelectItem value="phone">전화번호</SelectItem>
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
              onClick={() => handleRoleFilter("all")}
            >
              전체 ({roleCounts.total})
            </Button>
            <Button
              variant={selectedRole === "admin" ? "default" : "outline"}
              onClick={() => handleRoleFilter("admin")}
            >
              관리자 ({roleCounts.admin})
            </Button>
            <Button
              variant={selectedRole === "provider" ? "default" : "outline"}
              onClick={() => handleRoleFilter("provider")}
            >
              광고주 ({roleCounts.provider})
            </Button>
            <Button
              variant={selectedRole === "client" ? "default" : "outline"}
              onClick={() => handleRoleFilter("client")}
            >
              리뷰어 ({roleCounts.client})
            </Button>
          </div>
          <Select
            value={itemsPerPage.toString()}
            onValueChange={handleItemsPerPageChange}
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
                  이름
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
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  <div className="flex justify-center items-center h-40">
                    <Spinner size="lg" className="text-primary" />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">회원 관리</h1>
          <p className="text-muted-foreground">
            플랫폼에 등록된 모든 회원을 관리합니다.
          </p>
        </div>
        <Button onClick={() => setIsProviderModalOpen(true)}>
          <UserPlus className="h-4 w-4 mr-2" />
          광고주 가입
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger>
              <SelectValue placeholder="검색 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full_name">이름</SelectItem>
              <SelectItem value="email">이메일</SelectItem>
              <SelectItem value="phone">전화번호</SelectItem>
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
            onClick={() => handleRoleFilter("all")}
          >
            전체 ({roleCounts.total})
          </Button>
          <Button
            variant={selectedRole === "admin" ? "default" : "outline"}
            onClick={() => handleRoleFilter("admin")}
          >
            관리자 ({roleCounts.admin})
          </Button>
          <Button
            variant={selectedRole === "provider" ? "default" : "outline"}
            onClick={() => handleRoleFilter("provider")}
          >
            광고주 ({roleCounts.provider})
          </Button>
          <Button
            variant={selectedRole === "client" ? "default" : "outline"}
            onClick={() => handleRoleFilter("client")}
          >
            리뷰어 ({roleCounts.client})
          </Button>
        </div>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={handleItemsPerPageChange}
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
                이름
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
            {profiles.length > 0 ? (
              profiles.map((profile, index) => (
                <tr key={profile.id} className="border-b">
                  <td className="p-4 text-center">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                  <td className="p-4 text-center">{profile.id}</td>
                  <td className="p-4 text-center">{profile.full_name || profile.username || '-'}</td>
                  <td className="p-4 text-center">{profile.phone || "-"}</td>
                  <td className="p-4 text-center">
                    <Select
                      value={profile.role || "client"}
                      onValueChange={(value) =>
                        handleRoleChange(profile.id, value as Profile["role"])
                      }
                    >
                      <SelectTrigger className="w-[120px] mx-auto">
                        <SelectValue>{getRoleText(profile.role)}</SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="provider">광고주</SelectItem>
                        <SelectItem value="client">리뷰어</SelectItem>
                        <SelectItem value="master">관리자</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-4 text-center">
                    <Select
                      value={profile.status || "active"}
                      onValueChange={(value) =>
                        handleStatusChange(profile.id, value as "active" | "inactive")
                      }
                    >
                      <SelectTrigger className="w-[120px] mx-auto">
                        <SelectValue>
                          {profile.status === "inactive" ? "비활성화" : "활성화"}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">활성화</SelectItem>
                        <SelectItem value="inactive">비활성화</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-4 text-center">
                  {isLoading ? (
                    <div className="flex justify-center items-center h-40">
                      <Spinner size="lg" className="text-primary" />
                    </div>
                  ) : (
                    "회원 정보가 없습니다."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {totalCount}개 항목 중 {(currentPage - 1) * itemsPerPage + 1}-
          {Math.min(currentPage * itemsPerPage, totalCount)}개 표시
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <div className="flex items-center">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  className="w-9"
                  onClick={() => handlePageChange(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* 광고주 가입 모달 */}
      <Dialog open={isProviderModalOpen} onOpenChange={setIsProviderModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>광고주 계정 생성</DialogTitle>
            <DialogDescription>
              새로운 광고주 계정을 생성합니다. 모든 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-1 gap-3">
              <div className="space-y-2">
                <Label htmlFor="companyName">회사명</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  placeholder="회사명 입력"
                  value={providerForm.companyName}
                  onChange={handleProviderFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="staffName">담당자 이름</Label>
                <Input
                  id="staffName"
                  name="staffName"
                  placeholder="담당자 이름 입력"
                  value={providerForm.staffName}
                  onChange={handleProviderFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">연락처</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="연락처 입력"
                  value={providerForm.phone}
                  onChange={handleProviderFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">이메일</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="이메일 주소 입력"
                  value={providerForm.email}
                  onChange={handleProviderFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">비밀번호</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="비밀번호 입력"
                  value={providerForm.password}
                  onChange={handleProviderFormChange}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">비밀번호 확인</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="비밀번호 재입력"
                  value={providerForm.confirmPassword}
                  onChange={handleProviderFormChange}
                />
                {providerForm.confirmPassword && 
                 providerForm.password !== providerForm.confirmPassword && (
                  <p className="text-sm text-red-500">비밀번호가 일치하지 않습니다.</p>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsProviderModalOpen(false)}>
              취소
            </Button>
            <Button 
              onClick={handleProviderRegister} 
              disabled={registerLoading}
            >
              {registerLoading ? (
                <>
                  <Spinner className="mr-2 h-4 w-4 text-white" />
                  처리 중...
                </>
              ) : (
                "계정 생성"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
