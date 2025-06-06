import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const reviewId = id;
    
    const body = await request.json();
    const { slotNumber, fileType, fileUrl } = body;
    
    if (!slotNumber || !fileType || !fileUrl) {
      return NextResponse.json({ error: '필수 파라미터가 누락되었습니다.' }, { status: 400 });
    }
    
    // 기존 슬롯 데이터 조회
    const { data: existingSlot, error: existingSlotError } = await supabase
      .from("slots")
      .select("*")
      .eq("review_id", reviewId)
      .eq("slot_number", slotNumber)
      .single();

    if (existingSlotError || !existingSlot) {
      return NextResponse.json({ error: '슬롯을 찾을 수 없습니다.' }, { status: 404 });
    }

    let updatedImages = existingSlot.images || [];
    let updatedReceipts = existingSlot.receipts || [];
    
    // 파일 타입에 따라 해당 배열에서 URL 제거
    if (fileType === 'images') {
      updatedImages = updatedImages.filter((url: string) => url !== fileUrl);
    } else if (fileType === 'receipts') {
      updatedReceipts = updatedReceipts.filter((url: string) => url !== fileUrl);
    }
    
    // 슬롯 데이터 업데이트
    const { error: updateError } = await supabase
      .from("slots")
      .update({
        images: updatedImages,
        receipts: updatedReceipts,
      })
      .eq("review_id", reviewId)
      .eq("slot_number", slotNumber);

    if (updateError) {
      return NextResponse.json({ error: '파일 삭제에 실패했습니다.' }, { status: 500 });
    }

    // 스토리지에서 실제 파일 삭제 (선택사항)
    try {
      const fileName = fileUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('reviews')
          .remove([`public/${fileName}`]);
      }
    } catch (storageError) {
      // 스토리지 삭제 실패는 무시 (데이터베이스 업데이트는 성공)
      console.error('스토리지 파일 삭제 실패:', storageError);
    }

    return NextResponse.json({ success: true, message: '파일이 성공적으로 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json({ error: '파일 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 