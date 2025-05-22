import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  const reviewId = id;

  if (!reviewId) {
    return NextResponse.json({ message: '리뷰 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    // TODO: 광고주(provider)가 자신의 리뷰만 삭제할 수 있도록 권한 확인 로직 추가 필요
    // 예: 현재 로그인한 광고주의 ID와 리뷰의 provider_id를 비교
    // const { data: { user } } = await supabase.auth.getUser();
    // if (!user) {
    //   return NextResponse.json({ message: '인증되지 않은 사용자입니다.' }, { status: 401 });
    // }
    // 
    // const { data: reviewData, error: reviewError } = await supabase
    //   .from('reviews')
    //   .select('provider_id')
    //   .eq('id', reviewId)
    //   .single();
    // 
    // if (reviewError || !reviewData) {
    //   return NextResponse.json({ message: '리뷰를 찾을 수 없거나 조회 중 오류가 발생했습니다.' }, { status: 404 });
    // }
    // 
    // if (reviewData.provider_id !== user.id) { // user.id가 provider_id라고 가정
    //   return NextResponse.json({ message: '리뷰를 삭제할 권한이 없습니다.' }, { status: 403 });
    // }

    const { error } = await supabase
      .from('reviews') // 'reviews' 테이블을 가정합니다.
      .delete()
      .eq('id', reviewId);

    if (error) {
      return NextResponse.json({ message: '리뷰 삭제 중 오류가 발생했습니다.', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '리뷰가 성공적으로 삭제되었습니다.' });

  } catch (error) {
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    return NextResponse.json({ message: '서버 오류가 발생했습니다.', error: errorMessage }, { status: 500 });
  }
} 