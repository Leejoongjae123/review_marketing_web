import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import axios from 'axios';

// 전화번호를 한국 형식으로 변환하는 함수
function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // +82로 시작하는 경우 제거하고 0으로 시작하도록 변환
  let cleanNumber = phoneNumber.replace(/\D/g, ''); // 숫자만 추출
  
  if (cleanNumber.startsWith('82')) {
    cleanNumber = '0' + cleanNumber.substring(2);
  }
  
  // 11자리 숫자인 경우 010-XXXX-XXXX 형식으로 변환
  if (cleanNumber.length === 11 && cleanNumber.startsWith('010')) {
    const first = cleanNumber.slice(0, 3);
    const middle = cleanNumber.slice(3, 7);
    const last = cleanNumber.slice(7, 11);
    return `${first}-${middle}-${last}`;
  }
  
  // 다른 형식인 경우 원본 반환 (하이픈 제거된 숫자만)
  return cleanNumber;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect_to') || 'client/profile';
  
  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/client/auth?error=${encodeURIComponent('인증 코드가 없습니다')}`
    );
  }

  try {
    console.log("code", code)
    // 1. 카카오로부터 access_token 받기
    const tokenRes = await axios.post(
      "https://kauth.kakao.com/oauth/token",
      new URLSearchParams({
        grant_type: "authorization_code",
        client_id: process.env.NEXT_PUBLIC_KAKAO_REST_API_KEY!,
        client_secret: process.env.NEXT_PUBLIC_KAKAO_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/kakao/callback`,
        code,
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const access_token = tokenRes.data.access_token;

    // 2. 유저 정보 조회 (전화번호 포함)
    const userRes = await axios.get("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
    console.log("userRes", userRes.data)

    const kakao_account = userRes.data.kakao_account;
    const rawPhone = kakao_account.phone_number;
    const phone = formatPhoneNumber(rawPhone); // 전화번호 형식 변환
    const email = kakao_account.email || `${userRes.data.id}@kakao.user`;
    const kakao_id = userRes.data.id;
    const profile = kakao_account.profile || {};
    const nickname = profile.nickname || '사용자';

    // 3. Supabase 클라이언트 생성
    const supabase = await createClient();
    
    // 이메일로 사용자 찾기
    const { data: userData, error: getUserError } = await supabase.auth.getUser();
    
    // 현재 인증 상태 확인
    let isNewUser = false;
    
    if (getUserError || !userData.user) {
      // 이메일로 로그인 시도 (Supabase에서 지원하는 OAuth 방식은 아니지만 유사하게 처리)
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password: `kakao_${kakao_id}`, // 가상의 비밀번호 - 실제로는 작동하지 않음
      });
      
      // 로그인 실패 시(사용자가 없음) 새 사용자 생성
      if (signInError) {
        isNewUser = true;
        
        // 서비스 역할 키를 사용해 관리자 클라이언트 생성 (직접 구현보다는 서버리스 함수로 이동 권장)
        // 주의: 실제 프로덕션에서는 별도의 서버리스 함수나 서버 API를 통해 안전하게 처리해야 함
        // Supabase Edge Function을 추천합니다
        
        // 임시 방편으로 signUp을 통해 사용자 생성
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email,
          password: `kakao_${kakao_id}_${Date.now()}`,
          options: {
            data: {
              kakao_id,
              phone_number: phone,
              nickname,
              provider: 'kakao'
            }
          }
        });
        
        if (signUpError) {
          console.error('Error creating user:', signUpError.message);
          return NextResponse.redirect(
            `${process.env.NEXT_PUBLIC_SITE_URL}/client/auth?error=${encodeURIComponent('사용자 생성 실패')}`
          );
        }
        
        // 프로필 테이블에 데이터 추가
        if (signUpData.user) {
          const { error: profileError } = await supabase
            .from('profiles')
            .insert({
              id: signUpData.user.id,
              email,
              phone_number: phone,
              kakao_id: kakao_id.toString(),
              nickname,
              updated_at: new Date().toISOString()
            });
            
          if (profileError) {
            console.error('Error creating profile:', profileError.message);
          }
        }
      }
    } else {
      // 기존 사용자 메타데이터 업데이트
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          kakao_id,
          phone_number: phone,
          nickname,
          provider: 'kakao',
          updated_at: new Date().toISOString()
        }
      });

      if (updateError) {
        console.error('Error updating user:', updateError.message);
      }
      
      // profiles 테이블 업데이트
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          phone_number: phone,
          kakao_id: kakao_id.toString(),
          nickname,
          updated_at: new Date().toISOString()
        })
        .eq('id', userData.user.id);
        
      if (profileUpdateError) {
        console.error('Error updating profile:', profileUpdateError.message);
      }
    }

    // 5. 사용자 지정 경로 또는 기본 경로로 리다이렉션
    const finalRedirectPath = isNewUser
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/client/onboarding?phone=${encodeURIComponent(phone)}`
      : `${process.env.NEXT_PUBLIC_SITE_URL}/${redirectTo}`;
      
    return NextResponse.redirect(finalRedirectPath);
    
  } catch (error: any) {
    console.error('Kakao login failed:', error.response?.data || error);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_SITE_URL}/client/auth?error=${encodeURIComponent('카카오 로그인 실패')}`
    );
  }
} 