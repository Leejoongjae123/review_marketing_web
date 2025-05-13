import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createClient(cookieStore);
    const { review_id, event_account, ...otherData } = await request.json();

    // 중복 체크 - event_account와 review_id 모두 일치하는지 확인
    const { data: existingParticipant, error: checkError } = await supabase
      .from('review_participants')
      .select('id')
      .eq('review_id', review_id)
      .eq('event_account', event_account)
      .single();

    if (existingParticipant) {
      return NextResponse.json(
        { error: '이미 해당 리뷰에 참여 신청하셨습니다.' },
        { status: 400 }
      );
    }

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // 새 참여자 등록
    const { data, error } = await supabase
      .from('review_participants')
      .insert([
        {
          review_id,
          event_account,
          ...otherData
        }
      ])
      .select()
      .single();

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        return NextResponse.json(
          { error: '이미 해당 리뷰에 참여 신청하셨습니다.' },
          { status: 400 }
        );
      }
      throw error;
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: '참여자 등록 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 