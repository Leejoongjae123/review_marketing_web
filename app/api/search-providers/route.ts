import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import {createClient} from '@/utils/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    
    // 쿼리가 없는 경우 빈 배열 반환
    if (!query || query.trim() === '') {
      return NextResponse.json({ data: [] })
    }

    const searchTerm = query.trim().toLowerCase()
    console.log('검색어:', searchTerm)

    // profiles 테이블에서 role이 'provider'인 사용자 검색
    // id, full_name, email, company_name 필드를 반환하도록 명확히 지정
    // full_name, company_name, email 모든 필드에서 검색
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, company_name')
      .eq('role', 'provider')
      .or(`full_name.ilike.%${searchTerm}%,company_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .limit(10)
    
    if (error) {
      console.log('광고주 검색 오류:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    // Provider 인터페이스에 맞게 데이터 구조 확인
    // null 또는 undefined인 email, company_name은 빈 문자열로 대체
    const formattedData = data?.map(provider => ({
      id: provider.id,
      full_name: provider.full_name,
      email: provider.email || '',
      company_name: provider.company_name || ''
    })) || []
    
    console.log('검색 결과:', formattedData)
    return NextResponse.json({ data: formattedData })
  } catch (error) {
    console.log('서버 오류:', error)
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 })
  }
} 