import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { PaymentItem } from '@/app/admin/payment/types';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const pendingPage = parseInt(url.searchParams.get('pendingPage') || '1');
    const processingPage = parseInt(url.searchParams.get('processingPage') || '1');
    const processedPage = parseInt(url.searchParams.get('processedPage') || '1');
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
    
    // 각 상태별 총 항목 수 조회
    const { count: pendingCount } = await supabase
      .from('slot_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'pending');
    
    const { count: processingCount } = await supabase
      .from('slot_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'processing');
    
    const { count: processedCount } = await supabase
      .from('slot_submissions')
      .select('*', { count: 'exact', head: true })
      .in('payment_status', ['completed', 'failed']);
    
    // 페이지네이션 범위 계산
    const pendingStart = (pendingPage - 1) * pageSize;
    const processingStart = (processingPage - 1) * pageSize;
    const processedStart = (processedPage - 1) * pageSize;
    
    // 미정산(pending) 데이터 조회
    const { data: pendingSubmissions, error: pendingError } = await supabase
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
      .eq('payment_status', 'pending')
      .order('submitted_at', { ascending: false })
      .range(pendingStart, pendingStart + pageSize - 1);
    
    if (pendingError) {
      return NextResponse.json({ error: '미정산 데이터 조회 실패', details: pendingError }, { status: 500 });
    }

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
      .order('submitted_at', { ascending: false })
      .range(processingStart, processingStart + pageSize - 1);
    
    if (processingError) {
      return NextResponse.json({ error: '처리중 데이터 조회 실패', details: processingError }, { status: 500 });
    }
    
    // 처리완료(completed) 또는 실패(failed) 데이터 조회
    const { data: processedSubmissions, error: processedError } = await supabase
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
      .in('payment_status', ['completed', 'failed'])
      .order('payment_processed_at', { ascending: false })
      .range(processedStart, processedStart + pageSize - 1);
    
    if (processedError) {
      return NextResponse.json({ error: '처리완료 데이터 조회 실패', details: processedError }, { status: 500 });
    }

    // 모든 사용자 ID 수집
    const allUserIds = [
      ...(pendingSubmissions || []).map(s => s.user_id),
      ...(processingSubmissions || []).map(s => s.user_id),
      ...(processedSubmissions || []).map(s => s.user_id)
    ].filter(Boolean);

    // 고유 사용자 ID만 추출
    const uniqueUserIds = [...new Set(allUserIds)];

    // 한 번의 요청으로 모든 프로필 정보 조회
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, bank_name, account_number')
      .in('id', uniqueUserIds);

    // 프로필 정보를 ID로 매핑하여 빠르게 접근할 수 있도록 함
    const profilesMap = (profilesData || []).reduce((acc: {[key: string]: any}, profile) => {
      acc[profile.id] = profile;
      return acc;
    }, {});

    // PaymentItem 매핑 함수
    const mapToPaymentItem = (submission: any): PaymentItem => {
      const profile = profilesMap[submission.user_id] || {};
      
      return {
        id: submission.id,
        name: submission.name,
        bank: profile.bank_name || '-',
        accountNumber: profile.account_number || '-',
        amount: submission.payment_amount,
        status: submission.payment_status,
        createdAt: submission.submitted_at,
        updatedAt: submission.updated_at,
        reason: submission.reason,
      };
    };

    // 각 데이터 세트 매핑
    const mappedPendingData = (pendingSubmissions || []).map(mapToPaymentItem);
    const mappedProcessingData = (processingSubmissions || []).map(mapToPaymentItem);
    const mappedProcessedData = (processedSubmissions || []).map(mapToPaymentItem);
    
    // 총 페이지 수 계산
    const pendingTotalPages = Math.ceil((pendingCount || 0) / pageSize);
    const processingTotalPages = Math.ceil((processingCount || 0) / pageSize);
    const processedTotalPages = Math.ceil((processedCount || 0) / pageSize);
    
    return NextResponse.json({
      pending: {
        data: mappedPendingData,
        page: pendingPage,
        pageSize,
        totalCount: pendingCount || 0,
        totalPages: pendingTotalPages
      },
      processing: {
        data: mappedProcessingData,
        page: processingPage,
        pageSize,
        totalCount: processingCount || 0,
        totalPages: processingTotalPages
      },
      processed: {
        data: mappedProcessedData,
        page: processedPage,
        pageSize,
        totalCount: processedCount || 0,
        totalPages: processedTotalPages
      },
      totalCount: (pendingCount || 0) + (processingCount || 0) + (processedCount || 0)
    });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
} 