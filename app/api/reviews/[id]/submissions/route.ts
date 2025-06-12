import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 해당 리뷰의 모든 제출 데이터 조회
    const { data: submissions, error } = await supabase
      .from("slot_submissions")
      .select("*")
      .eq("review_id", id);

    if (error) {
      return NextResponse.json(
        { error: "제출 데이터 조회 실패", details: error.message },
        { status: 500 }
      );
    }

    // slot_id를 키로 하는 객체로 변환하여 반환
    const submissionMap: Record<string, any> = {};
    submissions?.forEach((submission) => {
      submissionMap[submission.slot_id] = submission;
    });

    return NextResponse.json({
      success: true,
      data: submissionMap,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 