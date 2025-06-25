'use client';

import React, { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Payment } from '../types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from "./Pagination";

interface ProcessingPaymentsTableProps {
  payments: Payment[];
  selectedItems: string[];
  onSelectionChange: (selected: string[]) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
  onReasonChange: (paymentId: string, reason: string) => void;
}

export default function ProcessingPaymentsTable({
  payments,
  selectedItems,
  onSelectionChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
  onReasonChange,
}: ProcessingPaymentsTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(payments.map(p => p.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectItem = (paymentId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedItems, paymentId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== paymentId));
    }
  };

  const [reasons, setReasons] = useState<Record<string, string>>({});

  const handleReasonInputChange = (paymentId: string, value: string) => {
    setReasons(prev => ({ ...prev, [paymentId]: value }));
    onReasonChange(paymentId, value);
  };

  if (payments.length === 0) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox checked={false} onCheckedChange={() => {}} disabled />
                </TableHead>
                <TableHead>이름</TableHead>
                <TableHead>은행</TableHead>
                <TableHead>계좌번호</TableHead>
                <TableHead>플랫폼</TableHead>
                <TableHead>금액</TableHead>
                <TableHead>신청일</TableHead>
                <TableHead>사유</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  처리 대기 중인 내역이 없습니다.
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            총 {totalCount}건 중 0건 표시 (0건 선택됨)
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={Math.max(1, totalPages)}
            onPageChange={onPageChange}
          />
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
              <TableHead className="w-12">
                <Checkbox
                  checked={payments.length > 0 && selectedItems.length === payments.length}
                  onCheckedChange={handleSelectAll}
                  aria-label="전체 선택"
                />
              </TableHead>
              <TableHead>이름</TableHead>
              <TableHead>은행</TableHead>
              <TableHead>계좌번호</TableHead>
              <TableHead>플랫폼</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>신청일</TableHead>
              <TableHead>사유</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((payment) => (
              <TableRow 
                key={payment.id}
                className="cursor-pointer hover:bg-muted/50"
                onClick={(e) => {
                  // Input 필드나 체크박스를 클릭한 경우는 제외
                  if (e.target instanceof HTMLInputElement) return;
                  handleSelectItem(payment.id, !selectedItems.includes(payment.id));
                }}
              >
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selectedItems.includes(payment.id)}
                    onCheckedChange={(checked) => handleSelectItem(payment.id, !!checked)}
                    aria-label={`${payment.name} 선택`}
                  />
                </TableCell>
                <TableCell className="font-medium">{payment.name}</TableCell>
                <TableCell>{payment.user_bank_name || '-'}</TableCell>
                <TableCell>{payment.user_account_number || '-'}</TableCell>
                <TableCell>{payment.platform || '-'}</TableCell>
                <TableCell>{typeof payment.payment_amount === 'number' && !isNaN(payment.payment_amount) ? new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(payment.payment_amount) : '-'}</TableCell>
                <TableCell>
                  {payment.payment_created_at && !isNaN(new Date(payment.payment_created_at).getTime()) ? 
                  new Date(payment.payment_created_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: '2-digit', 
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) : '-'}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Input
                    placeholder="사유 입력"
                    value={reasons[payment.id] || payment.reason || ''}
                    onChange={(e) => handleReasonInputChange(payment.id, e.target.value)}
                    className="w-32"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          총 {totalCount}건 중 {payments.length}건 표시 ({selectedItems.length}건 선택됨)
        </div>
        <Pagination
          currentPage={currentPage}
          totalPages={Math.max(1, totalPages)}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
} 