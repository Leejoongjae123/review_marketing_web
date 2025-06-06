import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json(
        { error: "파일 이름이 필요합니다" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // 파일 삭제
    const { error } = await supabase.storage
      .from("notice_videos")
      .remove([fileName]);

    if (error) {
      return NextResponse.json(
        { error: "파일 삭제 실패: " + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "파일이 성공적으로 삭제되었습니다",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 