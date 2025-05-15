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
    
    let userRole = null;
    let userId = null;
    
    // 세션이 있으면 사용자 역할 정보 가져오기
    if (authenticated && session?.user?.id) {
      userId = session.user.id;
      
      // 사용자 역할 정보 가져오기
      const { data: userData, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('사용자 역할 정보 조회 실패:', error);
      } else if (userData) {
        userRole = userData.role;
      }
    }
    
    return NextResponse.json({ 
      authenticated,
      user: session?.user || null,
      userId,
      userRole
    });
  } catch (error) {
    console.error('인증 상태 확인 중 오류 발생:', error);
    return NextResponse.json({ 
      authenticated: false,
      error: '인증 상태 확인 중 오류가 발생했습니다.'
    }, { status: 500 });
  }
} 