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
    
    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }
    
    // 기본 쿼리 설정 - 페이지네이션 없이 모든 데이터 조회
    let query = supabase
      .from('review_participants')
      .select(`
        *,
        reviews:review_id (
          id,
          title,
          platform,
          product_name,
          option_name,
          price,
          shipping_fee,
          seller,
          period,
          image_url,
          product_url
        )
      `)
      .eq('reviewer_id', user.id) // 현재 사용자 ID와 일치하는 항목만 가져오기
      .order('created_at', { ascending: false });
    
    // 검색어가 있는 경우 필터링 추가
    if (searchTerm && searchCategory) {
      if (searchCategory === 'event_account') {
        query = query.ilike('event_account', `%${searchTerm}%`);
      } else if (searchCategory === 'product_name') {
        query = query.ilike('reviews.product_name', `%${searchTerm}%`);
      } else if (searchCategory === 'platform') {
        query = query.ilike('reviews.platform', `%${searchTerm}%`);
      }
    }
    
    // 쿼리 실행 및 데이터 가져오기
    const { data: participants, error } = await query;
    
    if (error) {
      console.log('Error fetching participants for download:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ participants: participants || [] });
  } catch (error) {
    console.log('Server error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
} 