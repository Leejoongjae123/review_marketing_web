import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 서버 컴포넌트에서 Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL과 ANON KEY가 설정되지 않았습니다.');
    }
    
    const supabase = await createClient(supabaseUrl, supabaseKey);
    const { id } = await context.params;
    const reviewId = id;
    // 리뷰 정보 가져오기
    const { data: review, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();
      
    if (error) {
      console.error('리뷰 조회 데이터베이스 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!review) {
      return NextResponse.json({ error: '리뷰를 찾을 수 없습니다.' }, { status: 404 });
    }
    
    return NextResponse.json({ review });
  } catch (error) {
    console.error('리뷰 조회 오류:', error);
    return NextResponse.json({ error: '리뷰 조회 중 오류가 발생했습니다.' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // 서버 컴포넌트에서 Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL과 ANON KEY가 설정되지 않았습니다.');
    }
    
    const supabase = await createClient(supabaseUrl, supabaseKey);
    const { id } = await context.params;
    const reviewId = id;
    console.log('리뷰 ID:', reviewId);
    
    // 요청 본문 파싱
    const requestData = await request.json();
    console.log('수정 요청 데이터:', JSON.stringify(requestData));
    
    // 필수 필드 검증
    if (!requestData.platform || !requestData.product_name || !requestData.title) {
      return NextResponse.json({ error: '필수 필드가 누락되었습니다.' }, { status: 400 });
    }
    
    // 숫자 형식 변환
    const price = requestData.price ? (isNaN(parseInt(requestData.price)) ? null : parseInt(requestData.price)) : null;
    const shipping_fee = requestData.shipping_fee ? (isNaN(parseInt(requestData.shipping_fee)) ? null : parseInt(requestData.shipping_fee)) : null;
    const participants = requestData.participants ? (isNaN(parseInt(requestData.participants)) ? null : parseInt(requestData.participants)) : null;
    const rating = requestData.rating ? (isNaN(parseInt(requestData.rating)) ? null : parseInt(requestData.rating)) : null;
    
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
      updated_at: new Date().toISOString()
    };
    
    console.log('수정할 데이터:', JSON.stringify(updateData));
    
    // 리뷰 정보 업데이트
    const { data, error } = await supabase
      .from('reviews')
      .update(updateData)
      .eq('id', reviewId)
      .select();
      
    if (error) {
      console.error('리뷰 업데이트 데이터베이스 오류:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    console.log('업데이트 성공:', JSON.stringify(data));
    
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
        console.error('리뷰 재조회 오류:', fetchError);
        return NextResponse.json({ error: '리뷰 업데이트는 성공했으나 데이터를 가져오지 못했습니다.' }, { status: 500 });
      }
      
      reviewData = fetchedReview;
    }
    
    return NextResponse.json({ message: '리뷰가 성공적으로 업데이트되었습니다.', review: reviewData });
  } catch (error) {
    console.error('리뷰 업데이트 오류:', error);
    return NextResponse.json({ error: '리뷰 업데이트 중 오류가 발생했습니다.' }, { status: 500 });
  }
} 