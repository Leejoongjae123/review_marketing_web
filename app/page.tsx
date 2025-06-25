'use client'
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Toaster } from "@/components/ui/toaster";
import { RiKakaoTalkFill } from "react-icons/ri";

export default function Home() {
  const handleKaKaoRequest = () => {
    window.open("http://pf.kakao.com/_kmxsn/chat", "_blank");
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center mb-8 gap-y-8 flex flex-col items-center justify-center">
        <h1 className="text-7xl font-bold mb-2">리뷰 커뮤니티 플랫폼</h1>
        <p className="text-muted-foreground text-2xl">역할에 맞는 서비스로 이동하세요.</p>
      </div>

      <Toaster />
      <Button
              onClick={handleKaKaoRequest}
              className="bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium w-full max-w-[300px] h-10 flex items-center justify-center gap-2 rounded-md"
            >
              <RiKakaoTalkFill className="w-6 h-6" />
              카카오로 문의
            </Button>

    </div>
  );
}
