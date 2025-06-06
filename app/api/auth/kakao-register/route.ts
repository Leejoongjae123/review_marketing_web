import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// 전화번호를 한국 형식으로 변환하는 함수
function formatPhoneNumber(phoneNumber: string): string {
  if (!phoneNumber) return '';
  
  // +82로 시작하는 경우 제거하고 0으로 시작하도록 변환
  let cleanNumber = phoneNumber.replace(/\D/g, ''); // 숫자만 추출
  
  if (cleanNumber.startsWith('82')) {
    cleanNumber = '0' + cleanNumber.substring(2);
  }
  
  // 11자리 숫자인 경우 010-XXXX-XXXX 형식으로 변환
  if (cleanNumber.length === 11 && cleanNumber.startsWith('010')) {
    const first = cleanNumber.slice(0, 3);
    const middle = cleanNumber.slice(3, 7);
    const last = cleanNumber.slice(7, 11);
    return `${first}-${middle}-${last}`;
  }
  
  // 다른 형식인 경우 원본 반환 (하이픈 제거된 숫자만)
  return cleanNumber;
}

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
    const { kakao_id, phone_number: rawPhoneNumber, nickname } = await request.json();
    
    if (!kakao_id || !rawPhoneNumber) {
      return NextResponse.json(
        { error: '필수 정보가 누락되었습니다' },
        { status: 400 }
      );
    }
    
    // 전화번호 형식 변환
    const phone_number = formatPhoneNumber(rawPhoneNumber);
    
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