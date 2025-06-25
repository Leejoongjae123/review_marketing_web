'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
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
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from "./Pagination";

interface PendingPaymentsTableProps {
  payments: Payment[];
  selectedItems: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  onPageChange: (page: number) => void;
}

export default function PendingPaymentsTable({
  payments,
  selectedItems,
  onSelectionChange,
  currentPage,
  totalPages,
  totalCount,
  onPageChange,
}: PendingPaymentsTableProps) {
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(payments.map(payment => payment.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (checked: boolean, paymentId: string) => {
    if (checked) {
      onSelectionChange([...selectedItems, paymentId]);
    } else {
      onSelectionChange(selectedItems.filter(id => id !== paymentId));
    }
  };

  const handleRowClick = (paymentId: string, e: React.MouseEvent) => {
    // 체크박스나 체크박스를 감싸는 요소를 직접 클릭한 경우는 제외
    const target = e.target as HTMLElement;
    if (target.closest('button[role="checkbox"]') || target.closest('[data-state]')) {
      return;
    }
    
    const isSelected = selectedItems.includes(paymentId);
    handleSelectOne(!isSelected, paymentId);
  };

  return (
    <div className="space-y-4">
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={payments.length > 0 && selectedItems.length === payments.length}
                  onCheckedChange={handleSelectAll}
                />
              </TableHead>
              <TableHead>이름</TableHead>
              <TableHead>은행</TableHead>
              <TableHead>계좌번호</TableHead>
              <TableHead>플랫폼</TableHead>
              <TableHead>금액</TableHead>
              <TableHead>신청일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  미정산 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow 
                  key={payment.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={(e) => handleRowClick(payment.id, e)}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(payment.id)}
                      onCheckedChange={(checked) => handleSelectOne(checked as boolean, payment.id)}
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
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="text-xs text-muted-foreground">
          총 {totalCount}건 중 {payments.length}건 표시 ({selectedItems.length}건 선택됨)
        </div>
        
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={onPageChange}
        />
      </div>
    </div>
  );
} 