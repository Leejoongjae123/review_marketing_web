'use client';

import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Payment } from '../types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Edit } from 'lucide-react';
import Pagination from "./Pagination";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ProcessedPaymentsTableProps {
  payments: Payment[];
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onUpdateStatus?: (id: string, status: string, reason?: string) => Promise<void>;
}

export default function ProcessedPaymentsTable({
  payments,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onUpdateStatus,
}: ProcessedPaymentsTableProps) {
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<string>("");
  const [newReason, setNewReason] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleOpenModal = (payment: Payment) => {
    setSelectedPayment(payment);
    setNewStatus(payment.status || payment.payment_status || '');
    setNewReason(payment.reason || '');
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setSelectedPayment(null);
    setIsModalOpen(false);
  };

  const handleStatusChange = async () => {
    if (!selectedPayment || !onUpdateStatus) return;
    
    try {
      setIsUpdating(true);
      await onUpdateStatus(selectedPayment.id, newStatus, newReason);
      handleCloseModal();
    } catch (error) {
      console.log('상태 업데이트 중 오류 발생:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">
            입금완료
          </span>
        );
      case 'failed':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-800">
            입금불가
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-orange-100 text-orange-800">
            거절됨
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">
            {status}
          </span>
        );
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (dateString && !isNaN(new Date(dateString).getTime())) {
      return new Date(dateString).toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return '-';
  };

  const formatAmountKRW = (amount?: number) => {
    if (typeof amount === 'number' && !isNaN(amount)) {
      return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(amount);
    }
    return '-';
  };

  if (payments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>은행</TableHead>
                <TableHead>계좌번호</TableHead>
                <TableHead>플랫폼</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead>처리일자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>사유</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                  처리 완료된 내역이 없습니다.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">총 {totalCount}건 중 0건 표시</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>입금완료: 0건</span>
            <span>입금불가: 0건</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
                          <TableRow>
                <TableHead>이름</TableHead>
                <TableHead>은행</TableHead>
                <TableHead>계좌번호</TableHead>
                <TableHead>플랫폼</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead>처리일자</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>사유</TableHead>
                <TableHead>관리</TableHead>
              </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow key={payment.id}>
                <TableCell className="font-medium">{payment.name}</TableCell>
                <TableCell>{payment.bank || payment.user_bank_name || '-'}</TableCell>
                <TableCell>{payment.accountNumber || payment.user_account_number || '-'}</TableCell>
                <TableCell>{payment.platform || '-'}</TableCell>
                                  <TableCell>{formatAmountKRW(payment.review_fee || payment.amount || payment.payment_amount || 0)}</TableCell>
                <TableCell>{formatDateTime(payment.createdAt || payment.payment_created_at || '')}</TableCell>
                <TableCell>{formatDateTime(payment.updatedAt || payment.payment_processed_at || '')}</TableCell>
                <TableCell>{getStatusBadge(payment.status || payment.payment_status || '')}</TableCell>
                <TableCell>{payment.reason || '-'}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleOpenModal(payment)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-4 w-4" />
                    <span>수정</span>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground">총 {totalCount}건 중 {payments.length}건 표시</span>
          <div className="flex gap-4 text-xs text-muted-foreground">
            <span>입금완료: {payments.filter(p => p.status === 'completed').length}건</span>
            <span>입금불가: {payments.filter(p => p.status === 'failed').length}건</span>
          </div>
        </div>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>

      {/* 수정 모달 */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>결제 정보 수정</DialogTitle>
          </DialogHeader>
          {selectedPayment && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">이름</Label>
                <div className="col-span-3">{selectedPayment.name}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">은행</Label>
                <div className="col-span-3">{selectedPayment.bank}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">계좌번호</Label>
                <div className="col-span-3">{selectedPayment.accountNumber}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">금액</Label>
                <div className="col-span-3">{formatAmountKRW(selectedPayment.amount)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">신청일</Label>
                <div className="col-span-3">{formatDateTime(selectedPayment.createdAt)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">처리일자</Label>
                <div className="col-span-3">{formatDateTime(selectedPayment.updatedAt)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="status" className="text-right">상태</Label>
                <Select 
                  value={newStatus} 
                  onValueChange={setNewStatus}
                  disabled={isUpdating}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="상태 선택" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="completed">입금완료</SelectItem>
                    <SelectItem value="failed">입금불가</SelectItem>
                    <SelectItem value="rejected">거절됨</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="reason" className="text-right">사유</Label>
                <Input
                  id="reason"
                  value={newReason}
                  onChange={(e) => setNewReason(e.target.value)}
                  placeholder="사유를 입력하세요"
                  className="col-span-3"
                  disabled={isUpdating}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseModal} disabled={isUpdating}>
              취소
            </Button>
            <Button onClick={handleStatusChange} disabled={isUpdating}>
              {isUpdating ? "저장 중..." : "저장"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 