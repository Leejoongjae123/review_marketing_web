import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { PaymentItem } from '@/app/admin/payment/types';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || 'name';
    
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
    
    // 미정산 데이터 조회 (검색 조건 포함)
    let pendingQuery = supabase
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
      .eq('payment_status', 'pending');

    // 검색 조건 적용
    if (search) {
      if (category === 'name') {
        pendingQuery = pendingQuery.ilike('name', `%${search}%`);
      } else if (category === 'all') {
        pendingQuery = pendingQuery.or(`name.ilike.%${search}%`);
      }
    }

    const { data: allPendingSubmissions, error: pendingError } = await pendingQuery
      .order('submitted_at', { ascending: false });
    
    if (pendingError) {
      return NextResponse.json({ error: '미정산 데이터 조회 실패', details: pendingError }, { status: 500 });
    }

    // 은행/계좌번호 검색을 위해 프로필 정보 조회
    let filteredPendingSubmissions = allPendingSubmissions || [];
    
    if (search && (category === 'bank' || category === 'accountNumber' || category === 'all')) {
      const userIds = (allPendingSubmissions || []).map(s => s.user_id).filter(Boolean);
      
      if (userIds.length > 0) {
        const { data: profilesForSearch } = await supabase
          .from('profiles')
          .select('id, bank_name, account_number')
          .in('id', userIds);

        const profilesMapForSearch = (profilesForSearch || []).reduce((acc: {[key: string]: any}, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        filteredPendingSubmissions = (allPendingSubmissions || []).filter(submission => {
          const profile = profilesMapForSearch[submission.user_id] || {};
          
          if (category === 'bank') {
            return profile.bank_name && profile.bank_name.toLowerCase().includes(search.toLowerCase());
          } else if (category === 'accountNumber') {
            return profile.account_number && profile.account_number.includes(search);
          } else if (category === 'all') {
            return submission.name.toLowerCase().includes(search.toLowerCase()) ||
                   (profile.bank_name && profile.bank_name.toLowerCase().includes(search.toLowerCase())) ||
                   (profile.account_number && profile.account_number.includes(search));
          }
          return true;
        });
      }
    }

    const totalCount = filteredPendingSubmissions.length;
    const start = (page - 1) * pageSize;
    const paginatedSubmissions = filteredPendingSubmissions.slice(start, start + pageSize);
    
    // 사용자 ID 수집
    const userIds = (paginatedSubmissions || []).map(s => s.user_id).filter(Boolean);
    const uniqueUserIds = [...new Set(userIds)];

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

    // 데이터 매핑
    const mappedData = (paginatedSubmissions || []).map(mapToPaymentItem);
    
    // 총 페이지 수 계산
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return NextResponse.json({
      data: mappedData,
      page,
      pageSize,
      totalCount,
      totalPages
    });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
} 