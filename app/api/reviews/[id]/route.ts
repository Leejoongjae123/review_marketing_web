import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 서버 컴포넌트에서 Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL과 ANON KEY가 설정되지 않았습니다.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const {id} = await params
    const reviewId = id
    // 리뷰 정보 가져오기
    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();
      
    if (error) {
      console.error('리뷰 조회 데이터베이스 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!review) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ review });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    return NextResponse.json({ error: '리뷰 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 