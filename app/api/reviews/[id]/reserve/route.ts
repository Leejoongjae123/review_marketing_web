import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { updateDailySlotsToAvailable, checkAndCreateDailyQuota } from "@/utils/slotManager";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviewId = id;
  
  try {
    const supabase = await createClient();
    
    // 현재 로그인한 사용자 정보 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // 오늘 날짜 기준으로 슬롯 상태 자동 관리
    const today = new Date().toISOString().split('T')[0];
    await checkAndCreateDailyQuota(reviewId, today);
    await updateDailySlotsToAvailable(reviewId, today);
    
    // 요청 본문에서 slotId 추출
    const { slotId } = await request.json();
    
    if (!slotId) {
      return NextResponse.json(
        { error: "슬롯 ID가 필요합니다." },
        { status: 400 }
      );
    }
    
    // 해당 슬롯이 존재하는지, 이미 예약되지 않았는지 확인
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .eq("review_id", reviewId)
      .single();
    
    if (slotError) {
      return NextResponse.json(
        { error: "슬롯을 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    if (slot.reservation_user_id) {
      return NextResponse.json(
        { error: "이미 예약된 슬롯입니다." },
        { status: 400 }
      );
    }

    // 슬롯이 예약 가능한 상태인지 확인
    if (slot.status !== 'available') {
      return NextResponse.json(
        { error: "예약할 수 없는 슬롯입니다." },
        { status: 400 }
      );
    }

    // 오늘 날짜 확인 및 일별 할당량 체크
    const { data: dailyQuota, error: quotaError } = await supabase
      .from("slot_daily_quotas")
      .select("*")
      .eq("review_id", reviewId)
      .eq("date", today)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
      return NextResponse.json(
        { error: "일별 할당량 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 일별 할당량이 없으면 리뷰 정보에서 생성
    if (!dailyQuota) {
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("daily_count")
        .eq("id", reviewId)
        .single();

      if (reviewError || !reviewData) {
        return NextResponse.json(
          { error: "리뷰 정보를 찾을 수 없습니다." },
          { status: 404 }
        );
      }

      // 일별 할당량 생성
      const { data: newQuota, error: createError } = await supabase
        .from("slot_daily_quotas")
        .insert({
          review_id: reviewId,
          date: today,
          available_slots: reviewData.daily_count || 0,
          reserved_slots: 0
        })
        .select()
        .single();

      if (createError) {
        return NextResponse.json(
          { error: "일별 할당량 생성 중 오류가 발생했습니다." },
          { status: 500 }
        );
      }
    }

    // 오늘 이미 할당된 슬롯 수 확인 (reserved + complete)
    const { data: todayAllocated, error: allocatedError } = await supabase
      .from("slots")
      .select("id")
      .eq("review_id", reviewId)
      .eq("opened_date", today)
      .in("status", ["reserved", "complete"]);

    if (allocatedError) {
      return NextResponse.json(
        { error: "슬롯 할당 현황 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const todayAllocatedCount = todayAllocated?.length || 0;
    
    // 리뷰의 daily_count 가져오기
    const { data: reviewData, error: reviewDataError } = await supabase
      .from("reviews")
      .select("daily_count")
      .eq("id", reviewId)
      .single();

    if (reviewDataError || !reviewData) {
      return NextResponse.json(
        { error: "리뷰 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const dailyLimit = reviewData.daily_count || 0;

    if (todayAllocatedCount >= dailyLimit) {
      return NextResponse.json(
        { error: "오늘의 예약 가능한 슬롯이 모두 찼습니다." },
        { status: 400 }
      );
    }
    
    // 슬롯 예약 처리
    const { data: updateData, error: updateError } = await supabase
      .from("slots")
      .update({
        reservation_user_id: userId,
        status: "reserved",
        reservation_updated_at: new Date().toISOString()
      })
      .eq("id", slotId)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { error: "슬롯 예약 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 일별 할당량의 예약된 슬롯 수 증가
    const { error: quotaUpdateError } = await supabase
      .from("slot_daily_quotas")
      .update({
        reserved_slots: todayAllocatedCount + 1,
        updated_at: new Date().toISOString()
      })
      .eq("review_id", reviewId)
      .eq("date", today);

    if (quotaUpdateError) {
      // 할당량 업데이트 실패는 로그만 남기고 진행 (예약은 이미 완료됨)
      console.error("일별 할당량 업데이트 실패:", quotaUpdateError);
    }
    
    return NextResponse.json({
      success: true,
      message: "슬롯이 성공적으로 예약되었습니다.",
      data: updateData
    });
    
  } catch (error) {
    console.error("슬롯 예약 중 오류:", error);
    return NextResponse.json(
      { error: "슬롯 예약 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 