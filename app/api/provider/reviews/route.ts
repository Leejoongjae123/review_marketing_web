import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server'; // 서버용 Supabase 클라이언트
import { Review } from '@/types'; // Review 타입 import

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { searchParams } = new URL(request.url);

  const searchCategory = searchParams.get('searchCategory') || 'product_name';
  const searchTerm = searchParams.get('searchTerm') || '';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const page = parseInt(searchParams.get('page') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  const offset = (page - 1) * pageSize;

  try {
    let query = supabase
      .from('reviews') // 'reviews' 테이블을 가정합니다. 실제 테이블명으로 변경 필요
      .select('*', { count: 'exact' });

    // 검색어 필터링
    if (searchTerm) {
      if (searchCategory === 'title') {
        query = query.ilike('title', `%${searchTerm}%`);
      } else if (searchCategory === 'product_name') {
        query = query.ilike('product_name', `%${searchTerm}%`);
      } else if (searchCategory === 'author_name') {
        query = query.ilike('author_name', `%${searchTerm}%`);
      } else if (searchCategory === 'content') {
        query = query.ilike('content', `%${searchTerm}%`);
      } else if (searchCategory === 'platform') {
        query = query.ilike('platform', `%${searchTerm}%`);
      } else if (searchCategory === 'seller') {
        query = query.ilike('seller', `%${searchTerm}%`);
      }
    }

    // 날짜 필터링 (created_at 컬럼을 기준으로 가정)
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      // endDate는 해당 날짜의 마지막 시간까지 포함하도록 설정
      const endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999);
      query = query.lte('created_at', endDateObj.toISOString());
    }
    
    // TODO: 광고주(provider)와 관련된 리뷰만 필터링하는 로직 추가 필요
    // 예: 현재 로그인한 광고주의 ID를 가져와서 해당 광고주의 리뷰만 필터링
    // const { data: { user } } = await supabase.auth.getUser();
    // if (user && user.id) { // user.id가 provider_id라고 가정
    //   query = query.eq('provider_id', user.id); 
    // } else {
    //   // 사용자가 없거나 provider_id가 없는 경우 빈 결과를 반환하거나 에러 처리
    //   return NextResponse.json({ reviews: [], totalCount: 0, totalPages: 0 }, { status: 401 });
    // }


    // 페이지네이션
    query = query.range(offset, offset + pageSize - 1);

    // 데이터 정렬 (최신순)
    query = query.order('created_at', { ascending: false });

    const { data: reviews, error, count } = await query;

    if (error) {
      return NextResponse.json({ message: '데이터를 불러오는데 실패했습니다.', error: error.message }, { status: 500 });
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({ reviews, totalCount, totalPages });

  } catch (error) {
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: '서버 오류가 발생했습니다.', error: errorMessage }, { status: 500 });
  }
} 