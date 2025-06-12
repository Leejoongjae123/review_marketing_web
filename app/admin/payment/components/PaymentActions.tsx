'use client'
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

interface PaymentActionsProps {
  selectedIds: string[];
  onApprove: (note?: string, amount?: number) => Promise<void>;
  onReject: (note: string) => Promise<void>;
}

export default function PaymentActions({
  selectedIds,
  onApprove,
  onReject,
}: PaymentActionsProps) {
  const [approveDialogOpen, setApproveDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState<string>('');
  
  const handleApprove = async () => {
    await onApprove(note, amount ? Number(amount) : undefined);
    setApproveDialogOpen(false);
    setNote('');
    setAmount('');
  };
  
  const handleReject = async () => {
    await onReject(note);
    setRejectDialogOpen(false);
    setNote('');
  };
  
  if (selectedIds.length === 0) {
    return null;
  }
  
  return (
    <div className="flex gap-4 mt-4">
      <Button 
        onClick={() => setApproveDialogOpen(true)}
        className="bg-green-600 hover:bg-green-700"
      >
        입금완료 ({selectedIds.length}건)
      </Button>
      
      <Button 
        onClick={() => setRejectDialogOpen(true)}
        variant="destructive"
      >
        입금불가 ({selectedIds.length}건)
      </Button>
      
      {/* 입금완료 다이얼로그 */}
      <Dialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입금완료 처리</DialogTitle>
            <DialogDescription>
              {selectedIds.length}건의 정산을 입금완료 처리합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                입금액
              </Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="col-span-3"
                placeholder="원본 금액과 다를 경우 입력"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="note" className="text-right">
                메모
              </Label>
              <Textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="col-span-3"
                placeholder="필요한 경우 메모를 남겨주세요"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveDialogOpen(false)}>
              취소
            </Button>
            <Button onClick={handleApprove} className="bg-green-600 hover:bg-green-700">
              입금완료 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 입금불가 다이얼로그 */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>입금불가 처리</DialogTitle>
            <DialogDescription>
              {selectedIds.length}건의 정산을 입금불가 처리합니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="reject-note" className="text-right">
                사유
              </Label>
              <Textarea
                id="reject-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="col-span-3"
                placeholder="입금불가 사유를 입력해주세요"
                required
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              취소
            </Button>
            <Button variant="destructive" onClick={handleReject} disabled={!note.trim()}>
              입금불가 처리
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 