import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const { email, password, companyName, staffName, fullName, phone } = await req.json();
  if (!email || !password || !companyName || !staffName || !fullName || !phone) {
    return NextResponse.json({ error: "모든 필드를 입력해주세요." }, { status: 400 });
  }
  const supabase_url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const service_role_key = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
  console.log("supabase_url", supabase_url)
  console.log("service_role_key", service_role_key)

  if (!supabase_url || !service_role_key) {
    return NextResponse.json({ error: "환경 변수가 설정되지 않았습니다." }, { status: 500 });
  }

  const supabase = createClient(supabase_url, service_role_key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
  // Access auth admin api
  const adminAuthClient = supabase.auth.admin


  // 회원가입
  const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (signUpError || !signUpData.user) {
    return NextResponse.json({ error: signUpError?.message || "회원가입 실패" }, { status: 400 });
  }

  // profiles 테이블에 회사명, 담당자 이름 업데이트
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      company_name: companyName,
      staff_name: staffName,
      full_name: fullName,
      phone: phone,
      status: "active",
      role: "provider",
      email: email,
    })
    .eq("id", signUpData.user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
} 