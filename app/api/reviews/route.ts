import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchCategory = searchParams.get('searchCategory') || '';
  const searchTerm = searchParams.get('searchTerm') || '';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const page = parseInt(searchParams.get('page') || '1');
  const pageSize = parseInt(searchParams.get('pageSize') || '10');

  const supabase = await createClient();
  
  try {
    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' });

    // 검색어 필터링
    if (searchTerm) {
      query = query.ilike(searchCategory, `%${searchTerm}%`);
    }

    // 날짜 필터링
    if (startDate) {
      query = query.gte('start_date', startDate);
    }
    if (endDate) {
      query = query.lte('end_date', endDate);
    }

    // 페이지네이션
    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data: reviews, count, error } = await query;

    if (error) {
      throw error;
    }

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      reviews,
      totalCount,
      totalPages,
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: '리뷰를 불러오는데 실패했습니다.' },
      { status: 500 }
    );
  }
}

// 이미지 파일을 슈파베이스 스토리지에 업로드하는 함수
async function uploadImage(file: File, supabase: any): Promise<string | null> {
  try {
    // 파일 형식 확인
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `reviews/${fileName}`;
    
    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);
    
    // 슈파베이스 스토리지에 업로드
    const { data, error } = await supabase.storage
      .from('reviews')
      .upload(filePath, fileData, {
        contentType: file.type,
        upsert: false
      });
    
    if (error) {
      console.error('이미지 업로드 오류:', error);
      return null;
    }
    
    // 업로드된 이미지의 공개 URL 가져오기
    const { data: { publicUrl } } = supabase.storage
      .from('reviews')
      .getPublicUrl(filePath);
    
    return publicUrl;
  } catch (error) {
    console.error('이미지 업로드 처리 오류:', error);
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const formData = await request.formData();
    
    // 리뷰 데이터 추출
    const reviewData = {
      platform: formData.get('platform') as string,
      product_name: formData.get('productName') as string,
      option_name: formData.get('optionName') as string,
      price: parseInt(formData.get('price') as string) || 0,
      shipping_fee: parseInt(formData.get('shippingFee') as string) || 0,
      seller: formData.get('seller') as string,
      participants: parseInt(formData.get('participants') as string) || 0,
      status: formData.get('status') as string,
      start_date: formData.get('startDate') ? new Date(formData.get('startDate') as string).toISOString() : null,
      end_date: formData.get('endDate') ? new Date(formData.get('endDate') as string).toISOString() : null,
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      rating: Math.min(Math.max(parseInt(formData.get('rating') as string) || 3, 1), 5),
      product_url: formData.get('productUrl') as string,
    };

    // 필수 필드 확인
    if (!reviewData.platform || !reviewData.product_name || !reviewData.title || !reviewData.content || !reviewData.rating) {
      return NextResponse.json(
        { error: '필수 항목이 누락되었습니다. (플랫폼, 제품명, 제목, 내용, 평점)' },
        { status: 400 }
      );
    }

    // 이미지 처리
    const imageFiles = formData.getAll('images') as File[];
    let image_url = null;
    
    if (imageFiles && imageFiles.length > 0) {
      // 첫 번째 이미지만 대표 이미지로 저장
      image_url = await uploadImage(imageFiles[0], supabase);
    }
    
    // 리뷰 데이터 저장
    const { data: reviewResult, error: reviewError } = await supabase
      .from('reviews')
      .insert({
        ...reviewData,
        image_url
      })
      .select()
      .single();
    
    if (reviewError) {
      console.error('리뷰 저장 실패:', reviewError);
      return NextResponse.json(
        { error: '리뷰 저장에 실패했습니다.', details: reviewError.message },
        { status: 500 }
      );
    }

    // 참여자 데이터 처리
    const participantsData = formData.get('participants_data');
    let participantsProcessed = false;
    
    if (participantsData) {
      try {
        const participants = JSON.parse(participantsData as string);
        
        if (participants && participants.length > 0) {
          // 참여자 정보 처리 및 이미지 업로드
          const participantsToInsert = await Promise.all(
            participants.map(async (participant: any) => {
              let reviewImageUrl = null;
              
              // 리뷰 이미지 URL이 있고 base64 또는 data URL 형식이라면 업로드 처리
              if (participant.reviewImage && (
                participant.reviewImage.startsWith('data:') || 
                participant.reviewImage.startsWith('blob:')
              )) {
                // 이 경우 프론트엔드에서 직접 파일 업로드 처리가 필요함
                // 여기서는 임시로 null로 설정하고 추후 파일 업로드 로직 구현 필요
                reviewImageUrl = null;
              } else {
                // 이미 URL이 있는 경우 그대로 사용
                reviewImageUrl = participant.reviewImage || null;
              }
              
              return {
                review_id: reviewResult.id,
                name: participant.name,
                phone: participant.phone,
                login_account: participant.loginAccount,
                event_account: participant.eventAccount,
                nickname: participant.nickname,
                review_image: reviewImageUrl
              };
            })
          );
          
          const { error: participantsError } = await supabase
            .from('review_participants')
            .insert(participantsToInsert);
          
          if (participantsError) {
            console.error('참여자 저장 실패:', participantsError);
            return NextResponse.json(
              { 
                success: true, 
                data: reviewResult, 
                warning: '리뷰는 저장되었지만 참여자 정보 저장에 실패했습니다: ' + participantsError.message 
              }
            );
          }
          
          participantsProcessed = true;
        }
      } catch (error) {
        console.error('참여자 데이터 처리 오류:', error);
        return NextResponse.json(
          { 
            success: true, 
            data: reviewResult, 
            warning: '리뷰는 저장되었지만 참여자 정보 처리 중 오류가 발생했습니다.' 
          }
        );
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      data: reviewResult,
      participants_processed: participantsProcessed
    });
  } catch (error) {
    console.error('오류:', error);
    return NextResponse.json(
      { error: '요청 처리 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 