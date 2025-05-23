import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    // 현재 로그인한 사용자(광고주) 정보 가져오기
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "인증된 사용자가 아닙니다." },
        { status: 401 }
      );
    }
    
    const providerId = userData.user.id;
    
    // 삭제할 참여자가 현재 광고주의 리뷰에 참여한 사용자인지 확인
    const { data: participantData, error: participantError } = await supabase
      .from("review_participants")
      .select(`
        *,
        reviews:review_id (
          provider1,
          provider2,
          provider3
        )
      `)
      .eq("id", id)
      .single();
    
    if (participantError || !participantData) {
      return NextResponse.json(
        { error: "참여자 정보를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // 권한 체크: 현재 광고주가 이 리뷰를 관리하는 광고주인지 확인
    const { provider1, provider2, provider3 } = participantData.reviews;
    
    if (provider1 !== providerId && provider2 !== providerId && provider3 !== providerId) {
      return NextResponse.json(
        { error: "이 참여자를 삭제할 권한이 없습니다." },
        { status: 403 }
      );
    }
    
    // 참여자 삭제
    const { error: deleteError } = await supabase
      .from("review_participants")
      .delete()
      .eq("id", id);
    
    if (deleteError) {
      return NextResponse.json(
        { error: "참여자 삭제 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.log("Error deleting participant:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 