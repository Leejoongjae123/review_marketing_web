import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 서버 컴포넌트에서 Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL과 ANON KEY가 설정되지 않았습니다.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = await context.params;
    const reviewId = id;
    
    // 참여자 정보 가져오기
    const { data: participants, error } = await supabase
      .from('review_participants')
      .select('*')
      .eq('review_id', reviewId);
      
    if (error) {
      console.error('참여자 조회 데이터베이스 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ participants });
  } catch (error) {
    console.error('참여자 조회 오류:', error);
    return NextResponse.json({ error: '참여자 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 서버 컴포넌트에서 Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL과 ANON KEY가 설정되지 않았습니다.');
    }
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { id } = await context.params;
    const reviewId = id;
    const body = await request.json();
    
    // 필수 필드 검증
    const { name, phone, login_account, event_account, nickname, review_image } = body;
    
    if (!name || !phone || !login_account || !event_account || !nickname) {
      return NextResponse.json({ error: '모든 필수 필드를 입력해주세요.' }, { status: 400 });
    }
    
    // 이벤트 계정 중복 체크
    const { data: existingParticipant, error: checkError } = await supabase
      .from('review_participants')
      .select('id')
      .eq('event_account', event_account)
      .single();
      
    if (checkError && checkError.code !== 'PGRST116') { // PGRST116는 결과가 없을 때의 에러
      return NextResponse.json({ error: checkError.message }, { status: 500 });
    }
    
    if (existingParticipant) {
      return NextResponse.json({ error: '이미 등록된 이벤트 계정입니다.' }, { status: 400 });
    }
    
    // 참여자 추가
    const { data: newParticipant, error } = await supabase
      .from('review_participants')
      .insert({
        review_id: reviewId,
        name,
        phone,
        login_account,
        event_account,
        nickname,
        review_image,
      })
      .select()
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ participant: newParticipant });
  } catch (error) {
    console.error('참여자 추가 오류:', error);
    return NextResponse.json({ error: '참여자 추가 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 