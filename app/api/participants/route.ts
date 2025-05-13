import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // 검색어와 카테고리 파라미터 가져오기
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchCategory = searchParams.get('searchCategory') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    // 페이지네이션 계산
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 기본 쿼리 설정
    let query = supabase
      .from('review_participants')
      .select('*, review_id(*)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to)
      .not('review_id', 'is', null);
    
    // 검색어가 있는 경우 필터링 추가
    if (searchTerm && searchCategory) {
      if (searchCategory === 'event_account') {
        query = query.ilike('event_account', `%${searchTerm}%`);
      } else if (searchCategory === 'product_name') {
        // 외래 키 관계의 product_name 필드 검색
        const reviewsWithProduct = await supabase
          .from('reviews')
          .select('id')
          .ilike('product_name', `%${searchTerm}%`);
          
        if (reviewsWithProduct.error) {
          throw reviewsWithProduct.error;
        }
        
        const reviewIds = reviewsWithProduct.data.map(review => review.id);
        if (reviewIds.length > 0) {
          query = query.in('review_id', reviewIds);
        } else {
          // 검색 결과가 없는 경우 빈 결과 반환
          return NextResponse.json({ 
            participants: [], 
            totalCount: 0,
            page,
            pageSize,
            totalPages: 0
          });
        }
      } else if (searchCategory === 'platform') {
        // 외래 키 관계의 platform 필드 검색
        const reviewsWithPlatform = await supabase
          .from('reviews')
          .select('id')
          .ilike('platform', `%${searchTerm}%`);
          
        if (reviewsWithPlatform.error) {
          throw reviewsWithPlatform.error;
        }
        
        const reviewIds = reviewsWithPlatform.data.map(review => review.id);
        if (reviewIds.length > 0) {
          query = query.in('review_id', reviewIds);
        } else {
          // 검색 결과가 없는 경우 빈 결과 반환
          return NextResponse.json({ 
            participants: [], 
            totalCount: 0,
            page,
            pageSize,
            totalPages: 0
          });
        }
      }
    }
    
    // 쿼리 실행 및 데이터 가져오기
    const { data: participants, error, count } = await query;
    
    if (error) {
      console.log('Error fetching participants:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    // count가 정의되지 않은 경우 0으로 설정
    const totalCount = count || 0;
    
    return NextResponse.json({ 
      participants, 
      totalCount,
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize)
    });
  } catch (error) {
    console.log('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 