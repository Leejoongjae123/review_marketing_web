import { createClient } from '@/utils/supabase/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const reviewId = id;
    
    // 리뷰 정보 가져오기 (기본 정보)
    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!review) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // provider1, provider2, provider3의 이름 정보 가져오기
    const reviewWithProviders = { ...review };
    
    // provider1 정보 가져오기
    if (review.provider1) {
      const { data: provider1Data, error: provider1Error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', review.provider1)
        .single();
        
      if (!provider1Error && provider1Data) {
        reviewWithProviders.provider1_name = provider1Data.full_name;
      }
    }
    
    // provider2 정보 가져오기
    if (review.provider2) {
      const { data: provider2Data, error: provider2Error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', review.provider2)
        .single();
        
      if (!provider2Error && provider2Data) {
        reviewWithProviders.provider2_name = provider2Data.full_name;
      }
    }
    
    // provider3 정보 가져오기
    if (review.provider3) {
      const { data: provider3Data, error: provider3Error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', review.provider3)
        .single();
        
      if (!provider3Error && provider3Data) {
        reviewWithProviders.provider3_name = provider3Data.full_name;
      }
    }

    // 구좌 정보 가져오기
    const { data: slotsData, error: slotsError } = await supabase
      .from('slots')
      .select('*')
      .eq('review_id', reviewId)
      .order('slot_number', { ascending: true });

    if (!slotsError && slotsData) {
      // 오늘 날짜 확인
      const today = new Date().toISOString().split('T')[0];
      
      // 일별 할당량 확인
      const { data: dailyQuota } = await supabase
        .from('slot_daily_quotas')
        .select('*')
        .eq('review_id', reviewId)
        .eq('date', today)
        .single();

      // 일별 할당량이 없으면 생성 (처음 접근 시)
      if (!dailyQuota && review.daily_count) {
        await supabase
          .from('slot_daily_quotas')
          .insert({
            review_id: reviewId,
            date: today,
            available_slots: review.daily_count,
            reserved_slots: 0
          });
      }

      // 간단히 데이터베이스의 현재 상태 그대로 반환
      console.log("원본 slots 데이터:", slotsData.map(s => ({ slot_number: s.slot_number, status: s.status })));
      console.log("일별 할당량:", dailyQuota);
      console.log("리뷰 일건수:", review.daily_count);
      
      // 데이터베이스의 상태를 그대로 사용
      reviewWithProviders.slots = slotsData;
    } else {
      reviewWithProviders.slots = [];
    }
    
    return NextResponse.json({ review: reviewWithProviders });
  } catch (error) {
    return NextResponse.json({ error: '리뷰 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const reviewId = id;
    
    // 요청 본문 파싱
    const requestData = await request.json();
    
    // 필수 필드 검증
    if (!requestData.platform || !requestData.title) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    // 숫자 형식 변환
    const price = requestData.price ? (isNaN(parseInt(requestData.price)) ? null : parseInt(requestData.price)) : null;
    const shipping_fee = requestData.shipping_fee ? (isNaN(parseInt(requestData.shipping_fee)) ? null : parseInt(requestData.shipping_fee)) : null;
    const participants = requestData.participants ? (isNaN(parseInt(requestData.participants)) ? null : parseInt(requestData.participants)) : null;
    const rating = requestData.rating ? (isNaN(parseInt(requestData.rating)) ? null : parseInt(requestData.rating)) : null;
    const review_fee = requestData.review_fee ? (isNaN(parseInt(requestData.review_fee)) ? null : parseInt(requestData.review_fee)) : null;
    const reservation_amount = requestData.reservation_amount ? (isNaN(parseInt(requestData.reservation_amount)) ? null : parseInt(requestData.reservation_amount)) : null;
    const daily_count = requestData.daily_count ? (isNaN(parseInt(requestData.daily_count)) ? null : parseInt(requestData.daily_count)) : null;
    const purchase_cost = requestData.purchase_cost ? (isNaN(parseInt(requestData.purchase_cost)) ? null : parseInt(requestData.purchase_cost)) : null;
    
    // 업데이트할 데이터 준비
    const updateData = {
      platform: requestData.platform,
      product_name: requestData.product_name,
      option_name: requestData.option_name,
      price: price,
      shipping_fee: shipping_fee,
      seller: requestData.seller,
      participants: participants,
      status: requestData.status,
      start_date: requestData.start_date || null,
      end_date: requestData.end_date || null,
      title: requestData.title,
      content: requestData.content,
      rating: rating,
      product_url: requestData.product_url,
      image_url: requestData.image_url,
      provider1: requestData.provider1 || null,
      provider2: requestData.provider2 || null,
      provider3: requestData.provider3 || null,
      store_name: requestData.store_name,
      store_url: requestData.store_url,
      review_fee: review_fee,
      reservation_amount: reservation_amount,
      daily_count: daily_count,
      search_keyword: requestData.search_keyword,
      purchase_cost: purchase_cost,
      guide: requestData.review_guide,
      updated_at: new Date().toISOString()
    };
    
    // 리뷰 정보 업데이트
    console.log('리뷰 업데이트 시작 - ID:', reviewId);
    console.log('업데이트 데이터:', JSON.stringify(updateData, null, 2));
    
    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select();
      
    if (error) {
      console.error('리뷰 업데이트 실패:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    console.log('리뷰 업데이트 성공');
    
    // 업데이트 후 데이터가 반환되지 않은 경우 직접 다시 조회
    let reviewData = data && data.length > 0 ? data[0] : null;
    
    if (!reviewData) {
      // 데이터가 없으면 해당 리뷰를 다시 조회
      const { data: fetchedReview, error: fetchError } = await supabase
        .from('reviews')
        .select('*')
        .eq('id', reviewId)
        .single();
        
      if (fetchError) {
        return NextResponse.json({ error: '리뷰 업데이트는 성공했으나 데이터를 가져오지 못했습니다.' }, { status: 500 });
      }
      
      reviewData = fetchedReview;
    }
    
    // provider1, provider2, provider3의 이름 정보 가져오기
    const reviewWithProviders = { ...reviewData };
    
    // provider1 정보 가져오기
    if (reviewData.provider1) {
      const { data: provider1Data, error: provider1Error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', reviewData.provider1)
        .single();
        
      if (!provider1Error && provider1Data) {
        reviewWithProviders.provider1_name = provider1Data.full_name;
      }
    }
    
    // provider2 정보 가져오기
    if (reviewData.provider2) {
      const { data: provider2Data, error: provider2Error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', reviewData.provider2)
        .single();
        
      if (!provider2Error && provider2Data) {
        reviewWithProviders.provider2_name = provider2Data.full_name;
      }
    }
    
    // provider3 정보 가져오기
    if (reviewData.provider3) {
      const { data: provider3Data, error: provider3Error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', reviewData.provider3)
        .single();
        
      if (!provider3Error && provider3Data) {
        reviewWithProviders.provider3_name = provider3Data.full_name;
      }
    }
    
    // 구좌 데이터 업데이트 처리 (새로운 파일만 업로드하여 기존 파일 목록에 추가)
    if (requestData.quotas_data && requestData.quotas_data.length > 0) {
      console.log('구좌 데이터 처리 시작:', requestData.quotas_data.length);
      
      for (const quotaData of requestData.quotas_data) {
        const slotNumber = quotaData.quotaNumber;
        const currentTime = new Date().toISOString();
        
        // 기존 슬롯 데이터 조회
        const { data: existingSlot, error: existingSlotError } = await supabase
          .from("slots")
          .select("*")
          .eq("review_id", id)
          .eq("slot_number", slotNumber)
          .single();

        let currentImages = existingSlot?.images || [];
        let currentReceipts = existingSlot?.receipts || [];
        let imagesUpdatedAt = existingSlot?.images_updated_at;
        let receiptsUpdatedAt = existingSlot?.receipts_updated_at;
        let hasNewImages = false;
        let hasNewReceipts = false;

        // 새로운 이미지 업로드
        if (quotaData.images && quotaData.images.length > 0) {
          console.log(`구좌 ${slotNumber}: 새 이미지 ${quotaData.images.length}개 업로드 시작`);
          
          for (const imageData of quotaData.images) {
            const uploadedUrl = await uploadBase64Image(
              imageData.base64,
              supabase,
              `slot-${slotNumber}-image`
            );
            if (uploadedUrl) {
              currentImages.push(uploadedUrl);
              hasNewImages = true;
              console.log(`구좌 ${slotNumber}: 이미지 업로드 성공 - ${uploadedUrl}`);
            }
          }
          
          if (hasNewImages) {
            imagesUpdatedAt = currentTime;
          }
        }

        // 새로운 영수증 업로드
        if (quotaData.receipts && quotaData.receipts.length > 0) {
          console.log(`구좌 ${slotNumber}: 새 영수증 ${quotaData.receipts.length}개 업로드 시작`);
          
          for (const receiptData of quotaData.receipts) {
            const uploadedUrl = await uploadBase64Image(
              receiptData.base64,
              supabase,
              `slot-${slotNumber}-receipt`
            );
            if (uploadedUrl) {
              currentReceipts.push(uploadedUrl);
              hasNewReceipts = true;
              console.log(`구좌 ${slotNumber}: 영수증 업로드 성공 - ${uploadedUrl}`);
            }
          }
          
          if (hasNewReceipts) {
            receiptsUpdatedAt = currentTime;
          }
        }

        // 새로운 파일이 하나라도 업로드 되었거나 기존 슬롯이 없는 경우에만 업데이트
        if (hasNewImages || hasNewReceipts || !existingSlot) {
          if (existingSlot) {
            // 기존 슬롯 업데이트
            const { error: updateError } = await supabase
              .from("slots")
              .update({
                images: currentImages,
                receipts: currentReceipts,
                images_updated_at: imagesUpdatedAt,
                receipts_updated_at: receiptsUpdatedAt,
              })
              .eq("review_id", id)
              .eq("slot_number", slotNumber);

            if (updateError) {
              console.error(`구좌 ${slotNumber} 업데이트 실패:`, updateError);
            } else {
              console.log(`구좌 ${slotNumber} 업데이트 성공`);
            }
          } else {
            // 새 슬롯 생성
            const slotData = {
              review_id: id,
              slot_number: slotNumber,
              images: currentImages,
              receipts: currentReceipts,
              images_updated_at: imagesUpdatedAt,
              receipts_updated_at: receiptsUpdatedAt,
            };

            const { error: insertError } = await supabase
              .from("slots")
              .insert(slotData);

            if (insertError) {
              console.error(`구좌 ${slotNumber} 생성 실패:`, insertError);
            } else {
              console.log(`구좌 ${slotNumber} 생성 성공`);
            }
          }
        } else {
          console.log(`구좌 ${slotNumber}: 새로운 파일이 없어 업데이트 건너뜀`);
        }
      }
    }

    // 최신 구좌 정보 다시 가져오기
    const { data: updatedSlotsData, error: updatedSlotsError } = await supabase
      .from('slots')
      .select('*')
      .eq('review_id', reviewId)
      .order('slot_number', { ascending: true });

    if (!updatedSlotsError && updatedSlotsData) {
      reviewWithProviders.slots = updatedSlotsData;
    }

    return NextResponse.json({ message: '리뷰가 성공적으로 업데이트되었습니다.', review: reviewWithProviders });
  } catch (error) {
    return NextResponse.json({ error: '리뷰 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

// base64 이미지를 스토리지에 업로드하는 함수
async function uploadBase64Image(
  base64Data: string,
  supabase: any,
  prefix: string = "slot"
): Promise<string | null> {
  try {
    // base64 형식에서 실제 바이너리 데이터로 변환
    const base64WithoutPrefix = base64Data.split(",")[1];
    const buffer = Buffer.from(base64WithoutPrefix, "base64");

    // 파일 확장자 추출 (데이터 URL에서)
    const mimeType = base64Data.split(";")[0].split(":")[1];
    const extension = mimeType.split("/")[1];

    // Supabase Storage에 업로드
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
    const { data, error } = await supabase.storage
      .from("reviews")
      .upload(`public/${fileName}`, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("이미지 업로드 오류:", error);
      return null;
    }

    // 업로드된 이미지 URL 반환
    const { data: urlData } = supabase.storage
      .from("reviews")
      .getPublicUrl(`public/${fileName}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error("base64 이미지 업로드 처리 오류:", error);
    return null;
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const reviewId = id;
    
    // 먼저 리뷰가 존재하는지 확인
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('id', reviewId)
      .single();
      
    if (checkError || !existingReview) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    // 관련 참여자 데이터 삭제
    await supabase
      .from('review_participants')
      .delete()
      .eq('review_id', reviewId);
    
    // 관련 슬롯(구좌) 데이터 삭제
    await supabase
      .from('slots')
      .delete()
      .eq('review_id', reviewId);
    
    // 일별 할당량 데이터 삭제
    await supabase
      .from('slot_daily_quotas')
      .delete()
      .eq('review_id', reviewId);
    
    // 리뷰 삭제
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);
      
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ message: '리뷰가 성공적으로 삭제되었습니다.' });
  } catch (error) {
    return NextResponse.json({ error: '리뷰 삭제 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 