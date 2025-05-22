import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  
  const cookieStore = cookies()
  const supabase = await createClient()
  const url = new URL(request.url)
  
  // 검색 파라미터 추출
  const searchTerm = url.searchParams.get('searchTerm') || ''
  const searchCategory = url.searchParams.get('searchCategory') || 'name'
  const page = parseInt(url.searchParams.get('page') || '1')
  const pageSize = parseInt(url.searchParams.get('pageSize') || '10')
  
  // 페이징을 위한 계산
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1
  
  try {
    // 현재 로그인한 사용자 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    }
    
    // 기본 쿼리 설정
    let query = supabase
      .from('review_participants')
      .select(`
        *,
        reviews:review_id (
          id,
          title,
          platform,
          product_name,
          option_name,
          price,
          shipping_fee,
          seller,
          period,
          image_url,
          product_url
        )
      `, { count: 'exact' })
      .eq('reviewer_id', user.id) // 현재 사용자 ID와 일치하는 항목만 가져오기
    
    // 검색어가 있는 경우 필터 추가
    if (searchTerm) {
      if (searchCategory === 'product_name') {
        query = query.ilike('reviews.product_name', `%${searchTerm}%`)
      } else if (searchCategory === 'platform') {
        query = query.ilike('reviews.platform', `%${searchTerm}%`)
      } else if (searchCategory === 'event_account') {
        query = query.ilike('event_account', `%${searchTerm}%`)
      }
    }
    
    // 범위 지정하여 데이터 가져오기
    const { data: participants, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ 
      participants, 
      totalCount: count || 0, 
      currentPage: page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json({ error: '참가자 데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 