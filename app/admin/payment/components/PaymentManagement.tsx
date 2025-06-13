'use client'
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft, Download } from "lucide-react";
import { Payment, PaymentResponse } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PendingPaymentsTable from './PendingPaymentsTable';
import ProcessingPaymentsTable from './ProcessingPaymentsTable';
import ProcessedPaymentsTable from './ProcessedPaymentsTable';
import PaymentConfirmModal from './PaymentConfirmModal';
import PendingPaymentSearch from './PendingPaymentSearch';
import ProcessedPaymentSearch from './ProcessedPaymentSearch';
import { PaymentItem } from '../types';
import TableLoader from './TableLoader';
import ExcelDownloadModal from './ExcelDownloadModal';

function PaymentManagementContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 상태 관리
  const [pendingPayments, setPendingPayments] = useState<PaymentItem[]>([]);
  const [processingPayments, setProcessingPayments] = useState<PaymentItem[]>([]);
  const [processedPayments, setProcessedPayments] = useState<PaymentItem[]>([]);
  const [selectedPending, setSelectedPending] = useState<string[]>([]);
  const [selectedProcessing, setSelectedProcessing] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [processingLoading, setProcessingLoading] = useState(false);
  const [processedLoading, setProcessedLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState<'complete' | 'reject'>('complete');
  const [paymentReasons, setPaymentReasons] = useState<Record<string, string>>({});
  const [showExcelModal, setShowExcelModal] = useState(false);
  const [excelDownloading, setExcelDownloading] = useState(false);
  
  // 페이지네이션 상태
  const [pendingPage, setPendingPage] = useState(1);
  const [pendingTotalPages, setPendingTotalPages] = useState(1);
  const [pendingTotalCount, setPendingTotalCount] = useState(0);
  
  const [processingPage, setProcessingPage] = useState(1);
  const [processingTotalPages, setProcessingTotalPages] = useState(1);
  const [processingTotalCount, setProcessingTotalCount] = useState(0);
  
  const [processedPage, setProcessedPage] = useState(1);
  const [processedTotalPages, setProcessedTotalPages] = useState(1);
  const [processedTotalCount, setProcessedTotalCount] = useState(0);
  
  const [pageSize] = useState(10);
  
  // 필터 상태
  const [pendingFilters, setPendingFilters] = useState({
    searchTerm: '',
    searchCategory: 'name'
  });
  
  const [processedFilters, setProcessedFilters] = useState({
    searchTerm: '',
    searchCategory: 'name',
    statusFilter: 'all'
  });
  
  // 미정산 데이터 조회 함수
  const fetchPendingPayments = async () => {
    setPendingLoading(true);
    try {
      const params = new URLSearchParams({
        page: pendingPage.toString(),
        pageSize: pageSize.toString(),
        type: 'pending'
      });

      if (pendingFilters.searchTerm) {
        params.append('search', pendingFilters.searchTerm);
        params.append('category', pendingFilters.searchCategory);
      }

      const response = await fetch(`/api/admin/payments/pending?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        // 미정산 데이터 로딩 실패
        return;
      }
      
      const data = await response.json();
      
      setPendingPayments(data.data || []);
      setPendingTotalPages(data.totalPages || 1);
      setPendingTotalCount(data.totalCount || 0);
    } catch (error) {
      // 미정산 데이터 로딩 실패
    } finally {
      setPendingLoading(false);
    }
  };

  // 처리대기 데이터 조회 함수
  const fetchProcessingPayments = async () => {
    setProcessingLoading(true);
    try {
      const params = new URLSearchParams({
        page: processingPage.toString(),
        pageSize: pageSize.toString(),
        type: 'processing'
      });

      const response = await fetch(`/api/admin/payments/processing?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        // 처리대기 데이터 로딩 실패
        return;
      }
      
      const data = await response.json();
      
      setProcessingPayments(data.data || []);
      setProcessingTotalPages(data.totalPages || 1);
      setProcessingTotalCount(data.totalCount || 0);
    } catch (error) {
      // 처리대기 데이터 로딩 실패
    } finally {
      setProcessingLoading(false);
    }
  };

  // 처리결과 데이터 조회 함수
  const fetchProcessedPayments = async (filters?: typeof processedFilters) => {
    setProcessedLoading(true);
    try {
      const currentFilters = filters || processedFilters;
      const params = new URLSearchParams({
        page: processedPage.toString(),
        pageSize: pageSize.toString(),
        type: 'processed'
      });

      if (currentFilters.searchTerm) {
        params.append('search', currentFilters.searchTerm);
        params.append('category', currentFilters.searchCategory);
      }
      if (currentFilters.statusFilter !== 'all') {
        params.append('status', currentFilters.statusFilter);
      }

      const response = await fetch(`/api/admin/payments/processed?${params.toString()}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        // 처리결과 데이터 로딩 실패
        return;
      }
      
      const data = await response.json();
      
      setProcessedPayments(data.data || []);
      setProcessedTotalPages(data.totalPages || 1);
      setProcessedTotalCount(data.totalCount || 0);
    } catch (error) {
      // 처리결과 데이터 로딩 실패
    } finally {
      setProcessedLoading(false);
    }
  };

  const fetchProcessedPaymentsWithFilters = async (filters: typeof processedFilters) => {
    await fetchProcessedPayments(filters);
  };

  // 전체 데이터 조회 함수 (초기 로딩용)
  const fetchAllPayments = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPendingPayments(),
        fetchProcessingPayments(),
        fetchProcessedPayments()
      ]);
    } finally {
      setLoading(false);
    }
  };
  
  // 정산 처리 함수
  const handlePaymentUpdate = async (status: 'completed' | 'failed', note?: string, amount?: number) => {
    if (selectedProcessing.length === 0) return;
    
    try {
      const response = await fetch('/api/payments/update', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds: selectedProcessing,
          status,
          note,
          amount
        }),
      });
      
      if (!response.ok) {
        return;
      }
      
      // 성공 시 선택 해제 및 처리대기 데이터만 새로고침
      setSelectedProcessing([]);
      await fetchProcessingPayments();
      
    } catch (error) {
      // 에러 처리
    }
  };
  
  // 체크박스 선택 처리
  const handlePaymentSelect = (paymentId: string, checked: boolean) => {
    if (checked) {
      setSelectedProcessing(prev => [...prev, paymentId]);
    } else {
      setSelectedProcessing(prev => prev.filter(id => id !== paymentId));
    }
  };

  // 사유 변경 처리
  const handleReasonChange = (paymentId: string, reason: string) => {
    setPaymentReasons(prev => ({ ...prev, [paymentId]: reason }));
  };
  
  // 전체 선택/해제
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProcessing(pendingPayments.map(p => p.id));
    } else {
      setSelectedProcessing([]);
    }
  };
  
  // 미정산 검색 실행
  const handlePendingSearch = async () => {
    setPendingPage(1);
    await fetchPendingPayments();
  };
  
  // 처리결과 검색 실행
  const handleProcessedSearch = async () => {
    setProcessedPage(1);
    await fetchProcessedPayments();
  };

  // 처리결과 필터 변경 시 상태만 업데이트 (자동 검색 제거)
  const handleProcessedFiltersChange = async (newFilters: typeof processedFilters) => {
    setProcessedFilters(newFilters);
    
    // 상태 필터가 변경된 경우에만 자동 검색 (상태 버튼 클릭 시)
    if (newFilters.statusFilter !== processedFilters.statusFilter) {
      setProcessedPage(1);
      // 새로운 필터로 즉시 검색 실행
      await fetchProcessedPaymentsWithFilters(newFilters);
    }
  };
  
  // 페이지 변경 핸들러
  const handlePendingPageChange = async (page: number) => {
    setPendingPage(page);
    await fetchPendingPayments();
  };
  
  const handleProcessingPageChange = async (page: number) => {
    setProcessingPage(page);
    await fetchProcessingPayments();
  };
  
  const handleProcessedPageChange = async (page: number) => {
    setProcessedPage(page);
    await fetchProcessedPayments();
  };
  
  // 초기 데이터 로드
  useEffect(() => {
    fetchAllPayments();
  }, []);
  
  // URL 파라미터 변경 감지
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true') {
      fetchAllPayments();
      const newUrl = new URL(window.location.href);
      newUrl.searchParams.delete('refresh');
      window.history.replaceState({}, '', newUrl.toString());
    }
  }, [searchParams]);
  
  // Pending에서 Processing으로 이동 (프론트엔드에서만 처리)
  const moveToProcessing = () => {
    if (selectedPending.length === 0) return;
    
    const itemsToMove = pendingPayments.filter(item => 
      selectedPending.includes(item.id)
    );
    
    // 기존 상태는 변경하지 않고 화면에서만 이동
    setProcessingPayments(prev => [...prev, ...itemsToMove]);
    setPendingPayments(prev => 
      prev.filter(item => !selectedPending.includes(item.id))
    );
    setSelectedPending([]);
  };
  
  // Processing에서 Pending으로 이동 (프론트엔드에서만 처리)
  const moveToPending = () => {
    if (selectedProcessing.length === 0) return;
    
    const itemsToMove = processingPayments.filter(item => 
      selectedProcessing.includes(item.id)
    );
    
    // 기존 상태는 변경하지 않고 화면에서만 이동
    setPendingPayments(prev => [...prev, ...itemsToMove]);
    setProcessingPayments(prev => 
      prev.filter(item => !selectedProcessing.includes(item.id))
    );
    setSelectedProcessing([]);
  };
  
  // 입금완료 처리 (상태 변경)
  const handleCompletePayment = () => {
    if (selectedProcessing.length === 0) return;
    setModalType('complete');
    setShowConfirmModal(true);
  };

  const confirmCompletePayment = async () => {
    setShowConfirmModal(false);
    try {
      // 선택된 항목들의 사유를 포함하여 전송
      const paymentsWithReasons = selectedProcessing.map(id => ({
        id,
        reason: paymentReasons[id] || ''
      }));

      const response = await fetch('/api/admin/payments/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds: selectedProcessing,
          status: 'completed',
          paymentsWithReasons,
        }),
      });
      
      if (response.ok) {
        // 처리대기와 처리결과 테이블만 새로고침
        await Promise.all([
          fetchProcessingPayments(),
          fetchProcessedPayments()
        ]);
        setSelectedProcessing([]);
        setPaymentReasons({});
      } else {
        // 오류 응답 처리
        const errorData = await response.json();
        // 입금완료 처리 실패
      }
    } catch (error) {
      // 입금완료 처리 실패
    }
  };
  
  // 입금불가 처리 (상태 변경)
  const handleRejectPayment = () => {
    if (selectedProcessing.length === 0) return;
    setModalType('reject');
    setShowConfirmModal(true);
  };

  const confirmRejectPayment = async () => {
    setShowConfirmModal(false);
    try {
      // 선택된 항목들의 사유를 포함하여 전송
      const paymentsWithReasons = selectedProcessing.map(id => ({
        id,
        reason: paymentReasons[id] || ''
      }));

      const response = await fetch('/api/admin/payments/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds: selectedProcessing,
          status: 'failed',
          paymentsWithReasons,
        }),
      });
      
      if (response.ok) {
        // 처리대기와 처리결과 테이블만 새로고침
        await Promise.all([
          fetchProcessingPayments(),
          fetchProcessedPayments()
        ]);
        setSelectedProcessing([]);
        setPaymentReasons({});
      } else {
        // 오류 응답 처리
        const errorData = await response.json();
        // 입금불가 처리 실패
      }
    } catch (error) {
      // 입금불가 처리 실패
    }
  };
  
  // 결제 항목 상태 업데이트 함수
  const handleUpdatePaymentStatus = async (paymentId: string, status: string, reason?: string) => {
    try {
      const response = await fetch('/api/admin/payments/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds: [paymentId],
          status: status,
          paymentsWithReasons: [{ id: paymentId, reason: reason || '' }],
        }),
      });
      
      if (response.ok) {
        // 처리결과 테이블만 새로고침
        await fetchProcessedPayments();
      } else {
        // 오류 응답 처리
        const errorData = await response.json();
        // 상태 업데이트 실패
      }
    } catch (error) {
      // 상태 업데이트 실패
    }
  };

  // 엑셀 다운로드 함수
  const handleExcelDownload = async (downloadType: 'current' | 'all') => {
    setExcelDownloading(true);
    setShowExcelModal(false);
    
    try {
      let url = `/api/admin/payments/excel?type=${downloadType}`;
      
      // 현재 화면 데이터인 경우 데이터를 파라미터로 전달
      if (downloadType === 'current') {
        // 데이터 구조를 엑셀 API에서 기대하는 형태로 변환
        const formattedPendingData = pendingPayments.map(payment => ({
          id: payment.id,
          name: payment.name || '정보없음',
          bank: payment.bank || '정보없음',
          accountNumber: payment.accountNumber || '정보없음',
          amount: payment.amount || 0,
          createdAt: payment.createdAt,
          status: payment.status
        }));
        
        const formattedProcessedData = processedPayments.map(payment => ({
          id: payment.id,
          name: payment.name || '정보없음',
          bank: payment.bank || '정보없음',
          accountNumber: payment.accountNumber || '정보없음',
          amount: payment.amount || 0,
          createdAt: payment.createdAt,
          updatedAt: payment.updatedAt,
          status: payment.status,
          reason: payment.reason || ''
        }));
        
        const pendingData = encodeURIComponent(JSON.stringify(formattedPendingData));
        const processedData = encodeURIComponent(JSON.stringify(formattedProcessedData));
        url += `&pendingData=${pendingData}&processedData=${processedData}`;
      }
      
      // 파일 다운로드
      const response = await fetch(url);
      
      if (!response.ok) {
        // 엑셀 다운로드 실패
        return;
      }
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // 파일명 설정
      const today = new Date().toISOString().split('T')[0];
      link.download = `정산관리_${today}.xlsx`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
    } catch (error) {
      // 엑셀 다운로드 오류
    } finally {
      setExcelDownloading(false);
    }
  };
  
      return (
    <div className="space-y-6 w-full h-full">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">정산관리</h1>
          <p className="text-muted-foreground">플랫폼의 정산을 관리합니다.</p>
        </div>
        <Button
          onClick={() => setShowExcelModal(true)}
          disabled={loading || excelDownloading}
          className="bg-green-600 hover:bg-green-700"
        >
          <Download className="h-4 w-4 mr-2" />
          {excelDownloading ? '다운로드 중...' : '엑셀 다운로드'}
        </Button>
      </div>
      

      
      {/* 상단 두 개의 테이블 (세로 배치) */}
      <div className="space-y-1">
        {/* 상단: 미정산 내역 */}
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="flex items-center justify-start text-lg gap-x-2">
              미정산 내역
              <span className="text-sm font-normal text-muted-foreground">
                {pendingTotalCount}건
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0  min-h-[200px]">
            <PendingPaymentSearch
              filters={pendingFilters}
              onFiltersChange={setPendingFilters}
              onSearch={handlePendingSearch}
              isLoading={pendingLoading}
            />
            {(loading || pendingLoading) ? (
              <TableLoader columns={['', '이름', '은행', '계좌번호', '금액', '신청일']} />
            ) : (
              <PendingPaymentsTable
                payments={pendingPayments}
                selectedItems={selectedPending}
                onSelectionChange={setSelectedPending}
                currentPage={pendingPage}
                totalPages={pendingTotalPages}
                totalCount={pendingTotalCount}
                onPageChange={handlePendingPageChange}
              />
            )}
          </CardContent>
        </Card>

        {/* 가운데: 이동 버튼 */}
        <div className="flex items-center justify-center gap-x-4">
          <Button
            onClick={moveToProcessing}
            disabled={selectedPending.length === 0 || loading}
            size="sm"
            className="p-3 bg-white text-black border "
          >
            <ChevronRight className="h-4 w-4 cursor-pointer rotate-90" />
          </Button>
          
          <Button
            onClick={moveToPending}
            disabled={selectedProcessing.length === 0 || loading}
            size="sm"
            className="p-3 bg-white text-black border"
          >
            <ChevronLeft className="h-4 w-4 cursor-pointer rotate-90" />
          </Button>
          
        </div>

        {/* 하단: 처리 대기 내역 */}
        <Card className="border-none shadow-none">
          <CardHeader className="px-0">
            <CardTitle className="flex items-center justify-between text-lg">
              <div className="flex items-center gap-x-2">
                처리 대기 내역
                <span className="text-sm font-normal text-muted-foreground">
                  {processingTotalCount}건
                </span>
              </div>
              <div className="flex gap-x-2">
                <Button 
                  className="bg-green-600 hover:bg-green-700"
                  onClick={handleCompletePayment}
                  disabled={selectedProcessing.length === 0}
                  size="sm"
                >
                  입금완료
                </Button>
                <Button 
                  className="bg-red-600 hover:bg-red-700"
                  onClick={handleRejectPayment}
                  disabled={selectedProcessing.length === 0}
                  size="sm"
                >
                  입금불가
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-0 min-h-[200px]">
            {(loading || processingLoading) ? (
              <TableLoader columns={['', '이름', '은행', '계좌번호', '금액', '신청일', '사유']} />
            ) : (
              <ProcessingPaymentsTable
                payments={processingPayments}
                selectedItems={selectedProcessing}
                onSelectionChange={setSelectedProcessing}
                currentPage={processingPage}
                totalPages={processingTotalPages}
                totalCount={processingTotalCount}
                onPageChange={handleProcessingPageChange}
                onReasonChange={handleReasonChange}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* 하단 처리결과 테이블 */}
      <Card className="border-none shadow-none p-0">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center justify-start text-lg gap-x-2">
            처리결과
            <span className="text-sm font-normal text-muted-foreground">
              {processedTotalCount}건
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0 min-h-[200px]">
          <ProcessedPaymentSearch
            filters={processedFilters}
            onFiltersChange={handleProcessedFiltersChange}
            onSearch={handleProcessedSearch}
            isLoading={processedLoading}
          />
          {(loading || processedLoading) ? (
            <TableLoader columns={['이름', '은행', '계좌번호', '금액', '신청일', '처리일자', '상태', '사유', '관리']} />
          ) : (
            <ProcessedPaymentsTable 
              payments={processedPayments} 
              currentPage={processedPage}
              totalPages={processedTotalPages}
              totalCount={processedTotalCount}
              onPageChange={handleProcessedPageChange}
              onUpdateStatus={handleUpdatePaymentStatus}
            />
          )}
        </CardContent>
      </Card>

      {/* 확인 모달 */}
      <PaymentConfirmModal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        onConfirm={modalType === 'complete' ? confirmCompletePayment : confirmRejectPayment}
        payments={processingPayments.filter(p => selectedProcessing.includes(p.id))}
        type={modalType}
      />

      {/* 엑셀 다운로드 모달 */}
      <ExcelDownloadModal
        isOpen={showExcelModal}
        onClose={() => setShowExcelModal(false)}
        onDownload={handleExcelDownload}
        isLoading={excelDownloading}
      />
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="space-y-4 w-full h-full">
      <h1 className="text-2xl font-bold tracking-tight">정산관리</h1>
      <p className="text-muted-foreground">데이터를 불러오는 중...</p>
    </div>
  );
}

export default function PaymentManagement() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <PaymentManagementContent />
    </Suspense>
  );
} 