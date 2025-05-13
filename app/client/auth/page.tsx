'use client'
import React, { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AiFillThunderbolt } from "react-icons/ai";
import { RiKakaoTalkFill } from "react-icons/ri";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { Loader2 } from "lucide-react";

export default function ClientAuthPage() {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // 메시지 파라미터가 변경되면 토스트를 표시하기 위한 상태
  const [messageParam, setMessageParam] = useState<string | null>(null);
  // redirect_to 파라미터를 저장하기 위한 상태
  const [redirectTo, setRedirectTo] = useState<string | null>('client/reviews');
  
  useEffect(() => {
    // 에러 처리
    const errorParam = searchParams.get('error');
    if (errorParam) {
      setError(decodeURIComponent(errorParam));
    }

    // 메시지 파라미터 가져오기
    const message = searchParams.get('message');
    setMessageParam(message);
    
    // redirect_to 파라미터 가져오기 (없으면 기본값 사용)
    const redirectParam = searchParams.get('redirect_to');
    if (redirectParam) {
      setRedirectTo(redirectParam);
    }
  }, [searchParams]);
  
  // 메시지 파라미터가 변경될 때만 토스트 표시
  useEffect(() => {
    if (messageParam === 'login_required') {
      toast({
        title: "로그인 필요",
        description: "해당 페이지는 로그인 후 이용 가능합니다.",
        variant: "destructive",
      });
    }
  }, [messageParam, toast]);

  const handleKakaoLogin = () => {
    setIsLoading(true);
    window.location.href = `/api/auth/kakao?redirect_to=${encodeURIComponent(redirectTo || 'client/reviews')}`;
  };

  const showTestToast = () => {
    toast({
      title: "테스트 토스트",
      description: "이것은 테스트 토스트 메시지입니다.",
      variant: "default",
    });
  };

  return (
    <div className="container flex items-center justify-center min-h-[calc(100vh-80px)]">
      <div className="w-full max-w-md">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <Card className="border-none shadow-none">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">로그인</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 items-center justify-center">
            <Button
              onClick={handleKakaoLogin}
              className="bg-[#FEE500] hover:bg-[#FEE500]/90 text-black font-medium w-full max-w-[300px] h-12 flex items-center justify-center gap-2 rounded-md"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <RiKakaoTalkFill className="w-6 h-6" />
              )}
              {isLoading ? "로그인 중..." : "카카오로 로그인"}
            </Button>

          </CardContent>
        </Card>
      </div>
    </div>
  );
} 