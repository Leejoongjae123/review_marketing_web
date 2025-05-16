"use client";
import React, { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Download,
  Trash2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import Image from "next/image";
import { createClient } from "@/utils/supabase/client";

// 응모자 정보 타입 정의
interface Participant {
  id: string;
  review_id: {
    id: string;
    product_name: string;
    platform: string;
    option_name: string;
    price: number;
    shipping_fee: number;
    seller: string;
    period: string;
    image_url: string;
    product_url: string;
  };
  name: string;
  phone: string;
  login_account: string;
  event_account: string;
  nickname: string;
  review_image: string | null;
  created_at: string;
  updated_at: string | null;
}

// 사용자 타입 정의
interface User {
  id: string;
  email?: string;
}

export default function ClientParticipationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("product_name");
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedParticipant, setSelectedParticipant] = useState<Participant | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [user, setUser] = useState<User | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const supabase = createClient();
  
  const getUser = async () => {
    const { data } = await supabase.auth.getUser();
    setUser(data?.user);
  };

  const fetchParticipants = async (page = currentPage, pageSize = itemsPerPage) => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        searchTerm,
        searchCategory,
        page: page.toString(),
        pageSize: pageSize.toString()
      });
      
      const response = await fetch(`/api/participants?${params}`);
      const data = await response.json();
      
      if (data.error) {
        console.log("Error fetching participants:", data.error);
        return;
      }
      
      setParticipants(data.data || []);
      setTotalCount(data.count || 0);
      setTotalPages(data.totalPages || 1);
    } catch (error) {
      console.log("Failed to fetch participants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getUser();
    fetchParticipants();
  }, []);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchParticipants(1, itemsPerPage);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchParticipants(page, itemsPerPage);
  };

  const handleItemsPerPageChange = (value: string) => {
    const newPageSize = Number(value);
    setItemsPerPage(newPageSize);
    setCurrentPage(1);
    fetchParticipants(1, newPageSize);
  };

  const handleRowClick = (participant: Participant) => {
    setSelectedParticipant(participant);
    setIsModalOpen(true);
  };

  const handleDownloadExcel = async () => {
    try {
      setIsLoading(true);
      
      // 현재 검색 조건으로 모든 데이터를 가져오는 API 호출
      const params = new URLSearchParams({
        searchTerm,
        searchCategory,
        downloadAll: 'true'
      });
      
      const response = await fetch(`/api/participants/download?${params}`);
      const data = await response.json();
      
      if (data.error) {
        console.log("Error fetching participants for download:", data.error);
        return;
      }
      
      const headers = [
        "번호",
        "플랫폼",
        "제품명",
        "옵션명",
        "가격",
        "배송비",
        "판매지",
        "성명",
        "전화번호",
        "로그인 계정",
        "이벤트 계정",
        "닉네임",
        "등록일"
      ];
      
      const excelData = data.participants?.map((p: Participant, idx: number) => [
        (idx + 1).toString(),
        p.review_id?.platform || '정보 없음',
        p.review_id?.product_name || '정보 없음',
        p.review_id?.option_name || '정보 없음',
        p.review_id?.price ? p.review_id.price.toLocaleString() + "원" : '0원',
        p.review_id?.shipping_fee ? p.review_id.shipping_fee.toLocaleString() + "원" : '0원',
        p.review_id?.seller || '정보 없음',
        p.name,
        p.phone,
        p.login_account,
        p.event_account,
        p.nickname,
        new Date(p.created_at).toLocaleDateString()
      ]);

      const csvContent = [
        headers.join(","),
        ...excelData.map((row: string[]) => row.join(",")),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `응모자목록_${new Date().toLocaleDateString()}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.log("Failed to download participants:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 모달이 열리는 것을 방지
    setDeleteId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    
    try {
      const response = await fetch(`/api/participants/${deleteId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      
      // 삭제 성공 후 리스트 갱신
      fetchParticipants();
    } catch (error) {
      console.log("Failed to delete participant:", error);
    } finally {
      setIsDeleteDialogOpen(false);
      setDeleteId(null);
    }
  };

  return (
    <div className="space-y-4 w-full h-full">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">응모 관리</h1>
          <p className="text-muted-foreground">
            응모 이력을 확인합니다.
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="w-full md:w-64">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger>
              <SelectValue placeholder="검색 카테고리" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="product_name">제품명</SelectItem>
              <SelectItem value="platform">플랫폼</SelectItem>
              <SelectItem value="event_account">이벤트 계정</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Input
            placeholder="검색어를 입력하세요"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            className="w-full"
          />
        </div>
        <Button onClick={handleSearch} disabled={isLoading}>
          <Search className="h-4 w-4 mr-2" />
          {isLoading ? '검색 중...' : '검색'}
        </Button>
      </div>
      <div className="flex justify-end items-center gap-4">
        <Button onClick={handleDownloadExcel} variant="outline" disabled={isLoading}>
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={handleItemsPerPageChange}
        >
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="페이지당 항목 수" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10개씩 보기</SelectItem>
            <SelectItem value="50">50개씩 보기</SelectItem>
            <SelectItem value="100">100개씩 보기</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="border rounded-lg overflow-x-auto">
        <Table className="w-full min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[60px]">번호</TableHead>
              <TableHead className="w-[120px]">플랫폼</TableHead>
              <TableHead className="w-[120px]">이미지</TableHead>
              <TableHead className="w-[200px]">제품명</TableHead>
              <TableHead className="w-[120px]">이벤트 계정</TableHead>
              <TableHead className="w-[150px]">등록일</TableHead>
              <TableHead className="w-[80px]">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  데이터를 불러오는 중입니다...
                </TableCell>
              </TableRow>
            ) : participants?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-10">
                  응모 이력이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              participants?.map((participant, index) => (
                <TableRow
                  key={participant.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleRowClick(participant)}
                >
                  <TableCell>{(currentPage - 1) * itemsPerPage + index + 1}</TableCell>
                  <TableCell>{participant.review_id?.platform || '정보 없음'}</TableCell>
                  <TableCell>
                    {participant.review_image ? (
                      <div className="relative w-10 h-10 rounded-md overflow-hidden">
                        <Image
                          src={participant.review_image}
                          alt="제품 이미지"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : participant.review_id?.image_url ? (
                      <div className="relative w-10 h-10 rounded-md overflow-hidden">
                        <Image
                          src={participant.review_id.image_url}
                          alt="제품 이미지"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <span className="text-muted-foreground">없음</span>
                    )}
                  </TableCell>
                  <TableCell>{participant.review_id?.product_name || '정보 없음'}</TableCell>
                  <TableCell>{participant.event_account || '정보 없음'}</TableCell>
                  <TableCell>{new Date(participant.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => handleDelete(participant.id, e)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
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
            disabled={currentPage === 1 || isLoading}
          >
            <ChevronLeft className="h-4 w-4" />
            이전
          </Button>
          <div className="flex items-center">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageToShow = currentPage > 3 ? 
                (i + currentPage - 2 <= totalPages ? i + currentPage - 2 : totalPages - 4 + i) : 
                i + 1;
              
              if (pageToShow > 0 && pageToShow <= totalPages) {
                return (
                  <Button
                    key={pageToShow}
                    variant={currentPage === pageToShow ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => handlePageChange(pageToShow)}
                    disabled={isLoading}
                  >
                    {pageToShow}
                  </Button>
                );
              }
              return null;
            })}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            다음
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setSelectedParticipant(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>응모 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedParticipant && (
            <div className="space-y-4">
              <div className="grid gap-4 grid-cols-2">
                <div className="grid gap-2">
                  <Label>성명</Label>
                  <Input value={selectedParticipant.name} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>전화번호</Label>
                  <Input value={selectedParticipant.phone} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>플랫폼</Label>
                  <Input value={selectedParticipant.review_id?.platform || '정보 없음'} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>제품명</Label>
                  <Input value={selectedParticipant.review_id?.product_name || '정보 없음'} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>옵션명</Label>
                  <Input value={selectedParticipant.review_id?.option_name || "없음"} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>가격</Label>
                  <Input value={`${selectedParticipant.review_id?.price?.toLocaleString() || 0}원`} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>배송비</Label>
                  <Input value={`${selectedParticipant.review_id?.shipping_fee?.toLocaleString() || 0}원`} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>판매지</Label>
                  <Input value={selectedParticipant.review_id?.seller || "없음"} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>기간</Label>
                  <Input value={selectedParticipant.review_id?.period || "없음"} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>등록일</Label>
                  <Input value={new Date(selectedParticipant.created_at).toLocaleString()} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>로그인 계정</Label>
                  <Input value={selectedParticipant.login_account} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>이벤트 계정</Label>
                  <Input value={selectedParticipant.event_account} readOnly />
                </div>
                <div className="grid gap-2">
                  <Label>닉네임</Label>
                  <Input value={selectedParticipant.nickname} readOnly />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>리뷰 이미지</Label>
                {selectedParticipant.review_image ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border mt-2 w-32">
                    <Image
                      src={selectedParticipant.review_image}
                      alt="리뷰 이미지"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                ) : selectedParticipant.review_id?.image_url ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border mt-2 w-32">
                    <Image
                      src={selectedParticipant.review_id.image_url}
                      alt="제품 이미지"
                      fill
                      className="object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
                      }}
                    />
                  </div>
                ) : (
                  <Input value="리뷰 이미지가 없습니다." readOnly />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>항목 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 항목을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-500 hover:bg-red-600">
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 