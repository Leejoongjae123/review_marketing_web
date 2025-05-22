import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  if (!id) {
    return NextResponse.json(
      { error: '삭제할 참가자 ID가 제공되지 않았습니다.' },
      { status: 400 }
    );
  }

  try {
    const supabase = await createClient();

    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 });
    }

    // 삭제하려는 항목이 현재 사용자의 것인지 확인
    const { data: participant, error: fetchError } = await supabase
      .from('review_participants')
      .select('*')
      .eq('id', id)
      .eq('reviewer_id', user.id)
      .single();
    
    if (fetchError || !participant) {
      return NextResponse.json(
        { error: '해당 항목을 찾을 수 없거나 삭제 권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 사용자 확인 후 삭제 진행
    const { error } = await supabase
      .from('review_participants')
      .delete()
      .eq('id', id)
      .eq('reviewer_id', user.id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting participant:', error);
    return NextResponse.json(
      { error: '참가자 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 