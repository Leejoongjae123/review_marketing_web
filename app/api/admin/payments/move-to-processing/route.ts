import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 권한 체크
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user) {
      return NextResponse.json({ error: '인증이 필요합니다.' }, { status: 401 });
    }
    
    // 사용자 프로필 조회하여 관리자 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.user.id)
      .single();
    
    if (!profile || profile.role !== 'master') {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }
    
    // 요청 데이터 파싱
    const body = await request.json();
    const { paymentIds } = body;
    
    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json({ error: '올바른 정산 ID를 제공해주세요.' }, { status: 400 });
    }
    
    // 정산 상태 업데이트
    const { data, error } = await supabase
      .from('slot_submissions')
      .update({
        payment_status: 'processing',
        updated_at: new Date().toISOString(),
      })
      .in('id', paymentIds)
      .eq('payment_status', 'pending');
    
    if (error) {
      return NextResponse.json({ error: '처리 대기 상태로 변경 실패', details: error }, { status: 500 });
    }
    
    return NextResponse.json({
      success: true,
      message: `${paymentIds.length}건이 처리 대기 상태로 변경되었습니다.`
    });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
} 