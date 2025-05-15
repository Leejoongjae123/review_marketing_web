import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: '이메일과 비밀번호를 모두 입력해주세요.' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 401 }
      );
    }

    // 관리자 페이지에서 로그인한 경우, role 검증
    if (request.headers.get('referer')?.includes('/admin')) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (!profile || profile.role !== 'master') {
        // 로그아웃 처리 - 관리자 아닌 사람은 로그인 불가
        await supabase.auth.signOut();
        return NextResponse.json(
          { error: '관리자 권한이 없습니다.' },
          { status: 403 }
        );
      }
    }

    return NextResponse.json({ 
      user: data.user, 
      message: '로그인 성공' 
    });
  } catch (error) {
    console.error('로그인 에러:', error);
    return NextResponse.json(
      { error: '로그인 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 