import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export const dynamic = 'force-dynamic';

// DELETE 요청 (특정 응모 이력 삭제)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  

  if (!id) {
    return NextResponse.json({ message: 'ID가 제공되지 않았습니다.' }, { status: 400 });
  }

  try {
    const { error } = await supabase
      .from('review_participants')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ message: '응모 이력 삭제에 실패했습니다.', error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: '응모 이력이 성공적으로 삭제되었습니다.' });

  } catch (e) {
    return NextResponse.json({ message: '서버 오류가 발생했습니다.', error: (e as Error).message }, { status: 500 });
  }
}

// GET 요청 (특정 응모 이력 조회)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();
  
  try {
    const { data, error } = await supabase
      .from('review_participants')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) {
      return NextResponse.json({ message: '응모 이력 조회에 실패했습니다.', error: error.message }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (e) {
    return NextResponse.json({ message: '서버 오류가 발생했습니다.', error: (e as Error).message }, { status: 500 });
  }
}

// GET, PUT, PATCH 요청은 필요에 따라 추가 구현
// export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
//   // ... 특정 ID의 데이터 조회 로직
//   const { id } = params;
//   return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
// }

// export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
//   // ... 특정 ID의 데이터 수정 로직
//   const { id } = params;
//   return NextResponse.json({ message: 'Not implemented' }, { status: 501 });
// } 