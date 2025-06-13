import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { phone_number, subject, message } = await request.json();

    if (!phone_number || !subject || !message) {
      return NextResponse.json(
        { error: '필수 파라미터가 누락되었습니다.' },
        { status: 400 }
      );
    }

    // 전화번호에서 특수문자 제거 (하이픈, 공백 등)
    const cleanPhoneNumber = phone_number.replace(/[^0-9]/g, '');

    // 외부 알림톡 API 호출
    const response = await fetch('https://qjjrulaq0c.execute-api.ap-northeast-2.amazonaws.com/send-alimtalk', {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_number: cleanPhoneNumber,
        subject,
        message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: '알림톡 전송에 실패했습니다.', details: result },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: '알림톡이 성공적으로 전송되었습니다.',
      data: result,
    });

  } catch (error) {
    return NextResponse.json(
      { error: '알림톡 전송 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
} 