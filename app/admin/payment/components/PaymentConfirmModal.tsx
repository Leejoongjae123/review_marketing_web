'use client'
import React from 'react';
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
import { Payment } from '../types';

interface PaymentConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  payments: Payment[];
  type: 'complete' | 'reject';
}

const PaymentConfirmModal: React.FC<PaymentConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  payments,
  type
}) => {
  const title = type === 'complete' ? '입금 완료 확인' : '입금 불가 확인';
  const description = type === 'complete'
    ? '선택된 내역을 입금 완료 처리하시겠습니까? 다음 금액이 처리됩니다:'
    : '선택된 내역을 입금 불가 처리하시겠습니까? 다음 내역이 거절됩니다:';

  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>
            {description}
            <div className="mt-4 max-h-60 overflow-y-auto">
              {payments.map((payment) => (
                <div key={payment.id} className="flex justify-between items-center py-1 border-b last:border-b-0">
                  <span className="font-medium">{payment.name} ({payment.bank || payment.user_bank_name || '-'})</span>
                  <span className="text-right text-gray-700">{(payment.amount || payment.payment_amount || 0).toLocaleString()}원</span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-sm text-gray-500">
              총 {payments.length}건의 내역이 처리됩니다.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>취소</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>확인</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default PaymentConfirmModal; 