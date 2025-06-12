import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const reviewId = id;
    const supabase = await createClient();
    
    // 현재 로그인한 사용자 정보 가져오기 (관리자 권한 확인)
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { slotUpdates } = body;

    if (!slotUpdates || !Array.isArray(slotUpdates)) {
      return NextResponse.json(
        { error: "업데이트할 슬롯 정보가 필요합니다." },
        { status: 400 }
      );
    }

    // 리뷰 존재 여부 확인
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("id, daily_count")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "리뷰를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const updatedSlots = [];
    const errors = [];

    // 각 슬롯 업데이트 처리
    for (const update of slotUpdates) {
      const { slotId, status, slotNumber } = update;

      if (!slotId || !status) {
        errors.push(`슬롯 ID와 상태는 필수입니다. (슬롯: ${slotNumber || slotId})`);
        continue;
      }

      try {
        // 슬롯 존재 여부 확인
        const { data: existingSlot, error: slotError } = await supabase
          .from("slots")
          .select("*")
          .eq("id", slotId)
          .eq("review_id", reviewId)
          .single();

        if (slotError || !existingSlot) {
          errors.push(`슬롯을 찾을 수 없습니다. (ID: ${slotId})`);
          continue;
        }

        // 상태별 업데이트 데이터 준비
        let updateData: any = {
          status: status,
          updated_at: new Date().toISOString()
        };

        // available 상태로 변경하는 경우 opened_date 설정
        if (status === 'available' && existingSlot.status === 'unopened') {
          updateData.opened_date = today;
        }

        // unopened 상태로 변경하는 경우 opened_date 제거
        if (status === 'unopened') {
          updateData.opened_date = null;
          updateData.reservation_user_id = null;
        }

        // 슬롯 상태 업데이트
        const { data: updatedSlot, error: updateError } = await supabase
          .from("slots")
          .update(updateData)
          .eq("id", slotId)
          .eq("review_id", reviewId)
          .select()
          .single();

        if (updateError) {
          errors.push(`슬롯 업데이트 실패 (ID: ${slotId}): ${updateError.message}`);
          continue;
        }

        updatedSlots.push({
          id: updatedSlot.id,
          slot_number: updatedSlot.slot_number,
          old_status: existingSlot.status,
          new_status: updatedSlot.status,
          opened_date: updatedSlot.opened_date
        });

      } catch (error) {
        errors.push(`슬롯 처리 중 오류 발생 (ID: ${slotId}): ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
      }
    }

    // 일별 할당량 업데이트
    try {
      // 오늘 오픈된 슬롯 수 계산
      const { data: todaySlots, error: todaySlotsError } = await supabase
        .from("slots")
        .select("id, status")
        .eq("review_id", reviewId)
        .eq("opened_date", today);

      if (!todaySlotsError && todaySlots) {
        const reservedCount = todaySlots.filter(slot => 
          slot.status === 'reserved' || slot.status === 'complete'
        ).length;

        // 일별 할당량 테이블 업데이트 또는 생성
        const { data: existingQuota } = await supabase
          .from("slot_daily_quotas")
          .select("*")
          .eq("review_id", reviewId)
          .eq("date", today)
          .single();

        if (existingQuota) {
          // 기존 할당량 업데이트
          await supabase
            .from("slot_daily_quotas")
            .update({
              reserved_slots: reservedCount,
              updated_at: new Date().toISOString()
            })
            .eq("review_id", reviewId)
            .eq("date", today);
        } else {
          // 새 할당량 생성
          await supabase
            .from("slot_daily_quotas")
            .insert({
              review_id: reviewId,
              date: today,
              available_slots: review.daily_count || 0,
              reserved_slots: reservedCount,
              last_refreshed: new Date().toISOString()
            });
        }
      }
    } catch (quotaError) {
      // 일별 할당량 업데이트 실패는 경고로 처리
      console.error("일별 할당량 업데이트 실패:", quotaError);
    }

    // 결과 반환
    const response: any = {
      success: true,
      message: `${updatedSlots.length}개의 슬롯이 업데이트되었습니다.`,
      updated_slots: updatedSlots
    };

    if (errors.length > 0) {
      response.warnings = errors;
      response.message += ` ${errors.length}개의 오류가 발생했습니다.`;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error("일괄 슬롯 업데이트 오류:", error);
    return NextResponse.json(
      { error: "슬롯 일괄 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 