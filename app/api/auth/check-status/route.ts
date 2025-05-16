import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // 현재 세션 확인
    const { data: { session } } = await supabase.auth.getSession();
    
    // 세션이 있으면 인증된 것으로 간주
    const authenticated = !!session;
    
    // 기본값 설정
    let status = null;
    let role = null;
    
    // 세션이 있으면 사용자 정보 가져오기
    if (authenticated && session?.user?.id) {
      const userId = session.user.id;
      
      // 사용자 프로필 정보 가져오기
      const { data: profileData, error } = await supabase
        .from('profiles')
        .select('status, role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.log('프로필 정보 조회 실패:', error.message);
      } else if (profileData) {
        status = profileData.status;
        role = profileData.role;
      }
    }
    
    return NextResponse.json({ 
      authenticated,
      status,
      role
    });
  } catch (error) {
    console.log('인증 상태 확인 중 오류 발생');
    return NextResponse.json({ 
      authenticated: false,
      error: '인증 상태 확인 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 