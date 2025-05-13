import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const supabase = await createClient();
    
    // 로그아웃 처리
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('로그아웃 처리 중 오류 발생:', error);
    return NextResponse.json({ error: '로그아웃 처리 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 