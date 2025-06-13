import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Payment } from '@/app/admin/payment/types';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
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
    
    // 전체 카운트 조회
    const { count: totalCount } = await supabase
      .from('slot_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'processing');
    
    // 페이지네이션 범위 계산
    const start = (page - 1) * pageSize;
    
    // 처리중(processing) 데이터 조회
    const { data: processingSubmissions, error: processingError } = await supabase
      .from('slot_submissions')
      .select(`
        id,
        slot_id,
        review_id,
        user_id,
        name,
        phone,
        nickname,
        payment_status,
        payment_amount,
        payment_method,
        payment_note,
        payment_processed_at,
        submitted_at,
        updated_at,
        approval,
        reason
      `)
      .eq('payment_status', 'processing')
      .order('payment_created_at', { ascending: false })
      .range(start, start + pageSize - 1);
    
    if (processingError) {
      return NextResponse.json({ error: '처리중 데이터 조회 실패', details: processingError }, { status: 500 });
    }
    
    // 사용자 ID 수집
    const userIds = (processingSubmissions || []).map(s => s.user_id).filter(Boolean);
    const uniqueUserIds = Array.from(new Set(userIds));

    // 프로필 정보 조회
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, bank_name, account_number')
      .in('id', uniqueUserIds);

    // 프로필 정보를 ID로 매핑
    const profilesMap = (profilesData || []).reduce((acc: {[key: string]: any}, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {});

    // Payment 매핑 함수
    const mapToPayment = (submission: any): Payment => {
      const profile = profilesMap[submission.user_id] || {};
      
      return {
        id: submission.id,
        name: submission.name,
        phone: submission.phone,
        nickname: submission.nickname,
        user_bank_name: profile.bank_name,
        user_account_number: profile.account_number,
        payment_amount: submission.payment_amount,
        payment_status: submission.payment_status,
        payment_created_at: submission.submitted_at,
        payment_processed_at: submission.payment_processed_at,
        payment_note: submission.payment_note,
        payment_method: submission.payment_method,
        reason: submission.reason,
        admin_id: submission.admin_id,
        // 호환성을 위한 필드들
        amount: submission.payment_amount,
        status: submission.payment_status,
        createdAt: submission.submitted_at,
        updatedAt: submission.updated_at,
        bank: profile.bank_name || '-',
        accountNumber: profile.account_number || '-',
      };
    };

    // 데이터 매핑
    const mappedData = (processingSubmissions || []).map(mapToPayment);
    
    // 총 페이지 수 계산
    const totalPages = Math.ceil((totalCount || 0) / pageSize);
    
    return NextResponse.json({
      data: mappedData,
      page,
      pageSize,
      totalCount: totalCount || 0,
      totalPages
    });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
} 