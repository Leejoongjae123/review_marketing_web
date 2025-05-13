import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    
    // 현재 인증된 사용자 가져오기
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: '인증된 사용자가 아닙니다' },
        { status: 401 }
      );
    }
    
    // 요청 본문에서 카카오 정보 가져오기
    const { kakao_id, phone_number, nickname } = await request.json();
    
    if (!kakao_id || !phone_number) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }
    
    // 사용자 메타데이터 업데이트
    const { error: updateError } = await supabase.auth.updateUser({
      data: {
        kakao_id,
        phone_number,
        nickname: nickname || user.user_metadata?.name || '사용자',
        provider: 'kakao',
        updated_at: new Date().toISOString()
      }
    });
    
    if (updateError) {
      return NextResponse.json(
        { error: '사용자 정보 업데이트 실패', details: updateError.message },
        { status: 500 }
      );
    }
    
    // 프로필 테이블 확인 및 업데이트
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (existingProfile) {
      // 기존 프로필 업데이트
      const { error: profileUpdateError } = await supabase
        .from('profiles')
        .update({
          phone_number,
          kakao_id: kakao_id.toString(),
          nickname: nickname || existingProfile.nickname || user.user_metadata?.name || '사용자',
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (profileUpdateError) {
        return NextResponse.json(
          { error: '프로필 업데이트 실패', details: profileUpdateError.message },
          { status: 500 }
        );
      }
    } else {
      // 새 프로필 생성
      const { error: insertError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email,
          phone_number,
          kakao_id: kakao_id.toString(),
          nickname: nickname || user.user_metadata?.name || '사용자',
          updated_at: new Date().toISOString()
        });
      
      if (insertError) {
        return NextResponse.json(
          { error: '프로필 생성 실패', details: insertError.message },
          { status: 500 }
        );
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      message: '카카오 정보가 성공적으로 등록되었습니다',
      user_id: user.id,
      phone_number
    });
    
  } catch (error: any) {
    console.error('Kakao registration error:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다', details: error.message },
      { status: 500 }
    );
  }
} 