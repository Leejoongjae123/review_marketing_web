'use client'
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";
import { RiKakaoTalkFill } from "react-icons/ri";
import { AiFillThunderbolt } from "react-icons/ai";

export default function ClientAuthPage() {
  const handleKakaoLogin = () => {
    // TODO: 카카오 로그인 구현
    window.location.href = "/api/auth/kakao";
  };

  return (
    <div className="space-y-4 w-full h-full flex flex-col items-center justify-center min-h-[80vh]">
      
      
      <Card className="w-full max-w-md" style={{ border: "none" }}>
        <CardHeader className="text-center">
        <h2 className="text-xl font-semibold">
            <AiFillThunderbolt className="inline-block mr-2 text-[#FEE500]" />
            3초 만에 로그인하기
          </h2>
          <CardDescription>카카오 계정으로 간편하게 로그인하세요</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button 
            onClick={handleKakaoLogin}
            className="bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium w-full max-w-[300px] h-12 flex items-center gap-2"
          >
            <RiKakaoTalkFill className="w-6 h-6" />
            카카오로 로그인
          </Button>
        </CardContent>
      </Card>
    </div>
  );
} 