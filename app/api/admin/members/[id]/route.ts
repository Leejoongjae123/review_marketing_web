import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';


// 특정 회원 정보 조회
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }
    
    // 관리자 권한 확인
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!adminCheck || adminCheck.role !== 'master') {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 특정 회원 정보 가져오기
    const { data: member, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: '회원 정보를 가져오는데 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }
    
    if (!member) {
      return NextResponse.json(
        { error: '회원을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ member });
  } catch (error: any) {
    console.error('회원 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

// 특정 회원 정보 수정
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }
    
    // 관리자 권한 확인
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!adminCheck || adminCheck.role !== 'master') {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 요청 본문에서 업데이트할 데이터 가져오기
    const updateData = await request.json();
    
    // 회원 정보 업데이트
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: '회원 정보 업데이트에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, member: data });
  } catch (error: any) {
    console.error('회원 정보 업데이트 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

// 회원 삭제 (비활성화)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }
    
    // 관리자 권한 확인
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!adminCheck || adminCheck.role !== 'master') {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 회원 정보를 비활성화 (완전히 삭제하지 않고 status만 변경)
    const { data, error } = await supabase
      .from('profiles')
      .update({
        status: 'inactive',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: '회원 비활성화에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, message: '회원이 비활성화되었습니다.' });
  } catch (error: any) {
    console.error('회원 비활성화 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }): Promise<NextResponse> {
  const supabase = await createClient();
  const { id } = await params;
  const { newPassword } = await request.json();

  if (!newPassword) {
    return NextResponse.json({ error: '새 비밀번호를 입력해주세요.' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.updateUserById(id, { password: newPassword });

  if (error) {
    return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
} 