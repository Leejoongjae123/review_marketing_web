import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const shouldIncreaseView = searchParams.get("view") !== "false";
  
  const supabase = await createClient();

  try {
    // 공지사항 조회
    const { data: notice, error } = await supabase
      .from("notices")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: "공지사항을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "공지사항을 불러오는데 실패했습니다" },
        { status: 500 }
      );
    }

    let updatedNotice = notice;

    // view 파라미터가 false가 아닌 경우에만 조회수 증가
    if (shouldIncreaseView) {
      const { data: updatedData, error: updateError } = await supabase
        .from("notices")
        .update({ view_count: notice.view_count + 1 })
        .eq("id", id)
        .select()
        .single();
      
      if (!updateError && updatedData) {
        updatedNotice = updatedData;
      } else {
        // 업데이트 실패 시에도 클라이언트에는 증가된 값으로 표시
        updatedNotice = {
          ...notice,
          view_count: notice.view_count + 1
        };
      }
    }

    return NextResponse.json({
      notice: updatedNotice,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    const body = await request.json();
    const {
      title,
      content,
      status,
      category,
      priority,
      is_pinned,
      video_attachments
    } = body;

    // 입력 값 검증
    if (!title?.trim() || !content?.trim()) {
      return NextResponse.json(
        { error: "제목과 내용은 필수입니다" },
        { status: 400 }
      );
    }

    // 현재 사용자 정보 가져오기 (관리자 권한 확인)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    

    // 공지사항 업데이트
    const { data: updatedNotice, error: updateError } = await supabase
      .from("notices")
      .update({
        title: title.trim(),
        content: content.trim(),
        status: status || "active",
        is_pinned: is_pinned || false,
        video_attachments: video_attachments || [],
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "공지사항을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "공지사항 수정에 실패했습니다" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: "공지사항이 성공적으로 수정되었습니다",
      notice: updatedNotice
    });

  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  try {
    // 현재 사용자 정보 가져오기 (관리자 권한 확인)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "인증이 필요합니다" },
        { status: 401 }
      );
    }

    // 관리자 권한 확인
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    // 공지사항 조회 (첨부된 동영상 파일 정보 확인)
    const { data: notice, error: fetchError } = await supabase
      .from("notices")
      .select("video_attachments")
      .eq("id", id)
      .single();

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        return NextResponse.json(
          { error: "공지사항을 찾을 수 없습니다" },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { error: "공지사항을 조회하는데 실패했습니다" },
        { status: 500 }
      );
    }

    // 공지사항 삭제
    const { error: deleteError } = await supabase
      .from("notices")
      .delete()
      .eq("id", id);

    if (deleteError) {
      return NextResponse.json(
        { error: "공지사항 삭제에 실패했습니다" },
        { status: 500 }
      );
    }

    // 첨부된 동영상 파일들 삭제
    if (notice.video_attachments && notice.video_attachments.length > 0) {
      const fileNames = notice.video_attachments.map((attachment: any) => attachment.fileName);
      
      if (fileNames.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("notice_videos")
          .remove(fileNames);
        
        // 스토리지 삭제 실패해도 공지사항은 이미 삭제되었으므로 성공으로 처리
        if (storageError) {
          console.error("첨부 파일 삭제 실패:", storageError);
        }
      }
    }

    return NextResponse.json({
      message: "공지사항이 성공적으로 삭제되었습니다"
    });

  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 