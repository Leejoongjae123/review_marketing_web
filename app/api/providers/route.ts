import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get('query') || '';
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json({ error: "환경 변수가 설정되지 않았습니다." }, { status: 500 });
  }
  
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  
  let dbQuery = supabase
    .from("profiles")
    .select("id, full_name, company_name, email")
    .eq("role", "provider")
    .eq("status", "active");
    
  if (query) {
    dbQuery = dbQuery.or(`company_name.ilike.%${query}%,full_name.ilike.%${query}%,email.ilike.%${query}%`);
  }
  
  const { data, error } = await dbQuery;
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ providers: data });
} 