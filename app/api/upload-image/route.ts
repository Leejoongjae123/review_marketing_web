import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// API 라우트 설정 - 요청 크기 제한 증가
export const runtime = 'nodejs';
export const maxDuration = 60; // 최대 실행 시간 60초

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const contentType = request.headers.get('content-type') || '';
    
    let fileBuffer: Uint8Array;
    let fileName: string;
    let mimeType: string;
    
    // JSON 요청 (base64 데이터) 처리
    if (contentType.includes('application/json')) {
      const { base64Data, prefix = 'image' } = await request.json();
      
      if (!base64Data) {
        return NextResponse.json(
          { error: 'base64 데이터가 없습니다.' },
          { status: 400 }
        );
      }
      
      // base64 형식에서 실제 바이너리 데이터로 변환
      const base64WithoutPrefix = base64Data.split(",")[1];
      if (!base64WithoutPrefix) {
        return NextResponse.json(
          { error: '잘못된 base64 형식입니다.' },
          { status: 400 }
        );
      }
      
      const buffer = Buffer.from(base64WithoutPrefix, "base64");
      fileBuffer = new Uint8Array(buffer);
      
      // MIME 타입 추출
      mimeType = base64Data.split(";")[0].split(":")[1];
      if (!mimeType || !mimeType.startsWith('image/')) {
        return NextResponse.json(
          { error: '이미지 파일만 업로드 가능합니다.' },
          { status: 400 }
        );
      }
      
      // 파일 확장자 추출
      const extension = mimeType.split("/")[1];
      fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
      
    } else {
      // FormData 요청 처리 (기존 로직)
      const formData = await request.formData();
      const file = formData.get('file') as File;
      
      if (!file) {
        return NextResponse.json(
          { error: '파일이 없습니다.' },
          { status: 400 }
        );
      }

      // 파일 크기 제한 (5MB)
      if (file.size > 5 * 1024 * 1024) {
        return NextResponse.json(
          { error: '파일 크기는 5MB 이하여야 합니다.' },
          { status: 400 }
        );
      }

      // 이미지 파일 타입 검증
      if (!file.type.startsWith('image/')) {
        return NextResponse.json(
          { error: '이미지 파일만 업로드 가능합니다.' },
          { status: 400 }
        );
      }

      // 파일명 생성 (타임스탬프 + 원본 파일명)
      const timestamp = Date.now();
      const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_'); // 특수문자 제거
      fileName = `${timestamp}_${originalName}`;
      mimeType = file.type;

      // 파일을 ArrayBuffer로 변환
      const arrayBuffer = await file.arrayBuffer();
      fileBuffer = new Uint8Array(arrayBuffer);
    }

    // 파일 크기 제한 (5MB)
    if (fileBuffer.length > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 5MB 이하여야 합니다.' },
        { status: 400 }
      );
    }

    // Supabase Storage에 업로드 - reviews 버킷 사용
    const { data, error } = await supabase.storage
      .from('reviews')
      .upload(`public/${fileName}`, fileBuffer, {
        contentType: mimeType,
        upsert: false
      });

    if (error) {
      console.error('Storage 업로드 오류:', error);
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다: ' + error.message },
        { status: 500 }
      );
    }

    // 업로드된 파일의 공개 URL 생성
    const { data: urlData } = supabase.storage
      .from('reviews')
      .getPublicUrl(`public/${fileName}`);

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      fileName: fileName
    });

  } catch (error) {
    console.error('이미지 업로드 API 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 