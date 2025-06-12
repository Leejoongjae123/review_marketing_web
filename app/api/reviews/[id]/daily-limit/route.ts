import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
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

    // 구글과 영수증리뷰만 체크 (platform을 "네이버영수증" 대신 "영수증리뷰"로 수정)
    if (review.platform !== "영수증리뷰" && review.platform !== "구글") {
      return NextResponse.json({
        success: true,
        data: {
          platform: review.platform,
          hasLimit: false,
          allowed: true,
          count: 0,
          limit: 0,
          step1: { allowed: true, count: 0, limit: 0 },
          step2: { allowed: true, count: 0, limit: 0 }
        }
      });
    }

    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);

    // 1단계: 오늘 해당 플랫폼에 대한 전체 신청 제한 체크 (5개)
    const { data: todayRecords, error: todayError } = await supabase
      .from("slot_today")
      .select("action_type")
      .eq("user_id", userId)
      .eq("platform", review.platform)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString());

    if (todayError) {
      return NextResponse.json(
        { error: "일일 제한 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 실제 신청 수 계산 (reserve - cancel)
    let platformCount = 0;
    if (todayRecords) {
      for (const record of todayRecords) {
        if (record.action_type === "reserve") {
          platformCount++;
        } else if (record.action_type === "cancel") {
          platformCount--;
        }
      }
    }

    // 음수가 되지 않도록 보정
    platformCount = Math.max(0, platformCount);

    const step1Check = {
      allowed: platformCount < 5,
      count: platformCount,
      limit: 5
    };

    // 2단계: 해당 리뷰의 일일 제한 체크
    const reviewDailyLimit = parseInt(review.daily_count) || 999; // daily_count가 없으면 제한 없음

    // 오늘 이 리뷰에 대한 신청 수 체크
    const { data: reviewTodayRecords, error: reviewTodayError } = await supabase
      .from("slot_today")
      .select("action_type")
      .eq("user_id", userId)
      .eq("review_id", reviewId)
      .gte("created_at", todayStart.toISOString())
      .lt("created_at", tomorrowStart.toISOString());

    if (reviewTodayError) {
      return NextResponse.json(
        { error: "리뷰별 일일 제한 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    // 이 리뷰에 대한 실제 신청 수 계산
    let reviewCount = 0;
    if (reviewTodayRecords) {
      for (const record of reviewTodayRecords) {
        if (record.action_type === "reserve") {
          reviewCount++;
        } else if (record.action_type === "cancel") {
          reviewCount--;
        }
      }
    }

    // 음수가 되지 않도록 보정
    reviewCount = Math.max(0, reviewCount);

    const step2Check = {
      allowed: reviewCount < reviewDailyLimit,
      count: reviewCount,
      limit: reviewDailyLimit
    };

    // 최종 결과는 두 단계 모두 통과해야 함
    const finalAllowed = step1Check.allowed && step2Check.allowed;

    return NextResponse.json({
      success: true,
      data: {
        platform: review.platform,
        hasLimit: true,
        allowed: finalAllowed,
        count: platformCount, // 1단계 카운트를 메인으로 표시
        limit: 5,
        step1: step1Check,
        step2: step2Check
      }
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "일일 제한 확인 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 