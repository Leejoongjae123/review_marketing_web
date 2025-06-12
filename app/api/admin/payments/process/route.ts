import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { paymentIds, status } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: '처리할 정산 ID가 필요합니다' },
        { status: 400 }
      );
    }

    if (!['completed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 가져오기
    const { data: user } = await supabase.auth.getUser();
    
    if (!user?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
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

    // 정산 상태 업데이트
    const { data, error } = await supabase
      .from('slot_submissions')
      .update({
        payment_status: status,
        payment_processed_at: new Date().toISOString(),
        admin_id: user.user.id,
      })
      .in('id', paymentIds)
      .eq('payment_status', 'processing') // 처리 중 상태인 것만 업데이트
      .select();

    if (error) {
      return NextResponse.json(
        { error: '정산 처리 업데이트 실패', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updatedCount: data?.length || 0,
      message: `${data?.length || 0}건의 정산이 ${status === 'completed' ? '완료' : '거부'}되었습니다`,
    });

  } catch (error) {
    return NextResponse.json(
      { error: '정산 처리 실패' },
      { status: 500 }
    );
  }
} 