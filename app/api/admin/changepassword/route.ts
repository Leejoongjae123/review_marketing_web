import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const service_role_key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  if (!supabase_url || !service_role_key) {
    return NextResponse.json({ error: '환경 변수가 설정되지 않았습니다.' }, { status: 500 });
  }
  const supabase = createClient(supabase_url, service_role_key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  const { newPassword, userId } = await request.json();

  if (!newPassword) {
    return NextResponse.json({ error: '새 비밀번호를 입력해주세요.' }, { status: 400 });
  }

  const { data, error } = await supabase.auth.admin.updateUserById(userId, { password: newPassword });

  if (error) {
    return NextResponse.json({ error: '비밀번호 변경에 실패했습니다.' }, { status: 500 });
  }

  return NextResponse.json({ message: '비밀번호가 성공적으로 변경되었습니다.' });
} 