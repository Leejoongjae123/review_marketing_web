import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

export async function GET(request: Request) {
  try {
    const requestUrl = new URL(request.url);
    const redirectTo = requestUrl.searchParams.get('redirect_to') || 'client/reviews';
    
    const supabase = await createClient();
    
    // 카카오 로그인을 위한 URL 생성
    // scope 파라미터에 'phone_number' 추가하여 전화번호 정보 접근 권한 요청
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        queryParams: {
          scope: 'profile_nickname profile_image account_email phone_number',
        },
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback?redirect_to=${encodeURIComponent(redirectTo)}`
      }
    });

    if (error) {
      console.error('Kakao 로그인 URL 생성 중 오류:', error.message);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/client/auth?error=${encodeURIComponent(error.message)}`
      );
    }

    // 로그인 URL로 리다이렉션
    return NextResponse.redirect(data.url);
  } catch (error: any) {
    console.error('Kakao 인증 처리 중 오류 발생:', error.message);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/client/auth?error=${encodeURIComponent('인증 과정에서 오류가 발생했습니다')}`
    );
  }
} 