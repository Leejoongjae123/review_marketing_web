import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { updateDailySlotsToAvailable, checkAndCreateDailyQuota } from "@/utils/slotManager";

export async function POST(
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

    const today = new Date().toISOString().split('T')[0];
    
    // 일별 할당량 확인 및 생성
    const quotaResult = await checkAndCreateDailyQuota(reviewId, today);
    if (!quotaResult.success) {
      return NextResponse.json(
        { error: quotaResult.error },
        { status: 500 }
      );
    }
    
    // 슬롯 상태 업데이트
    const updateResult = await updateDailySlotsToAvailable(reviewId, today);
    if (!updateResult.success) {
      return NextResponse.json(
        { error: updateResult.error },
        { status: 500 }
      );
    }
    
    // 업데이트된 슬롯 정보 조회
    const { data: updatedSlots, error: slotsError } = await supabase
      .from("slots")
      .select("*")
      .eq("review_id", reviewId)
      .eq("opened_date", today)
      .order("slot_number", { ascending: true });

    if (slotsError) {
      return NextResponse.json(
        { error: "슬롯 정보 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: updateResult.message,
      activated: updateResult.activated,
      slots: updatedSlots
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "슬롯 상태 업데이트 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 