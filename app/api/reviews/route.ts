import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchCategory = searchParams.get('searchCategory') || '';
  const searchTerm = searchParams.get('searchTerm') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' });

    // 검색어 필터링
    if (searchTerm) {
      query = query.ilike(searchCategory, `%${searchTerm}%`);
    }

    // 날짜 필터링
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    // 페이지네이션
    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data: reviews, count, error } = await query;

    if (error) {
      throw error;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      reviews,
      totalCount,
      totalPages,
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: '리뷰를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
} 