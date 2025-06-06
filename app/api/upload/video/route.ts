import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { error: "동영상 파일이 필요합니다" },
        { status: 400 }
      );
    }

    // 파일 크기 제한 (100MB)
    const maxSize = 100 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: "파일 크기는 100MB를 초과할 수 없습니다" },
        { status: 400 }
      );
    }

    // 파일 형식 확인
    if (!file.type.startsWith("video/")) {
      return NextResponse.json(
        { error: "동영상 파일만 업로드 가능합니다" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    
    // 확장자 추출
    const fileExt = file.name.split('.').pop() || 'mp4';
    
    // UUID만 사용하여 파일 이름 생성
    const fileName = `${uuidv4()}.${fileExt}`;
    
    // 파일 업로드
    const { data, error } = await supabase.storage
      .from("videos")
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) {
      return NextResponse.json(
        { error: "파일 업로드 실패: " + error.message },
        { status: 500 }
      );
    }

    // 공개 URL 가져오기
    const { data: publicUrlData } = supabase.storage
      .from("videos")
      .getPublicUrl(fileName);

    return NextResponse.json({
      success: true,
      fileName: fileName,
      url: publicUrlData.publicUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 