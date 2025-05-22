import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // 스토리지 버킷 존재 여부 확인
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();
    
    if (bucketError) {
      throw bucketError;
    }
    
    // review-images 버킷이 없으면 생성
    const reviewImagesBucket = buckets.find(bucket => bucket.name === 'review-images');
    
    if (!reviewImagesBucket) {
      const { error } = await supabase
        .storage
        .createBucket('review-images', {
          public: true, // 공개 접근 허용
          fileSizeLimit: 10485760, // 10MB
        });
      
      if (error) {
        throw error;
      }
    }
    
    return NextResponse.json({ success: true, message: 'Storage buckets checked' });
  } catch (error) {
    console.log('스토리지 버킷 확인 중 오류:', error);
    return NextResponse.json(
      { error: '스토리지 버킷 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 