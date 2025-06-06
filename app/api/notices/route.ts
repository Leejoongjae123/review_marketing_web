import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

interface VideoAttachment {
  url: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  fileType: string;
}

interface NoticeRequest {
  title: string;
  content: string;
  is_pinned: boolean;
  status: string;
  video_attachments?: VideoAttachment[];
}

export async function POST(request: NextRequest) {
  try {
    const requestData: NoticeRequest = await request.json();
    
    // 필수 데이터 검증
    if (!requestData.title || !requestData.content) {
      return NextResponse.json(
        { error: "제목과 내용은 필수 항목입니다" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // 공지사항 생성
    const { data: notice, error: noticeError } = await supabase
      .from("notices")
      .insert({
        title: requestData.title,
        content: requestData.content,
        is_pinned: requestData.is_pinned,
        status: requestData.status,
        video_attachments: requestData.video_attachments || [],
      })
      .select()
      .single();

    if (noticeError) {
      return NextResponse.json(
        { error: "공지사항 생성 실패: " + noticeError.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { id: notice.id, message: "공지사항이 성공적으로 생성되었습니다" },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || null;
    const isPinned = searchParams.get("is_pinned") || null;
    
    const offset = (page - 1) * limit;
    
    const supabase = await createClient();
    
    let query = supabase
      .from("notices")
      .select(`
        id, 
        title, 
        content, 
        is_pinned, 
        status, 
        created_at, 
        updated_at,
        view_count,
        video_attachments
      `, { count: "exact" });
    
    // 검색어가 있으면 적용
    if (search) {
      query = query.ilike("title", `%${search}%`);
    }
    
    // 상태 필터 적용
    if (status) {
      query = query.eq("status", status);
    }
    
    // 중요공지 필터 적용
    if (isPinned) {
      query = query.eq("is_pinned", isPinned === "true");
    }
    
    // 정렬 적용 (중요공지 우선, 최신순)
    query = query.order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false });
    
    const { data, error, count } = await query
      .range(offset, offset + limit - 1);
    
    if (error) {
      return NextResponse.json(
        { error: "공지사항 조회 실패: " + error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: count ? Math.ceil(count / limit) : 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 