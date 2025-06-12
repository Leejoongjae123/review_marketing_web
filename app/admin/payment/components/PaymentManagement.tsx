'use client'
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ArrowRight, ArrowLeft } from "lucide-react";
import PaymentSearch from "./PaymentSearch";
import PaymentActions from "./PaymentActions";
import PaymentTable from "./PaymentTable";
import { Payment, PaymentFilters, PaymentResponse } from "../types";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import PendingPaymentsTable from './PendingPaymentsTable';
import ProcessingPaymentsTable from './ProcessingPaymentsTable';
import ProcessedPaymentsTable from './ProcessedPaymentsTable';
import PaymentConfirmModal from './PaymentConfirmModal';
import { PaymentItem } from '../types';

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
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [modalType, setModalType] = useState<'complete' | 'reject'>('complete');
  const [paymentReasons, setPaymentReasons] = useState<Record<string, string>>({});
  
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
  const [filters, setFilters] = useState<PaymentFilters>({
    searchTerm: '',
    searchCategory: 'name',
    paymentStatus: 'all',
    startDate: '',
    endDate: ''
  });
  
  // 데이터 조회 함수
  const fetchPayments = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/payments?pendingPage=${pendingPage}&processingPage=${processingPage}&processedPage=${processedPage}&pageSize=${pageSize}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        console.log(`정산 데이터 로딩 실패: ${response.status} - ${errorData.error || '알 수 없는 오류'}`);
        return;
      }
      
      const data = await response.json();
      
      // 페이징된 데이터 설정
      setPendingPayments(data.pending.data || []);
      setPendingTotalPages(data.pending.totalPages || 1);
      setPendingTotalCount(data.pending.totalCount || 0);
      
      setProcessingPayments(data.processing.data || []);
      setProcessingTotalPages(data.processing.totalPages || 1);
      setProcessingTotalCount(data.processing.totalCount || 0);
      
      setProcessedPayments(data.processed.data || []);
      setProcessedTotalPages(data.processed.totalPages || 1);
      setProcessedTotalCount(data.processed.totalCount || 0);
    } catch (error) {
      console.log('정산 데이터 로딩 실패', error);
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
      
      // 성공 시 선택 해제 및 데이터 새로고침
      setSelectedProcessing([]);
      await fetchPayments();
      
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
  
  // 검색 실행
  const handleSearch = () => {
    // 검색 시 모든 페이지를 1로 초기화
    setPendingPage(1);
    setProcessingPage(1);
    setProcessedPage(1);
    fetchPayments();
  };
  
  // 페이지 변경 핸들러
  const handlePendingPageChange = (page: number) => {
    setPendingPage(page);
  };
  
  const handleProcessingPageChange = (page: number) => {
    setProcessingPage(page);
  };
  
  const handleProcessedPageChange = (page: number) => {
    setProcessedPage(page);
  };
  
  // 초기 데이터 로드
  useEffect(() => {
    fetchPayments();
  }, [pendingPage, processingPage, processedPage, pageSize]);
  
  // URL 파라미터 변경 감지
  useEffect(() => {
    const refreshParam = searchParams.get('refresh');
    if (refreshParam === 'true') {
      fetchPayments();
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
        // 데이터 새로고침
        await fetchPayments();
        setSelectedProcessing([]);
        setPaymentReasons({});
      } else {
        // 오류 응답 처리
        const errorData = await response.json();
        console.log(`입금완료 처리 실패: ${response.status}`, errorData);
      }
    } catch (error) {
      console.log('입금완료 처리 실패', error);
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
          status: 'rejected',
          paymentsWithReasons,
        }),
      });
      
      if (response.ok) {
        // 데이터 새로고침
        await fetchPayments();
        setSelectedProcessing([]);
        setPaymentReasons({});
      } else {
        // 오류 응답 처리
        const errorData = await response.json();
        console.log(`입금불가 처리 실패: ${response.status}`, errorData);
      }
    } catch (error) {
      console.log('입금불가 처리 실패', error);
    }
  };
  
  // 결제 항목 상태 업데이트 함수
  const handleUpdatePaymentStatus = async (paymentId: string, status: string, reason?: string) => {
    try {
      // API가 'completed'와 'rejected'만 허용하므로 status 값을 변환
      let apiStatus = status;
      if (status === 'failed') {
        apiStatus = 'rejected';
      }
      
      const response = await fetch('/api/admin/payments/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentIds: [paymentId],
          status: apiStatus,
          paymentsWithReasons: [{ id: paymentId, reason: reason || '' }],
        }),
      });
      
      if (response.ok) {
        // 데이터 새로고침
        await fetchPayments();
      } else {
        // 오류 응답 처리
        const errorData = await response.json();
        console.log(`상태 업데이트 실패: ${response.status}`, errorData);
      }
    } catch (error) {
      console.log('상태 업데이트 실패', error);
    }
  };
  
  return (
    <div className="space-y-6 w-full h-full">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">정산관리</h1>
        <p className="text-muted-foreground">플랫폼의 정산을 관리합니다.</p>
      </div>
      
      {/* 검색 필터 */}
      <PaymentSearch 
        filters={filters}
        onFiltersChange={setFilters}
        onSearch={handleSearch}
      />
      
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
            <PendingPaymentsTable
              payments={pendingPayments}
              selectedItems={selectedPending}
              onSelectionChange={setSelectedPending}
              currentPage={pendingPage}
              totalPages={pendingTotalPages}
              totalCount={pendingTotalCount}
              onPageChange={handlePendingPageChange}
            />
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
          <ProcessedPaymentsTable 
            payments={processedPayments} 
            currentPage={processedPage}
            totalPages={processedTotalPages}
            totalCount={processedTotalCount}
            onPageChange={handleProcessedPageChange}
            onUpdateStatus={handleUpdatePaymentStatus}
          />
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