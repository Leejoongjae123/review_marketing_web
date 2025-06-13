import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { paymentIds, status, paymentsWithReasons } = await request.json();

    if (!paymentIds || !Array.isArray(paymentIds) || paymentIds.length === 0) {
      return NextResponse.json(
        { error: '처리할 정산 ID가 필요합니다' },
        { status: 400 }
      );
    }

    if (!['completed', 'failed', 'rejected'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다' },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 가져오기
    const { data: userData } = await supabase.auth.getUser();
    
    if (!userData?.user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }
    
    // 사용자 프로필 조회하여 관리자 확인
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userData.user.id)
      .single();
    
    if (!profile || profile.role !== 'master') {
      return NextResponse.json({ error: '접근 권한이 없습니다.' }, { status: 403 });
    }

    // 정산 상태 업데이트 (각 항목별로 개별 처리하여 사유 포함)
    const results = [];
    for (const paymentId of paymentIds) {
      const paymentWithReason = paymentsWithReasons?.find((p: any) => p.id === paymentId);
      const reason = paymentWithReason?.reason || null;
      
      const { data, error } = await supabase
        .from('slot_submissions')
        .update({
          payment_status: status,
          payment_processed_at: new Date().toISOString(),
          admin_id: userData.user.id,
          reason: reason,
        })
        .eq('id', paymentId)
        .select();

      if (error) {
        return NextResponse.json(
          { error: '정산 상태 업데이트 실패', details: error },
          { status: 500 }
        );
      }
      
      results.push(...(data || []));
    }

    return NextResponse.json({
      message: '정산 상태가 성공적으로 업데이트되었습니다',
      data: results
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 