import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// 한국시간 기준 날짜 계산 함수
function getKoreanDate(): string {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
  return koreanTime.toISOString().split('T')[0];
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 한국시간 기준 현재 날짜
    const today = getKoreanDate();

    // 해당 리뷰의 daily_count 조회
    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .select("daily_count, start_date, end_date, status")
      .eq("id", id)
      .single();

    if (reviewError || !reviewData) {
      return NextResponse.json(
        { error: "리뷰를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 승인된 리뷰만 처리
    if (reviewData.status !== "approved") {
      return NextResponse.json(
        { error: "승인된 리뷰만 처리할 수 있습니다." },
        { status: 400 }
      );
    }

    // 오늘의 슬롯 할당량 조회
    const { data: dailyQuota } = await supabase
      .from("slot_daily_quotas")
      .select("*")
      .eq("review_id", id)
      .eq("date", today)
      .single();

    let quotaData = dailyQuota;

    // 오늘의 할당량이 없으면 생성
    if (!dailyQuota) {
      const { data: newQuota, error: createError } = await supabase
        .from("slot_daily_quotas")
        .insert({
          review_id: id,
          date: today,
          available_slots: reviewData.daily_count || 0,
          reserved_slots: 0,
          last_refreshed: new Date().toISOString()
        })
        .select()
        .single();

      if (createError) {
        // 중복으로 인한 오류인 경우 기존 데이터 조회
        if (createError.code === '23505') {
          const { data: existingQuota } = await supabase
            .from("slot_daily_quotas")
            .select("*")
            .eq("review_id", id)
            .eq("date", today)
            .single();
          quotaData = existingQuota;
        } else {
          return NextResponse.json(
            { error: "슬롯 할당량 생성 실패" },
            { status: 500 }
          );
        }
      } else {
        quotaData = newQuota;
      }
    }

    // 현재 예약된 슬롯 수 계산 및 업데이트
    const { data: reservedSlots } = await supabase
      .from("slots")
      .select("id")
      .eq("review_id", id)
      .eq("opened_date", today)
      .in("status", ["reserved", "complete"]);

    const currentReservedCount = reservedSlots?.length || 0;

    // reserved_slots 수 업데이트
    if (quotaData && quotaData.reserved_slots !== currentReservedCount) {
      const { data: updatedQuota } = await supabase
        .from("slot_daily_quotas")
        .update({
          reserved_slots: currentReservedCount,
          updated_at: new Date().toISOString()
        })
        .eq("review_id", id)
        .eq("date", today)
        .select()
        .single();

      if (updatedQuota) {
        quotaData = updatedQuota;
      }
    }

    return NextResponse.json({ 
      quota: quotaData,
      review: reviewData
    });

  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 