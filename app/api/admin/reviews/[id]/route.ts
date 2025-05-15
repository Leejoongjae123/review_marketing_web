import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

// 리뷰 삭제 API
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const {id} = await params;
    const reviewId = id;
    const supabase = await createClient();

    // 리뷰 삭제
    const { error } = await supabase
      .from("reviews")
      .delete()
      .eq("id", reviewId);

    if (error) {
      console.error("Error deleting review:", error);
      return NextResponse.json(
        { error: "리뷰 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "리뷰가 성공적으로 삭제되었습니다" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing delete request:", error);
    return NextResponse.json(
      { error: "요청 처리 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 