'use client'
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Payment } from "../types";

interface PaymentTableProps {
  payments: Payment[];
  selectedPayments: string[];
  onPaymentSelect: (paymentId: string, checked: boolean) => void;
  onSelectAll: (checked: boolean) => void;
  loading: boolean;
  showActions?: boolean;
}

export default function PaymentTable({ 
  payments, 
  selectedPayments, 
  onPaymentSelect, 
  onSelectAll, 
  loading,
  showActions = true
}: PaymentTableProps) {
  
  const getStatusStyle = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-500 text-white";
      case "pending":
        return "bg-yellow-500 text-white";
      case "processing":
        return "bg-blue-500 text-white";
      case "failed":
        return "bg-red-500 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "입금완료";
      case "pending":
        return "미정산";
      case "processing":
        return "처리중";
      case "failed":
        return "입금불가";
      default:
        return "알 수 없음";
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <p>데이터를 불러오는 중...</p>
      </div>
    );
  }

  return (
    <div className="rounded-md border overflow-x-auto">
      <table className="w-full min-w-[1200px]">
        <thead>
          <tr className="border-b bg-muted/50">
            {showActions && (
              <th className="h-12 px-4 text-left align-middle font-medium">
                <Checkbox
                  checked={payments.length > 0 && selectedPayments.length === payments.length}
                  onCheckedChange={onSelectAll}
                />
              </th>
            )}
            <th className="h-12 px-4 text-left align-middle font-medium">이름</th>
            <th className="h-12 px-4 text-left align-middle font-medium">전화번호</th>
            <th className="h-12 px-4 text-left align-middle font-medium">닉네임</th>
            <th className="h-12 px-4 text-left align-middle font-medium">리뷰 제목</th>
            <th className="h-12 px-4 text-left align-middle font-medium">플랫폼</th>
            <th className="h-12 px-4 text-right align-middle font-medium">정산 금액</th>
            <th className="h-12 px-4 text-center align-middle font-medium">상태</th>
            <th className="h-12 px-4 text-left align-middle font-medium">은행정보</th>
            <th className="h-12 px-4 text-center align-middle font-medium">신청일</th>
            <th className="h-12 px-4 text-center align-middle font-medium">처리일</th>
            {!showActions && (
              <th className="h-12 px-4 text-left align-middle font-medium">처리자</th>
            )}
          </tr>
        </thead>
        <tbody>
          {payments.map((payment) => (
            <tr key={payment.id} className="border-b hover:bg-muted/50">
              {showActions && (
                <td className="p-4">
                  <Checkbox
                    checked={selectedPayments.includes(payment.id)}
                    onCheckedChange={(checked) => onPaymentSelect(payment.id, checked as boolean)}
                  />
                </td>
              )}
              <td className="p-4 font-medium">{payment.name}</td>
              <td className="p-4">{payment.phone}</td>
              <td className="p-4">{payment.nickname}</td>
              <td className="p-4 max-w-[200px] truncate" title={payment.review_title}>
                {payment.review_title || '-'}
              </td>
              <td className="p-4">{payment.platform || '-'}</td>
              <td className="p-4 text-right font-mono">
                {formatAmount(payment.payment_amount)}원
              </td>
              <td className="p-4 text-center">
                <Badge className={getStatusStyle(payment.payment_status)}>
                  {getStatusText(payment.payment_status)}
                </Badge>
              </td>
              <td className="p-4">
                <div className="text-sm">
                  <div>{payment.user_bank_name || '-'}</div>
                  <div className="text-muted-foreground font-mono">
                    {payment.user_account_number || '-'}
                  </div>
                </div>
              </td>
              <td className="p-4 text-center">
                {formatDate(payment.payment_created_at)}
              </td>
              <td className="p-4 text-center">
                {payment.payment_processed_at ? formatDate(payment.payment_processed_at) : '-'}
              </td>
              {!showActions && (
                <td className="p-4">
                  {payment.admin_name || '-'}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {payments.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          정산 데이터가 없습니다.
        </div>
      )}
    </div>
  );
} 