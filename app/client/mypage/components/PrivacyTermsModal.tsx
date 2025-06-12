'use client'

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { FileText } from "lucide-react";

export default function PrivacyTermsModal() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="sm"
          className="ml-2 h-6 px-2 text-xs"
        >
          <FileText className="h-3 w-3 mr-1" />
          개인정보 이용약관
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>개인정보 수집 및 이용 약관</DialogTitle>
          <DialogDescription>
            ㈜티와이마케팅 주민등록번호 개인정보 수집 이용에 대한 약관을 확인해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="h-[60vh] w-full rounded-md border p-4 overflow-y-auto">
          <div className="space-y-6 text-sm">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="font-medium text-center mb-4">
                ㈜티와이마케팅 주민등록번호 개인정보 수집 이용 목적은 다음과 같습니다.<br/>
                내용을 자세히 읽어보신 후 동의여부를 결정하여 주시기 바랍니다.
              </p>
            </div>

            <section>
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-semibold">처리하는자 :</div>
                  <div className="col-span-2">㈜티와이마케팅</div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-semibold">처리목적 :</div>
                  <div className="col-span-2">경품수령 및 원천징수를 위한 제세공과금 처리</div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-semibold">수집항목 :</div>
                  <div className="col-span-2">주민등록번호</div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-semibold">보유·이용기간 :</div>
                  <div className="col-span-2">수집일로부터 1개월까지</div>
                </div>
                
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="font-semibold">관련법규 :</div>
                  <div className="col-span-2">
                    [소득세법] 제 21조 (기타소득), 제 127조(원천징수의무), 제164조(지급명세의 제출)
                  </div>
                </div>
              </div>
            </section>

            <section className="border-t pt-4">
              <p className="text-sm leading-relaxed">
                자세한 내용은 개인정보처리방침을 확인해주세요.
              </p>
            </section>

            <section className="bg-yellow-50 p-4 rounded-lg">
              <p className="text-sm leading-relaxed font-medium">
                귀하는 위와 같이 개인정보를 수집·이용하는데 동의를 거부할 권리가 있습니다. 
                필수 수집항목에 대한 동의를 거절하는 경우 서비스 이용이 제한될 수 있습니다.
              </p>
            </section>
          </div>
        </div>
        
        <div className="flex justify-end mt-4">
          <Button onClick={() => setIsOpen(false)}>
            동의
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 