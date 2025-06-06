import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; slotId: string }> }
) {
  try {
    const { id: reviewId, slotId } = await params;
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
    
    // 해당 슬롯이 현재 사용자가 예약한 것인지 확인
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .eq("review_id", reviewId)
      .eq("reservation_user_id", userId)
      .single();
    
    if (slotError || !slot) {
      return NextResponse.json(
        { error: "해당 슬롯에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }
    
    // 제출 이력 조회
    const { data: submissionData, error } = await supabase
      .from("slot_submissions")
      .select("*")
      .eq("slot_id", slotId)
      .single();
    
    if (error && error.code !== "PGRST116") {
      return NextResponse.json(
        { error: "제출 데이터 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: submissionData || null
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 