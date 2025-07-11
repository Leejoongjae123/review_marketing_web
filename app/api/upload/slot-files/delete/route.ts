import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { filePath } = await request.json();
    
    if (!filePath) {
      return NextResponse.json(
        { error: '파일 경로가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // Supabase Storage에서 파일 삭제
    const { error: deleteError } = await supabase.storage
      .from('review-files')
      .remove([filePath]);
    
    if (deleteError) {
      console.error('파일 삭제 오류:', deleteError);
      return NextResponse.json(
        { error: '파일 삭제에 실패했습니다.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: '파일이 성공적으로 삭제되었습니다.'
    });
    
  } catch (error) {
    console.error('파일 삭제 처리 오류:', error);
    return NextResponse.json(
      { error: '파일 삭제 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 