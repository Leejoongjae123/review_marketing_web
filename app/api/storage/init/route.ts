import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

// 스토리지 버킷을 초기화하는 함수
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 'reviews' 버킷이 존재하는지 확인
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('버킷 목록 조회 실패:', listError);
      return NextResponse.json(
        { error: '스토리지 버킷 조회에 실패했습니다.', details: listError.message },
        { status: 500 }
      );
    }
    
    const reviewsBucketExists = buckets.some(bucket => bucket.name === 'reviews');
    
    if (!reviewsBucketExists) {
      // 'reviews' 버킷 생성
      const { data, error: createError } = await supabase.storage.createBucket('reviews', {
        public: true, // 공개 액세스 허용
        fileSizeLimit: 10 * 1024 * 1024, // 10MB 제한
      });
      
      if (createError) {
        console.error('reviews 버킷 생성 실패:', createError);
        return NextResponse.json(
          { error: 'reviews 버킷 생성에 실패했습니다.', details: createError.message },
          { status: 500 }
        );
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'reviews 버킷이 생성되었습니다.',
        data
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'reviews 버킷이 이미 존재합니다.'
    });
  } catch (error) {
    console.error('스토리지 초기화 오류:', error);
    return NextResponse.json(
      { error: '스토리지 초기화 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

// 버킷 정보 조회
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('버킷 목록 조회 실패:', listError);
      return NextResponse.json(
        { error: '스토리지 버킷 조회에 실패했습니다.', details: listError.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      buckets
    });
  } catch (error) {
    console.error('버킷 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '버킷 정보 조회 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 