import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 현재 로그인한 사용자 정보 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // 사용자 프로필 정보 가져오기 (추가 정보가 필요할 경우)
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error("프로필 조회 오류:", profileError);
    }
    
    // 기본 사용자 정보와 프로필 정보 합치기
    const user = {
      id: session.user.id,
      email: session.user.email,
      name: profile?.full_name || session.user.email?.split('@')[0] || "사용자",
      role: profile?.role || "user",
      ...profile
    };
    
    return NextResponse.json({
      user,
      session
    });
    
  } catch (error) {
    console.error("사용자 정보 조회 중 오류:", error);
    return NextResponse.json(
      { error: "사용자 정보를 가져오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ message: `사용자 정보를 불러오는데 실패했습니다: ${userError.message}` }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ message: '인증되지 않은 사용자입니다.' }, { status: 401 });
  }

  const { bank_name, account_number, phone, citizen_no } = await request.json();

  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      bank_name,
      account_number,
      phone,
      citizen_no,
    })
    .eq('id', user.id);

  if (updateError) {
    return NextResponse.json({ message: `정보 저장에 실패했습니다: ${updateError.message}` }, { status: 500 });
  }

  return NextResponse.json({ message: '정보가 성공적으로 저장되었습니다.' });
} 