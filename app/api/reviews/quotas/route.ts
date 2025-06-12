import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    
    const { reviewId, quotaNumber, status, images, receipts } = body;

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

    // 이미지 파일 업로드 및 저장
    if (images && images.length > 0) {
      for (const image of images) {
        try {
          // base64 데이터에서 파일 정보 추출
          const base64Data = image.base64.split(',')[1];
          const mimeType = image.base64.split(',')[0].split(':')[1].split(';')[0];
          const fileExtension = mimeType.split('/')[1];
          
          // 파일명 생성
          const fileName = `quota_${quotaId}_image_${Date.now()}.${fileExtension}`;
          
          // Supabase Storage에 업로드
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('reviews')
            .upload(fileName, Buffer.from(base64Data, 'base64'), {
              contentType: mimeType,
            });

          if (uploadError) {
            console.error('이미지 업로드 오류:', uploadError);
            continue; // 개별 이미지 실패는 건너뛰고 계속 진행
          }

          // 슬롯의 이미지 배열에 추가
          const { data: currentSlot, error: fetchError } = await supabase
            .from('slots')
            .select('images')
            .eq('id', quotaId)
            .single();

          if (!fetchError && currentSlot) {
            const currentImages = currentSlot.images || [];
            const updatedImages = [...currentImages, uploadData.path];
            
            const { error: imageError } = await supabase
              .from('slots')
              .update({
                images: updatedImages,
                images_updated_at: image.uploadedAt
              })
              .eq('id', quotaId);

            if (imageError) {
              console.error('이미지 정보 저장 오류:', imageError);
            }
          }


        } catch (error) {
          console.error('이미지 처리 오류:', error);
        }
      }
    }

    // 영수증 파일 업로드 및 저장
    if (receipts && receipts.length > 0) {
      for (const receipt of receipts) {
        try {
          // base64 데이터에서 파일 정보 추출
          const base64Data = receipt.base64.split(',')[1];
          const mimeType = receipt.base64.split(',')[0].split(':')[1].split(';')[0];
          const fileExtension = mimeType.split('/')[1];
          
          // 파일명 생성
          const fileName = `quota_${quotaId}_receipt_${Date.now()}.${fileExtension}`;
          
          // Supabase Storage에 업로드
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('reviews')
            .upload(fileName, Buffer.from(base64Data, 'base64'), {
              contentType: mimeType,
            });

          if (uploadError) {
            console.error('영수증 업로드 오류:', uploadError);
            continue; // 개별 영수증 실패는 건너뛰고 계속 진행
          }

          // 슬롯의 영수증 배열에 추가
          const { data: currentSlot, error: fetchError } = await supabase
            .from('slots')
            .select('receipts')
            .eq('id', quotaId)
            .single();

          if (!fetchError && currentSlot) {
            const currentReceipts = currentSlot.receipts || [];
            const updatedReceipts = [...currentReceipts, uploadData.path];
            
            const { error: receiptError } = await supabase
              .from('slots')
              .update({
                receipts: updatedReceipts,
                receipts_updated_at: receipt.uploadedAt
              })
              .eq('id', quotaId);

            if (receiptError) {
              console.error('영수증 정보 저장 오류:', receiptError);
            }
          }
        } catch (error) {
          console.error('영수증 처리 오류:', error);
        }
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