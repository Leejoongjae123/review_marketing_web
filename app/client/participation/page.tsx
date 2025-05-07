"use client";
import React, { useState } from "react";
import { mockUserHistory } from "@/lib/mock-data";
import { Card, CardContent } from "@/components/ui/card";
import { UserHistory } from "@/types";
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
import { Label } from "@/components/ui/label";
import Image from "next/image";

export default function ClientParticipationPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchCategory, setSearchCategory] = useState("productName");
  const [filteredHistory, setFilteredHistory] = useState(mockUserHistory);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedHistory, setSelectedHistory] = useState<UserHistory | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const handleSearch = () => {
    if (!searchTerm.trim()) {
      setFilteredHistory(mockUserHistory);
      return;
    }

    const filtered = mockUserHistory.filter((history) => {
      const value = history[searchCategory as keyof UserHistory];
      if (typeof value === "string") {
        return value.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });

    setFilteredHistory(filtered);
    setCurrentPage(1);
  };

  const totalPages = Math.ceil(filteredHistory.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedHistory = filteredHistory.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const handleRowClick = (history: UserHistory) => {
    setSelectedHistory(history);
    setIsModalOpen(true);
  };

  const handleDownloadExcel = () => {
    // 엑셀 다운로드 로직 구현
    const headers = [
      "번호",
      "플랫폼",
      "제품명",
      "옵션명",
      "가격",
      "배송비",
      "판매지",
      "기간"
    ];
    const data = filteredHistory.map((history) => [
      history.id,
      history.platform,
      history.productName,
      history.optionName,
      history.price?.toLocaleString() + "원",
      history.shippingFee?.toLocaleString() + "원",
      history.sellerLocation,
      history.period
    ]);

    const csvContent = [
      headers.join(","),
      ...data.map((row) => row.join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `제품목록_${new Date().toLocaleDateString()}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // 모달이 열리는 것을 방지
    if (window.confirm("정말로 이 항목을 삭제하시겠습니까?")) {
      setFilteredHistory((prev) => prev.filter((item) => item.id !== id));
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
              <SelectItem value="productName">제품명</SelectItem>
              <SelectItem value="platform">플랫폼</SelectItem>
              <SelectItem value="optionName">옵션명</SelectItem>
              <SelectItem value="sellerLocation">판매지</SelectItem>
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
      <div className="flex justify-end items-center gap-4">
        <Button onClick={handleDownloadExcel} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          엑셀 다운로드
        </Button>
        <Select
          value={itemsPerPage.toString()}
          onValueChange={(value) => {
            setItemsPerPage(Number(value));
            setCurrentPage(1);
          }}
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
              <TableHead className="w-[80px]">번호</TableHead>
              <TableHead className="w-[120px]">플랫폼</TableHead>
              <TableHead className="w-[120px]">이미지</TableHead>
              <TableHead className="w-[200px]">제품명</TableHead>
              <TableHead className="w-[150px]">옵션명</TableHead>
              <TableHead className="w-[120px]">가격</TableHead>
              <TableHead className="w-[100px]">배송비</TableHead>
              <TableHead className="w-[150px]">판매지</TableHead>
              <TableHead className="w-[150px]">기간</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedHistory.map((history) => (
              <TableRow
                key={history.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(history)}
              >
                <TableCell>{history.id}</TableCell>
                <TableCell>{history.platform}</TableCell>
                <TableCell>
                  {history.reviewImage ? (
                    <div className="relative w-10 h-10 rounded-md overflow-hidden">
                      <Image
                        src={history.reviewImage}
                        alt="제품 이미지"
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <span className="text-muted-foreground">없음</span>
                  )}
                </TableCell>
                <TableCell>{history.productName}</TableCell>
                <TableCell>{history.optionName}</TableCell>
                <TableCell>{history.price?.toLocaleString()}원</TableCell>
                <TableCell>{history.shippingFee?.toLocaleString()}원</TableCell>
                <TableCell>{history.sellerLocation}</TableCell>
                <TableCell>{history.period}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-muted-foreground">
          전체 {filteredHistory.length}개 항목 중 {startIndex + 1}-
          {Math.min(startIndex + itemsPerPage, filteredHistory.length)}개 표시
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

      <Dialog
        open={isModalOpen}
        onOpenChange={(open) => {
          if (!open) {
            setIsModalOpen(false);
            setSelectedHistory(null);
          }
        }}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>응모 상세 정보</DialogTitle>
          </DialogHeader>
          {selectedHistory && (
            <div className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label>플랫폼</Label>
                  <p className="text-sm mt-1">{selectedHistory.platform}</p>
                </div>
                <div>
                  <Label>제품명</Label>
                  <p className="text-sm mt-1">{selectedHistory.productName}</p>
                </div>
                <div>
                  <Label>옵션명</Label>
                  <p className="text-sm mt-1">{selectedHistory.optionName}</p>
                </div>
                <div>
                  <Label>가격</Label>
                  <p className="text-sm mt-1">{selectedHistory.price?.toLocaleString()}원</p>
                </div>
                <div>
                  <Label>배송비</Label>
                  <p className="text-sm mt-1">{selectedHistory.shippingFee?.toLocaleString()}원</p>
                </div>
                <div>
                  <Label>판매지</Label>
                  <p className="text-sm mt-1">{selectedHistory.sellerLocation}</p>
                </div>
                <div>
                  <Label>기간</Label>
                  <p className="text-sm mt-1">{selectedHistory.period}</p>
                </div>
                <div>
                  <Label>제품 이미지</Label>
                  {selectedHistory.reviewImage ? (
                    <div className="relative aspect-square rounded-lg overflow-hidden border mt-2 w-32">
                      <Image
                        src={selectedHistory.reviewImage}
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
                    <p className="text-sm text-muted-foreground mt-1">
                      제품 이미지가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 