import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'edge';

async function getKakaoUserInfo(accessToken: string) {
  try {
    const response = await fetch('https://kapi.kakao.com/v2/user/me', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
      }
    });

    if (!response.ok) {
      throw new Error('카카오 사용자 정보 조회 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('카카오 API 호출 중 오류:', error);
    return null;
    
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const redirectTo = url.searchParams.get('redirect_to') || 'client/profile';
  
  if (code) {
    const supabase = await createClient();
    
    // 코드를 세션으로 교환
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (error) {
      console.error('Error exchanging code for session:', error.message);
      return NextResponse.redirect(
        `${process.env.NEXT_PUBLIC_SITE_URL}/client/auth?error=${encodeURIComponent(error.message)}`
      );
    }
    
    // 현재 사용자 정보와 세션 가져오기
    const { data: userResponse } = await supabase.auth.getUser();
    const { data: sessionResponse } = await supabase.auth.getSession();
    
    const user = userResponse.user;
    const session = sessionResponse.session;
    
    console.log("user", user);

    // 사용자 정보가 있으면 프로필 테이블 체크 및 업데이트
    if (user) {
      try {
        let phoneNumber = '';
        
        // 카카오 로그인인 경우
        if (user.app_metadata.provider === 'kakao') {
          // 세션에서 카카오 액세스 토큰 가져오기
          const kakaoAccessToken = session?.provider_token;
          
          if (kakaoAccessToken) {
            // 카카오 API로 사용자 정보 가져오기
            const kakaoUserInfo = await getKakaoUserInfo(kakaoAccessToken);
            
            if (kakaoUserInfo && kakaoUserInfo.kakao_account) {
              // 카카오 계정에서 전화번호 가져오기 (동의 필요)
              phoneNumber = kakaoUserInfo.kakao_account.phone_number || '';
              
              // 전화번호를 사용자 메타데이터에 저장
              if (phoneNumber) {
                await supabase.auth.updateUser({
                  data: { phone_number: phoneNumber }
                });
              }
            }
          }
        } else {
          // 다른 로그인 방식의 경우 기존 로직 사용
          phoneNumber = user.user_metadata?.phone_number || '';
        }
        
        // 프로필 테이블에서 사용자 정보 확인
        const { data: existingProfile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
          
        if (profileError && profileError.code !== 'PGRST116') { // PGRST116는 데이터 없음 에러
          console.error('프로필 조회 중 오류 발생:', profileError.message);
        }
        console.log("existingProfile", existingProfile);
        await supabase.auth.updateUser({
          data: { 'role': existingProfile?.role }
        });
        
        if (existingProfile) {
          // 기존 프로필이 있는 경우 업데이트
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              phone: phoneNumber,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
            
          if (updateError) {
            console.error('프로필 업데이트 중 오류 발생:', updateError.message);
          }
        } else {
          // 프로필이 없는 경우 새로 생성
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              phone: phoneNumber,
              updated_at: new Date().toISOString()
            });
            
          if (insertError) {
            console.error('프로필 생성 중 오류 발생:', insertError.message);
          }
        }
        
        // 성공적으로 처리된 경우 지정된 redirect_to 경로로 리다이렉션
        const redirectUrl = new URL(`/${redirectTo}`, url.origin);
        console.log("redirectUrl", redirectUrl);
        return NextResponse.redirect(redirectUrl);
      } catch (error: any) {
        console.error('프로필 처리 중 예외 발생:', error.message);
        // 에러가 발생해도 지정된 redirect_to 경로로 이동
        return NextResponse.redirect(new URL(`/${redirectTo}`, url.origin));
      }
    }
  }

  // 오류 발생 시 인증 페이지로 리다이렉션
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_SITE_URL}/client/auth?error=${encodeURIComponent('로그인 중 오류가 발생했습니다')}`
  );
} 