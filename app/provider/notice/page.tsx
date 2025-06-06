'use client'
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, ChevronLeft, ChevronRight, Download, Plus, Edit, Trash2, Pin, Eye } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

// Notice 타입 정의
interface Notice {
  id: string | number;
  title: string;
  content: string;
  status: string;
  author_id?: string;
  author_name?: string;
  category: string;
  priority: string;
  is_pinned: boolean;
  view_count: number;
  created_at: string;
  updated_at?: string;
}

export default function ProviderNoticePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [notices, setNotices] = useState<Notice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noticeToDelete, setNoticeToDelete] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const getUser = async () => {
    const { data, error } = await supabase.auth.getUser();
    console.log("getUser", data);
  };

  const fetchNotices = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/notices?search=${encodeURIComponent(searchTerm)}&page=${currentPage}&limit=${pageSize}`
      );
      
      if (!response.ok) {
        // 에러 처리
        return;
      }
      
      const result = await response.json();
      // API 응답 구조에 맞게 데이터 처리
      const noticesData = result.data || [];
      const pagination = result.pagination || { page: 1, limit: 10, total: 0, totalPages: 1 };
      
      // 중요 공지사항을 상단에 정렬
      const sortedNotices = noticesData.sort((a: Notice, b: Notice) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      
      setNotices(sortedNotices);
      setTotalCount(pagination.total);
      setTotalPages(pagination.totalPages);
    } catch (error) {
      // 에러 처리
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getUser();
    fetchNotices();
  }, [currentPage, pageSize]);

  // URL 파라미터 변경 감지하여 목록 새로고침
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true') {
      fetchNotices();
      // URL에서 refresh 파라미터 제거
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);

  const handleSearch = () => {
    setCurrentPage(1);
    fetchNotices();
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-500 text-white px-2 py-1 rounded-md";
      case "inactive":
        return "bg-gray-500 text-white px-2 py-1 rounded-md";
      default:
        return "bg-yellow-500 text-white px-2 py-1 rounded-md";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "활성";
      case "inactive":
        return "비활성";
      default:
        return "알 수 없음";
    }
  };

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500 text-white";
      case "high":
        return "bg-orange-500 text-white";
      case "normal":
        return "bg-blue-500 text-white";
      case "low":
        return "bg-gray-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getPriorityText = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "긴급";
      case "high":
        return "높음";
      case "normal":
        return "보통";
      case "low":
        return "낮음";
      default:
        return "보통";
    }
  };

  const getCategoryText = (category: string) => {
    switch (category) {
      case "general":
        return "일반";
      case "event":
        return "이벤트";
      case "maintenance":
        return "점검";
      case "update":
        return "업데이트";
      default:
        return "일반";
    }
  };

  const handleExcelDownload = () => {
    // 엑셀 다운로드 로직 구현
    console.log('엑셀 다운로드');
  };

  const handleDeleteNotice = (id: string | number) => {
    setNoticeToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (noticeToDelete) {
      // TODO: API 연동
      console.log('공지사항 삭제:', noticeToDelete);
      setDeleteDialogOpen(false);
      setNoticeToDelete(null);
    }
  };

  const handleRowClick = (noticeId: string | number) => {
    router.push(`/provider/notice/${noticeId}`);
  };

  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">공지사항</h1>
      <p className="text-muted-foreground">플랫폼의 공지사항을 확인합니다.</p>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 flex gap-2">
          <Input
            placeholder="검색어를 입력하세요 (제목 기준)"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            className="w-full"
          />
        </div>
        
        <Button onClick={handleSearch}>
          <Search className="h-4 w-4 mr-2" />
          검색
        </Button>
      </div>
      
      
      
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p>데이터를 불러오는 중...</p>
        </div>
      ) : (
        <div className="rounded-md border overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="h-12 px-4 text-center align-middle font-medium">번호</th>
                <th className="h-12 px-4 text-left align-middle font-medium">제목</th>
                <th className="h-12 px-4 text-center align-middle font-medium">등록일</th>
                <th className="h-12 px-4 text-center align-middle font-medium">조회수</th>
              </tr>
            </thead>
            <tbody>
              {notices.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    공지사항이 없습니다.
                  </td>
                </tr>
              ) : (
                notices.map((notice, index) => (
                  <tr 
                    key={notice.id} 
                    className="border-b hover:bg-muted/50 cursor-pointer"
                    onClick={() => handleRowClick(notice.id)}
                  >
                    <td className="p-4 text-center">{((currentPage - 1) * pageSize) + index + 1}</td>
                    <td className="p-4 text-left">
                      <div className="flex items-center gap-2">
                        {notice.is_pinned && (
                          <Badge className="bg-red-500 text-white text-xs px-2 py-1">
                            중요
                          </Badge>
                        )}
                        <span className={notice.is_pinned ? "font-bold" : ""}>
                          {notice.title}
                        </span>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      {notice.created_at ? new Date(notice.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Eye className="w-4 h-4 text-gray-500" />
                        {notice.view_count || 0}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center">
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
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) {
                  pageNumber = i + 1;
                } else if (currentPage <= 3) {
                  pageNumber = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i;
                } else {
                  pageNumber = currentPage - 2 + i;
                }
                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    className="w-9"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
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
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>공지사항 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 공지사항을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
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