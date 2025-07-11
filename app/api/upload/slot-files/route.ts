import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    
    const file = formData.get('file') as File;
    const quotaId = formData.get('quotaId') as string;
    const type = formData.get('type') as 'images' | 'receipts';
    
    if (!file || !quotaId || !type) {
      return NextResponse.json(
        { error: '파일, 구좌ID, 타입이 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 파일 타입 검증
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: '이미지 파일만 업로드할 수 있습니다.' },
        { status: 400 }
      );
    }
    
    // 파일 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: '파일 크기는 10MB를 초과할 수 없습니다.' },
        { status: 400 }
      );
    }
    
    // 파일명 생성
    const timestamp = Date.now();
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `slot_${quotaId}_${type}_${timestamp}.${fileExtension}`;
    
    // ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);
    
    // Supabase Storage에 업로드
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('review-files')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      });
    
    if (uploadError) {
      console.error('파일 업로드 오류:', uploadError);
      return NextResponse.json(
        { error: '파일 업로드에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    // 공개 URL 생성
    const { data: publicUrlData } = supabase.storage
      .from('review-files')
      .getPublicUrl(uploadData.path);
    
    return NextResponse.json({
      success: true,
      fileName: fileName,
      path: uploadData.path,
      url: publicUrlData.publicUrl,
      uploadedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('파일 업로드 처리 오류:', error);
    return NextResponse.json(
      { error: '파일 업로드 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 