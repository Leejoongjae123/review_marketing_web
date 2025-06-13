'use client'
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Download } from 'lucide-react';

interface ExcelDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDownload: (downloadType: 'current' | 'all') => void;
  isLoading?: boolean;
}

export default function ExcelDownloadModal({
  isOpen,
  onClose,
  onDownload,
  isLoading = false
}: ExcelDownloadModalProps) {
  const [downloadType, setDownloadType] = useState<'current' | 'all'>('current');

  const handleDownload = () => {
    onDownload(downloadType);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            엑셀 다운로드
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            다운로드할 데이터 범위를 선택해주세요.
          </p>
          
          <RadioGroup value={downloadType} onValueChange={(value) => setDownloadType(value as 'current' | 'all')}>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="current" id="current" />
              <Label htmlFor="current" className="cursor-pointer">
                현재 화면 데이터만 다운로드
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer">
                전체 데이터 다운로드
              </Label>
            </div>
          </RadioGroup>
          
          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-md">
            <p>• 미정산 내역과 처리결과 데이터가 각각 별도 시트로 생성됩니다.</p>
            <p>• 전체 데이터 다운로드 시 시간이 다소 소요될 수 있습니다.</p>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
          >
            취소
          </Button>
          <Button
            onClick={handleDownload}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700"
          >
            {isLoading ? '다운로드 중...' : '다운로드'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 