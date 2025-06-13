import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { Payment } from '@/app/admin/payment/types';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    
    // URL에서 쿼리 파라미터 추출
    const url = new URL(request.url);
    const pendingPage = parseInt(url.searchParams.get('pendingPage') || '1');
    const processingPage = parseInt(url.searchParams.get('processingPage') || '1');
    const processedPage = parseInt(url.searchParams.get('processedPage') || '1');
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10');
    
    // 검색 및 필터 파라미터 추출
    const pendingSearch = url.searchParams.get('pendingSearch') || '';
    const pendingCategory = url.searchParams.get('pendingCategory') || 'name';
    const processedSearch = url.searchParams.get('processedSearch') || '';
    const processedCategory = url.searchParams.get('processedCategory') || 'name';
    const processedStatus = url.searchParams.get('processedStatus') || 'all';
    
    console.log('API 파라미터 디버깅:', {
      processedStatus,
      processedSearch,
      processedCategory
    });
    
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
        payment_created_at,
        submitted_at,
        updated_at,
        approval,
        reason,
        admin_id
      `)
      .eq('payment_status', 'pending');

    // 미정산 검색 조건 적용
    if (pendingSearch) {
      if (pendingCategory === 'name') {
        pendingQuery = pendingQuery.ilike('name', `%${pendingSearch}%`);
      } else if (pendingCategory === 'all') {
        pendingQuery = pendingQuery.or(`name.ilike.%${pendingSearch}%`);
      }
    }

    const { data: allPendingSubmissions, error: pendingError } = await pendingQuery
      .order('payment_created_at', { ascending: false });
    
    if (pendingError) {
      return NextResponse.json({ error: '미정산 데이터 조회 실패', details: pendingError }, { status: 500 });
    }

    // 은행/계좌번호 검색을 위해 프로필 정보 조회
    let filteredPendingSubmissions = allPendingSubmissions || [];
    
    if (pendingSearch && (pendingCategory === 'bank' || pendingCategory === 'accountNumber' || pendingCategory === 'all')) {
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
          
          if (pendingCategory === 'bank') {
            return profile.bank_name && profile.bank_name.toLowerCase().includes(pendingSearch.toLowerCase());
          } else if (pendingCategory === 'accountNumber') {
            return profile.account_number && profile.account_number.includes(pendingSearch);
          } else if (pendingCategory === 'all') {
            return submission.name.toLowerCase().includes(pendingSearch.toLowerCase()) ||
                   (profile.bank_name && profile.bank_name.toLowerCase().includes(pendingSearch.toLowerCase())) ||
                   (profile.account_number && profile.account_number.includes(pendingSearch));
          }
          return true;
        });
      }
    }

    const pendingCount = filteredPendingSubmissions.length;
    const pendingStart = (pendingPage - 1) * pageSize;
    const paginatedPendingSubmissions = filteredPendingSubmissions.slice(pendingStart, pendingStart + pageSize);
    
    const { count: processingCount } = await supabase
      .from('slot_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('payment_status', 'processing');
    
    // 처리된 결제 카운트 쿼리 (상태 필터 적용)
    let processedCountQuery = supabase
      .from('slot_submissions')
      .select('*', { count: 'exact', head: true });
    
    if (processedStatus === 'completed') {
      processedCountQuery = processedCountQuery.eq('payment_status', 'completed');
    } else if (processedStatus === 'rejected' || processedStatus === 'failed') {
      processedCountQuery = processedCountQuery.in('payment_status', ['failed', 'rejected']);
    } else {
      processedCountQuery = processedCountQuery.in('payment_status', ['completed', 'failed', 'rejected']);
    }
    
    // 처리된 결제 검색 조건 적용 (카운트용)
    if (processedSearch && processedCategory !== 'bank' && processedCategory !== 'accountNumber') {
      if (processedCategory === 'name') {
        processedCountQuery = processedCountQuery.ilike('name', `%${processedSearch}%`);
      } else if (processedCategory === 'all') {
        processedCountQuery = processedCountQuery.or(`name.ilike.%${processedSearch}%`);
      }
    }
    
    const { count: processedCount } = await processedCountQuery;
    
    // 페이지네이션 범위 계산
    const processingStart = (processingPage - 1) * pageSize;
    const processedStart = (processedPage - 1) * pageSize;
    


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
        payment_created_at,
        submitted_at,
        updated_at,
        approval,
        reason,
        admin_id
      `)
      .eq('payment_status', 'processing')
      .order('payment_created_at', { ascending: false })
      .range(processingStart, processingStart + pageSize - 1);
    
    if (processingError) {
      return NextResponse.json({ error: '처리중 데이터 조회 실패', details: processingError }, { status: 500 });
    }
    
    // 처리완료(completed) 또는 실패(failed) 데이터 조회
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
        payment_created_at,
        submitted_at,
        updated_at,
        approval,
        reason,
        admin_id
      `);
    
    // 상태 필터 적용
    if (processedStatus === 'completed') {
      processedQuery = processedQuery.eq('payment_status', 'completed');
    } else if (processedStatus === 'failed') {
      processedQuery = processedQuery.eq('payment_status', 'failed');
    } else {
      // 전체 조회 시 completed와 failed만 가져오기
      processedQuery = processedQuery.in('payment_status', ['completed', 'failed']);
    }
    
    // 처리된 결제 검색 조건 적용
    if (processedSearch) {
      if (processedCategory === 'name') {
        processedQuery = processedQuery.ilike('name', `%${processedSearch}%`);
      } else if (processedCategory === 'all') {
        processedQuery = processedQuery.or(`name.ilike.%${processedSearch}%`);
      }
    }
    
    const { data: allProcessedSubmissions, error: processedError } = await processedQuery
      .order('payment_created_at', { ascending: false });
    
    if (processedError) {
      return NextResponse.json({ error: '처리완료 데이터 조회 실패', details: processedError }, { status: 500 });
    }

    // 처리된 결제에서 은행/계좌번호 검색을 위한 필터링
    let filteredProcessedSubmissions = allProcessedSubmissions || [];
    
    if (processedSearch && (processedCategory === 'bank' || processedCategory === 'accountNumber' || processedCategory === 'all')) {
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
          
          if (processedCategory === 'bank') {
            return profile.bank_name && profile.bank_name.toLowerCase().includes(processedSearch.toLowerCase());
          } else if (processedCategory === 'accountNumber') {
            return profile.account_number && profile.account_number.includes(processedSearch);
          } else if (processedCategory === 'all') {
            return submission.name.toLowerCase().includes(processedSearch.toLowerCase()) ||
                   (profile.bank_name && profile.bank_name.toLowerCase().includes(processedSearch.toLowerCase())) ||
                   (profile.account_number && profile.account_number.includes(processedSearch));
          }
          return true;
        });
      }
    }

    const actualProcessedCount = filteredProcessedSubmissions.length;
    const paginatedProcessedSubmissions = filteredProcessedSubmissions.slice(processedStart, processedStart + pageSize);

    // 모든 사용자 ID 수집
    const allUserIds = [
      ...(paginatedPendingSubmissions || []).map(s => s.user_id),
      ...(processingSubmissions || []).map(s => s.user_id),
      ...(paginatedProcessedSubmissions || []).map(s => s.user_id)
    ].filter(Boolean);

    // 고유 사용자 ID만 추출
    const uniqueUserIds = Array.from(new Set(allUserIds));

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
        payment_created_at: submission.payment_created_at || submission.submitted_at,
        payment_processed_at: submission.payment_processed_at,
        payment_note: submission.payment_note,
        payment_method: submission.payment_method,
        reason: submission.reason,
        admin_id: submission.admin_id,
        // 호환성을 위한 필드들
        amount: submission.payment_amount,
        status: submission.payment_status,
        createdAt: submission.payment_created_at || submission.submitted_at,
        updatedAt: submission.updated_at,
        bank: profile.bank_name || '-',
        accountNumber: profile.account_number || '-',
      };
    };

    // 각 데이터 세트 매핑
    const mappedPendingData = (paginatedPendingSubmissions || []).map(mapToPayment);
    const mappedProcessingData = (processingSubmissions || []).map(mapToPayment);
    const mappedProcessedData = (paginatedProcessedSubmissions || []).map(mapToPayment);
    
    // 총 페이지 수 계산
    const pendingTotalPages = Math.ceil((pendingCount || 0) / pageSize);
    const processingTotalPages = Math.ceil((processingCount || 0) / pageSize);
    const processedTotalPages = Math.ceil((actualProcessedCount || 0) / pageSize);
    
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
        totalCount: actualProcessedCount || 0,
        totalPages: processedTotalPages
      },
      totalCount: (pendingCount || 0) + (processingCount || 0) + (actualProcessedCount || 0)
    });
    
  } catch (error) {
    return NextResponse.json({ error: '서버 오류 발생' }, { status: 500 });
  }
} 