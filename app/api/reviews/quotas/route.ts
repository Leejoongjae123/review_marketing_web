import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { reviewId, quotaNumber, status, imageUrls, receiptUrls } = body;

    if (!reviewId || !quotaNumber) {
      return NextResponse.json(
        { error: 'reviewId와 quotaNumber는 필수입니다.' },
        { status: 400 }
      );
    }

    // 기존 슬롯 테이블을 사용하여 구좌 데이터 업데이트
    const { data: quotaData, error: quotaError } = await supabase
      .from('slots')
      .update({
        status: status,
        updated_at: new Date().toISOString()
      })
      .eq('review_id', reviewId)
      .eq('slot_number', quotaNumber)
      .select()
      .single();

    if (quotaError) {
      console.error('구좌 업데이트 오류:', quotaError);
      return NextResponse.json(
        { error: '구좌 업데이트에 실패했습니다.' },
        { status: 500 }
      );
    }

    const quotaId = quotaData.id;

    // 이미지 URL 저장
    if (imageUrls && imageUrls.length > 0) {
      try {
        // 현재 슬롯의 이미지 배열 가져오기
        const { data: currentSlot, error: fetchError } = await supabase
          .from('slots')
          .select('images')
          .eq('id', quotaId)
          .single();

        if (!fetchError && currentSlot) {
          const currentImages = currentSlot.images || [];
          const updatedImages = [...currentImages, ...imageUrls];
          
          const { error: imageError } = await supabase
            .from('slots')
            .update({
              images: updatedImages,
              images_updated_at: new Date().toISOString()
            })
            .eq('id', quotaId);

          if (imageError) {
            console.error('이미지 URL 저장 오류:', imageError);
          }
        }
      } catch (error) {
        console.error('이미지 URL 처리 오류:', error);
      }
    }

    // 영수증 URL 저장
    if (receiptUrls && receiptUrls.length > 0) {
      try {
        // 현재 슬롯의 영수증 배열 가져오기
        const { data: currentSlot, error: fetchError } = await supabase
          .from('slots')
          .select('receipts')
          .eq('id', quotaId)
          .single();

        if (!fetchError && currentSlot) {
          const currentReceipts = currentSlot.receipts || [];
          const updatedReceipts = [...currentReceipts, ...receiptUrls];
          
          const { error: receiptError } = await supabase
            .from('slots')
            .update({
              receipts: updatedReceipts,
              receipts_updated_at: new Date().toISOString()
            })
            .eq('id', quotaId);

          if (receiptError) {
            console.error('영수증 URL 저장 오류:', receiptError);
          }
        }
      } catch (error) {
        console.error('영수증 URL 처리 오류:', error);
      }
    }

    return NextResponse.json({
      success: true,
      quotaId: quotaId,
      message: `구좌 ${quotaNumber}번이 성공적으로 처리되었습니다.`
    });

  } catch (error) {
    console.error('구좌 처리 오류:', error);
    return NextResponse.json(
      { error: '구좌 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 