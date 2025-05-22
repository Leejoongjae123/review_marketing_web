import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Supabase 클라이언트 생성 (서버 클라이언트 사용)
    const supabase = await createClient();
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
    // Supabase 클라이언트 생성 (서버 클라이언트 사용)
    const supabase = await createClient();
    
    // 현재 로그인한 사용자 정보 가져오기
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      return NextResponse.json({ error: '로그인이 필요합니다.' }, { status: 401 });
    }
    
    const userId = session.user.id;
    const { id } = await context.params;
    const reviewId = id;
    const body = await request.json();
    
    // 필수 필드 검증
    const { name, phone, login_account, event_account, nickname, review_image } = body;
    
    if (!name || !phone || !login_account || !event_account || !nickname) {
      return NextResponse.json({ error: '모든 필수 필드를 입력해주세요.' }, { status: 400 });
    }
    
    // 이벤트 계정 중복 체크 (전체 테이블에서)
    const { data: existingEventAccount, error: eventAccountError } = await supabase
      .from('review_participants')
      .select('id')
      .eq('event_account', event_account)
      .eq('review_id', reviewId)
      .single();
      
    if (eventAccountError && eventAccountError.code !== 'PGRST116') { // PGRST116는 결과가 없을 때의 에러
      return NextResponse.json({ error: eventAccountError.message }, { status: 500 });
    }
    
    if (existingEventAccount) {
      return NextResponse.json({ error: '이미 등록된 이벤트 계정입니다.' }, { status: 400 });
    }
    
    // 같은 리뷰에 로그인 계정 중복 체크
    const { data: existingLoginAccount, error: loginAccountError } = await supabase
      .from('review_participants')
      .select('*')
      .eq('review_id', reviewId)
      .eq('event_account', event_account)
      .single();
      
    if (loginAccountError && loginAccountError.code !== 'PGRST116') {
      return NextResponse.json({ error: loginAccountError.message }, { status: 500 });
    }
    
    if (existingLoginAccount) {
      return NextResponse.json({ error: '같은 리뷰에 이미 참여한 계정입니다.' }, { status: 400 });
    }
    
    // 참여자 추가
    const { data: newParticipant, error } = await supabase
      .from('review_participants')
      .insert({
        review_id: reviewId,
        reviewer_id: userId, // 세션에서 가져온 사용자 ID를 사용
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