import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PaymentUpdateRequest } from '@/app/admin/payment/types';

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body: PaymentUpdateRequest = await request.json();
    
    const { paymentIds, status, note, amount } = body;
    
    if (!paymentIds || paymentIds.length === 0) {
      return NextResponse.json(
        { error: '처리할 정산 항목을 선택해주세요' },
        { status: 400 }
      );
    }
    
    if (!['completed', 'failed'].includes(status)) {
      return NextResponse.json(
        { error: '유효하지 않은 상태값입니다' },
        { status: 400 }
      );
    }
    
    // 현재 사용자 정보 가져오기 (관리자 확인)
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user.user) {
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
    const updateData: any = {
      payment_status: status,
      payment_processed_at: new Date().toISOString(),
      admin_id: user.user.id,
      updated_at: new Date().toISOString()
    };
    
    if (note) {
      updateData.payment_note = note;
    }
    
    if (amount && status === 'completed') {
      updateData.payment_amount = amount;
    }
    
    const { data, error } = await supabase
      .from('slot_submissions')
      .update(updateData)
      .in('id', paymentIds)
      .select('id, name, payment_status');
    
    if (error) {
      return NextResponse.json(
        { error: '정산 처리 중 오류가 발생했습니다', details: error },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      message: `${paymentIds.length}건의 정산이 ${status === 'completed' ? '완료' : '실패'} 처리되었습니다`,
      data: data
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 