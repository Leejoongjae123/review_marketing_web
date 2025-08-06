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
    const search = url.searchParams.get('search') || '';
    const category = url.searchParams.get('category') || 'name';
    const status = url.searchParams.get('status') || 'all';
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');
    
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
    
    // 처리완료(completed) 또는 실패(failed) 데이터 조회 - review 테이블과 조인하여 플랫폼 정보 포함
    let processedQuery = supabase
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
        reason,
        reviews(
          platform,
          review_fee
        )
      `);
    
    // 상태 필터 적용
    if (status === 'completed') {
      processedQuery = processedQuery.eq('payment_status', 'completed');
    } else if (status === 'failed') {
      processedQuery = processedQuery.eq('payment_status', 'failed');
    } else {
      // 전체 조회 시 completed와 failed만 가져오기
      processedQuery = processedQuery.in('payment_status', ['completed', 'failed']);
    }
    
    // 날짜 범위 필터 적용
    if (startDate) {
      processedQuery = processedQuery.gte('submitted_at', startDate);
    }
    if (endDate) {
      // endDate는 해당 날짜의 끝까지 포함하도록 처리
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      processedQuery = processedQuery.lte('submitted_at', endDateTime.toISOString());
    }
    
    // 검색 조건 적용
    if (search) {
      if (category === 'name') {
        processedQuery = processedQuery.ilike('name', `%${search}%`);
      } else if (category === 'all') {
        processedQuery = processedQuery.or(`name.ilike.%${search}%`);
      }
    }
    
    const { data: allProcessedSubmissions, error: processedError } = await processedQuery
      .order('submitted_at', { ascending: false });
    
    if (processedError) {
      return NextResponse.json({ error: '처리완료 데이터 조회 실패', details: processedError }, { status: 500 });
    }

    // 디버깅을 위한 로그 (첫 번째 항목의 구조 확인)
    if (allProcessedSubmissions && allProcessedSubmissions.length > 0) {
      console.log('First submission structure:', JSON.stringify(allProcessedSubmissions[0], null, 2));
    }

    // 은행/계좌번호 검색을 위한 필터링
    let filteredProcessedSubmissions = allProcessedSubmissions || [];
    
    if (search && (category === 'bank' || category === 'accountNumber' || category === 'all')) {
      const processedUserIds = (allProcessedSubmissions || []).map(s => s.user_id).filter(Boolean);
      
      if (processedUserIds.length > 0) {
        const { data: processedProfilesForSearch } = await supabase
          .from('profiles')
          .select('id, bank_name, account_number')
          .in('id', processedUserIds);

        const processedProfilesMapForSearch = (processedProfilesForSearch || []).reduce((acc: {[key: string]: any}, profile) => {
          acc[profile.id] = profile;
          return acc;
        }, {});

        filteredProcessedSubmissions = (allProcessedSubmissions || []).filter(submission => {
          const profile = processedProfilesMapForSearch[submission.user_id] || {};
          
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

    const totalCount = filteredProcessedSubmissions.length;
    const start = (page - 1) * pageSize;
    const paginatedProcessedSubmissions = filteredProcessedSubmissions.slice(start, start + pageSize);

    // 사용자 ID 수집
    const userIds = (paginatedProcessedSubmissions || []).map(s => s.user_id).filter(Boolean);
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
      
      // 디버깅을 위한 로그
      console.log('Mapping submission:', {
        id: submission.id,
        name: submission.name,
        reviews: submission.reviews,
        platform: submission.reviews?.platform
      });
      
      return {
        id: submission.id,
        name: submission.name,
        phone: submission.phone,
        nickname: submission.nickname,
        user_bank_name: profile.bank_name,
        user_account_number: profile.account_number,
        platform: submission.reviews?.platform || '-',
        review_fee: submission.reviews?.review_fee || 0,
        payment_amount: submission.reviews?.review_fee || 0,
        payment_status: submission.payment_status,
        payment_created_at: submission.submitted_at,
        payment_processed_at: submission.payment_processed_at,
        payment_note: submission.payment_note,
        payment_method: submission.payment_method,
        reason: submission.reason,
        admin_id: submission.admin_id,
        // 호환성을 위한 필드들
        amount: submission.reviews?.review_fee || 0,
        status: submission.payment_status,
        createdAt: submission.submitted_at,
        updatedAt: submission.payment_processed_at || submission.updated_at,
        bank: profile.bank_name || '-',
        accountNumber: profile.account_number || '-',
      };
    };

    // 데이터 매핑
    const mappedProcessedData = (paginatedProcessedSubmissions || []).map(mapToPayment);
    
    // 총 페이지 수 계산
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return NextResponse.json({
      data: mappedProcessedData,
      page,
      pageSize,
      totalCount,
      totalPages
    });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
} 