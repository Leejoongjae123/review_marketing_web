import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 매일 슬롯 리셋/생성 API (크론잡이나 스케줄러에서 호출)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // 현재 활성화된 리뷰들을 조회 (리뷰 기간 내)
    const { data: activeReviews, error: reviewsError } = await supabase
      .from('reviews')
      .select('id, daily_count, start_date, end_date')
      .lte('start_date', today)
      .gte('end_date', today)
      .not('daily_count', 'is', null)
      .gt('daily_count', 0);

    if (reviewsError) {
      return NextResponse.json(
        { error: '활성 리뷰를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    let createdSlots = 0;

    for (const review of activeReviews || []) {
      // 오늘 날짜의 슬롯이 이미 있는지 확인
      const { data: existingSlots } = await supabase
        .from('slots')
        .select('slot_number')
        .eq('review_id', review.id)
        .eq('reservation_date', today);

      const existingSlotNumbers = existingSlots?.map(slot => slot.slot_number) || [];
      const dailyCount = review.daily_count;

      // 부족한 슬롯들을 생성
      for (let i = 1; i <= dailyCount; i++) {
        if (!existingSlotNumbers.includes(i)) {
          const { error: insertError } = await supabase
            .from('slots')
            .insert({
              review_id: review.id,
              slot_number: i,
              reservation_date: today,
              status: 'available'
            });

          if (!insertError) {
            createdSlots++;
          }
        }
      }
    }

    return NextResponse.json({
      message: `${createdSlots}개의 새로운 슬롯이 생성되었습니다.`,
      date: today,
      activeReviews: activeReviews?.length || 0,
      createdSlots
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 특정 날짜의 슬롯 현황 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || new Date().toISOString().split('T')[0];
    
    const supabase = await createClient();

    // 해당 날짜의 모든 슬롯 현황 조회
    const { data: slotSummary, error } = await supabase
      .from('slots')
      .select(`
        review_id,
        status,
        reservation_user_id,
        reviews!inner(platform, product_name, store_name, daily_count)
      `)
      .eq('reservation_date', date);

    if (error) {
      return NextResponse.json(
        { error: '슬롯 현황을 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 리뷰별로 슬롯 현황 집계
    const reviewStats = new Map();

    slotSummary?.forEach(slot => {
      const reviewId = slot.review_id;
      if (!reviewStats.has(reviewId)) {
        reviewStats.set(reviewId, {
          review_id: reviewId,
          platform: slot.reviews.platform,
          name: slot.reviews.platform === '쿠팡' || slot.reviews.platform === '스토어' 
            ? slot.reviews.product_name 
            : slot.reviews.store_name,
          daily_count: slot.reviews.daily_count,
          total: 0,
          available: 0,
          reserved: 0
        });
      }

      const stats = reviewStats.get(reviewId);
      stats.total++;
      
      if (slot.status === 'available') {
        stats.available++;
      } else if (slot.status === 'reserved') {
        stats.reserved++;
      }
    });

    return NextResponse.json({
      date,
      reviews: Array.from(reviewStats.values()),
      totalSlots: slotSummary?.length || 0
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 