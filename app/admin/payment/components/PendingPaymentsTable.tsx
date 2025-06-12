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
import { PaymentItem } from '../types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Pagination from "./Pagination";

interface PendingPaymentsTableProps {
  payments: PaymentItem[];
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
              <TableHead>금액</TableHead>
              <TableHead>신청일</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  미정산 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedItems.includes(payment.id)}
                      onCheckedChange={(checked) => handleSelectOne(checked as boolean, payment.id)}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{payment.name}</TableCell>
                  <TableCell>{payment.bank}</TableCell>
                  <TableCell>{payment.accountNumber}</TableCell>
                  <TableCell>{typeof payment.amount === 'number' && !isNaN(payment.amount) ? new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW' }).format(payment.amount) : '-'}</TableCell>
                  <TableCell>
                    {payment.createdAt && !isNaN(new Date(payment.createdAt).getTime()) ? 
                    new Date(payment.createdAt).toLocaleDateString('ko-KR', {
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