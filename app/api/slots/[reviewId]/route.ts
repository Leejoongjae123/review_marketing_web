import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 특정 리뷰의 슬롯 현황 조회
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const supabase = await createClient();

    // URL 파라미터에서 날짜 추출 (옵션)
    const { searchParams } = new URL(request.url);
    const targetDate = searchParams.get('date') || new Date().toISOString().split('T')[0];

    // 리뷰 정보 조회 (일건수 포함)
    const { data: review, error: reviewError } = await supabase
      .from('reviews')
      .select('id, daily_count, start_date, end_date, platform, product_name, store_name')
      .eq('id', reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: '리뷰를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 리뷰 기간 확인
    const startDate = new Date(review.start_date);
    const endDate = new Date(review.end_date);
    const currentDate = new Date(targetDate);

    if (currentDate < startDate || currentDate > endDate) {
      return NextResponse.json(
        { error: '예약 가능한 기간이 아닙니다.' },
        { status: 400 }
      );
    }

    // 해당 날짜의 기존 슬롯 조회
    const { data: existingSlots, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .eq('review_id', reviewId)
      .eq('reservation_date', targetDate)
      .order('slot_number');

    if (slotsError) {
      return NextResponse.json(
        { error: '슬롯 정보를 불러오는데 실패했습니다.' },
        { status: 500 }
      );
    }

    // 일건수만큼 슬롯 생성 (없는 경우)
    const dailyCount = review.daily_count || 0;
    const slots = [];

    for (let i = 1; i <= dailyCount; i++) {
      const existingSlot = existingSlots?.find(slot => slot.slot_number === i);
      
      if (existingSlot) {
        slots.push({
          ...existingSlot,
          status: existingSlot.reservation_user_id ? 'reserved' : 'available'
        });
      } else {
        // 새 슬롯 생성
        const { data: newSlot, error: createError } = await supabase
          .from('slots')
          .insert({
            review_id: reviewId,
            slot_number: i,
            reservation_date: targetDate,
            status: 'available'
          })
          .select()
          .single();

        if (!createError && newSlot) {
          slots.push({
            ...newSlot,
            status: 'available'
          });
        }
      }
    }

    // 예약 가능한 슬롯 수 계산
    const availableCount = slots.filter(slot => slot.status === 'available').length;
    const reservedCount = slots.filter(slot => slot.status === 'reserved').length;

    return NextResponse.json({
      review: {
        id: review.id,
        platform: review.platform,
        name: review.platform === '쿠팡' || review.platform === '스토어' 
          ? review.product_name 
          : review.store_name,
        daily_count: dailyCount,
        start_date: review.start_date,
        end_date: review.end_date
      },
      slots,
      summary: {
        total: dailyCount,
        available: availableCount,
        reserved: reservedCount,
        date: targetDate
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 예약
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const supabase = await createClient();
    
    const body = await request.json();
    const { slotId, userId, reservationDate } = body;

    if (!slotId || !userId || !reservationDate) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 슬롯 존재 및 예약 가능 여부 확인
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('*')
      .eq('id', slotId)
      .eq('review_id', reviewId)
      .eq('reservation_date', reservationDate)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: '슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (slot.reservation_user_id) {
      return NextResponse.json(
        { error: '이미 예약된 슬롯입니다.' },
        { status: 409 }
      );
    }

    // 해당 날짜에 이미 예약한 슬롯이 있는지 확인
    const { data: userSlots } = await supabase
      .from('slots')
      .select('id')
      .eq('review_id', reviewId)
      .eq('reservation_date', reservationDate)
      .eq('reservation_user_id', userId);

    if (userSlots && userSlots.length > 0) {
      return NextResponse.json(
        { error: '이미 해당 날짜에 예약한 슬롯이 있습니다.' },
        { status: 409 }
      );
    }

    // 슬롯 예약 처리
    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update({
        reservation_user_id: userId,
        reservation_updated_at: new Date().toISOString(),
        status: 'reserved'
      })
      .eq('id', slotId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: '예약 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '예약이 완료되었습니다.',
      slot: updatedSlot
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 슬롯 예약 취소
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ reviewId: string }> }
) {
  try {
    const { reviewId } = await context.params;
    const supabase = await createClient();
    
    const { searchParams } = new URL(request.url);
    const slotId = searchParams.get('slotId');
    const userId = searchParams.get('userId');

    if (!slotId || !userId) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 사용자 인증 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }

    // 슬롯 확인
    const { data: slot, error: slotError } = await supabase
      .from('slots')
      .select('*')
      .eq('id', slotId)
      .eq('review_id', reviewId)
      .eq('reservation_user_id', userId)
      .single();

    if (slotError || !slot) {
      return NextResponse.json(
        { error: '예약한 슬롯을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 예약 취소 처리
    const { data: updatedSlot, error: updateError } = await supabase
      .from('slots')
      .update({
        reservation_user_id: null,
        reservation_updated_at: new Date().toISOString(),
        status: 'available'
      })
      .eq('id', slotId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json(
        { error: '예약 취소 처리 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '예약이 취소되었습니다.',
      slot: updatedSlot
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 