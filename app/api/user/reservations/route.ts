import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
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
    
    // 사용자별 전체 예약 현황 확인 (전체 리뷰에서 최대 5개까지)
    const { data: userReservations, error: userReservationError } = await supabase
      .from("slots")
      .select(`
        id,
        review_id,
        slot_number,
        status,
        created_at,
        reviews!inner (
          id,
          title,
          platform
        )
      `)
      .eq("reservation_user_id", userId)
      .eq("status", "reserved")
      .order("created_at", { ascending: false });

    if (userReservationError) {
      console.log("예약 현황 조회 오류:", userReservationError);
      return NextResponse.json(
        { error: "사용자 예약 현황 확인 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }

    const userReservationCount = userReservations?.length || 0;
    
    // 디버깅을 위한 로깅
    console.log(`사용자 ID: ${userId}, 현재 진행 중인 예약 수(reserved만): ${userReservationCount}`);
    if (userReservations && userReservations.length > 0) {
      console.log("예약 정보(reserved만):", JSON.stringify(userReservations.map(res => ({
        id: res.id,
        review_id: res.review_id,
        status: res.status,
        platform: res.reviews?.platform
      }))));
    }
    
    return NextResponse.json({
      success: true,
      data: {
        totalReservations: userReservationCount,
        maxReservations: 5,
        reservations: userReservations || []
      }
    });
    
  } catch (error) {
    console.log("예약 현황 조회 중 오류:", error);
    return NextResponse.json(
      { error: "사용자 예약 현황 조회 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 