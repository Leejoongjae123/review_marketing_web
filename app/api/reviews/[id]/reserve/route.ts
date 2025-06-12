import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { updateDailySlotsToAvailable, checkAndCreateDailyQuota } from "@/utils/slotManager";

// 일일 플랫폼별 신청 제한 체크 함수 (2단계 체크)
async function checkDailyLimits(
  supabase: any,
  userId: string,
  platform: string,
  reviewId: string,
  dailyCount: string
): Promise<{ 
  allowed: boolean; 
  step1: { allowed: boolean; count: number; limit: number };
  step2: { allowed: boolean; count: number; limit: number };
  message?: string;
}> {
  // 영수증리뷰와 구글만 체크
  if (platform !== "영수증리뷰" && platform !== "구글") {
    return { 
      allowed: true,
      step1: { allowed: true, count: 0, limit: 0 },
      step2: { allowed: true, count: 0, limit: 0 }
    };
  }

  const today = new Date();
  const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrowStart = new Date(todayStart);
  tomorrowStart.setDate(tomorrowStart.getDate() + 1);

  // 1단계: 플랫폼별 전체 신청 제한 체크 (5개)
  const { data: platformRecords, error: platformError } = await supabase
    .from("slot_today")
    .select("action_type")
    .eq("user_id", userId)
    .eq("platform", platform)
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", tomorrowStart.toISOString());

  if (platformError) {
    return { 
      allowed: false,
      step1: { allowed: false, count: 0, limit: 5 },
      step2: { allowed: false, count: 0, limit: 0 },
      message: "플랫폼별 제한 확인 중 오류가 발생했습니다."
    };
  }

  // 플랫폼별 실제 신청 수 계산
  let platformCount = 0;
  if (platformRecords) {
    for (const record of platformRecords) {
      if (record.action_type === "reserve") {
        platformCount++;
      } else if (record.action_type === "cancel") {
        platformCount--;
      }
    }
  }
  platformCount = Math.max(0, platformCount);

  const step1Check = {
    allowed: platformCount < 5,
    count: platformCount,
    limit: 5
  };

  // 2단계: 리뷰별 일일 제한 체크
  const reviewDailyLimit = parseInt(dailyCount) || 999;
  
  const { data: reviewRecords, error: reviewError } = await supabase
    .from("slot_today")
    .select("action_type")
    .eq("user_id", userId)
    .eq("review_id", reviewId)
    .gte("created_at", todayStart.toISOString())
    .lt("created_at", tomorrowStart.toISOString());

  if (reviewError) {
    return { 
      allowed: false,
      step1: step1Check,
      step2: { allowed: false, count: 0, limit: reviewDailyLimit },
      message: "리뷰별 제한 확인 중 오류가 발생했습니다."
    };
  }

  // 리뷰별 실제 신청 수 계산
  let reviewCount = 0;
  if (reviewRecords) {
    for (const record of reviewRecords) {
      if (record.action_type === "reserve") {
        reviewCount++;
      } else if (record.action_type === "cancel") {
        reviewCount--;
      }
    }
  }
  reviewCount = Math.max(0, reviewCount);

  const step2Check = {
    allowed: reviewCount < reviewDailyLimit,
    count: reviewCount,
    limit: reviewDailyLimit
  };

  // 최종 결과
  const finalAllowed = step1Check.allowed && step2Check.allowed;
  
  let message = "";
  if (!step1Check.allowed) {
    message = `${platform} 플랫폼은 하루에 최대 ${step1Check.limit}개까지만 신청할 수 있습니다. (현재: ${step1Check.count}/${step1Check.limit})`;
  } else if (!step2Check.allowed) {
    message = `이 리뷰는 하루에 최대 ${step2Check.limit}개까지만 신청할 수 있습니다. (현재: ${step2Check.count}/${step2Check.limit})`;
  }

  return {
    allowed: finalAllowed,
    step1: step1Check,
    step2: step2Check,
    message: message || undefined
  };
}

// slot_today 테이블에 기록하는 함수
async function recordSlotToday(
  supabase: any,
  userId: string,
  reviewId: string,
  slotId: string,
  platform: string,
  actionType: "reserve" | "cancel"
): Promise<void> {
  // 영수증리뷰와 구글만 기록
  if (platform !== "영수증리뷰" && platform !== "구글") {
    return;
  }

  const { error } = await supabase
    .from("slot_today")
    .insert({
      user_id: userId,
      review_id: reviewId,
      slot_id: slotId,
      platform: platform,
      action_type: actionType,
    });

  if (error) {
    // 기록 실패는 로그만 남기고 진행
    console.error("slot_today 기록 실패:", error);
  }
}

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

    // 리뷰 정보 조회하여 플랫폼과 일일 제한 확인
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("platform, daily_count")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "리뷰 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 일일 제한 체크 (2단계)
    const limitCheck = await checkDailyLimits(supabase, userId, review.platform, reviewId, review.daily_count);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { 
          error: limitCheck.message || "일일 신청 한도를 초과했습니다."
        },
        { status: 400 }
      );
    }

    // 사용자별 예약 제한 확인 (현재 리뷰에서 최대 5개까지)
    const { data: userReservations, error: userReservationError } = await supabase
      .from("slots")
      .select("id, review_id, status")
      .eq("reservation_user_id", userId)
      .eq("review_id", reviewId)  // 현재 리뷰에 대해서만 체크
      .eq("status", "reserved");

    if (userReservationError) {
      console.log("예약 현황 조회 오류:", userReservationError);
      return NextResponse.json(
        { error: "사용자 예약 현황 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const userReservationCount = userReservations?.length || 0;
    
    // 테스트를 위해 예약 정보 로깅
    console.log(`사용자 ID: ${userId}, 현재 리뷰의 예약 수(reserved만): ${userReservationCount}`);
    if (userReservations && userReservations.length > 0) {
      console.log("예약 목록(reserved만):", JSON.stringify(userReservations));
    }
    
    if (userReservationCount >= 5) {
      return NextResponse.json(
        { error: "이 리뷰에서 최대 5개까지만 동시에 진행 중인 예약을 할 수 있습니다." },
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

    // slot_today 테이블에 신청 기록
    await recordSlotToday(supabase, userId, reviewId, slotId, review.platform, "reserve");

    // 일별 할당량의 예약된 슬롯 수 업데이트 (통계 목적)
    const { data: todayReserved } = await supabase
      .from("slots")
      .select("id")
      .eq("review_id", reviewId)
      .eq("opened_date", today)
      .in("status", ["reserved", "complete"]);

    const todayReservedCount = todayReserved?.length || 0;

    const { error: quotaUpdateError } = await supabase
      .from("slot_daily_quotas")
      .update({
        reserved_slots: todayReservedCount,
        updated_at: new Date().toISOString()
      })
      .eq("review_id", reviewId)
      .eq("date", today);

    if (quotaUpdateError) {
      // 할당량 업데이트 실패는 로그만 남기고 진행 (예약은 이미 완료됨)
    }
    
    return NextResponse.json({
      success: true,
      message: "슬롯이 성공적으로 예약되었습니다.",
      data: updateData
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "슬롯 예약 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

// 신청 취소 API
export async function DELETE(
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
    
    // 요청 본문에서 slotId 추출
    const { slotId } = await request.json();
    
    if (!slotId) {
      return NextResponse.json(
        { error: "슬롯 ID가 필요합니다." },
        { status: 400 }
      );
    }
    
    // 해당 슬롯이 존재하고 내가 예약한 슬롯인지 확인
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .eq("review_id", reviewId)
      .eq("reservation_user_id", userId)
      .single();
    
    if (slotError || !slot) {
      return NextResponse.json(
        { error: "취소할 수 있는 슬롯을 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 이미 제출 완료된 상태인지 확인 (제출 완료된 슬롯은 취소 불가)
    if (slot.status === 'complete') {
      return NextResponse.json(
        { error: "이미 제출 완료된 리뷰는 취소할 수 없습니다." },
        { status: 400 }
      );
    }

    // 예약된 상태가 아닌 경우
    if (slot.status !== 'reserved') {
      return NextResponse.json(
        { error: "취소할 수 있는 상태가 아닙니다." },
        { status: 400 }
      );
    }

    // 리뷰 정보 조회하여 플랫폼 확인
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("platform")
      .eq("id", reviewId)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "리뷰 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // 슬롯 예약 취소 처리 - 원래 available 상태로 되돌림
    const { data: updateData, error: updateError } = await supabase
      .from("slots")
      .update({
        reservation_user_id: null,
        status: "available",
        reservation_updated_at: new Date().toISOString()
      })
      .eq("id", slotId)
      .select()
      .single();
    
    if (updateError) {
      return NextResponse.json(
        { error: "슬롯 예약 취소 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // slot_today 테이블에 취소 기록
    await recordSlotToday(supabase, userId, reviewId, slotId, review.platform, "cancel");

    // 해당 슬롯의 제출 데이터도 삭제 (있는 경우)
    const { error: submissionDeleteError } = await supabase
      .from("slot_submissions")
      .delete()
      .eq("slot_id", slotId)
      .eq("user_id", userId);

    if (submissionDeleteError) {
      // 제출 데이터 삭제 실패는 로그만 남기고 진행
    }

    // 일별 할당량의 예약된 슬롯 수 업데이트 (통계 목적)
    const today = new Date().toISOString().split('T')[0];
    const { data: todayReserved } = await supabase
      .from("slots")
      .select("id")
      .eq("review_id", reviewId)
      .eq("opened_date", today)
      .in("status", ["reserved", "complete"]);

    const todayReservedCount = todayReserved?.length || 0;

    const { error: quotaUpdateError } = await supabase
      .from("slot_daily_quotas")
      .update({
        reserved_slots: todayReservedCount,
        updated_at: new Date().toISOString()
      })
      .eq("review_id", reviewId)
      .eq("date", today);

    if (quotaUpdateError) {
      // 할당량 업데이트 실패는 로그만 남기고 진행
    }
    
    return NextResponse.json({
      success: true,
      message: "리뷰 신청이 성공적으로 취소되었습니다.",
      data: updateData
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "슬롯 예약 취소 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 