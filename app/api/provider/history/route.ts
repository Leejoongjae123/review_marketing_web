import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  
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
    // 현재 로그인한 광고주 정보 가져오기
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: '인증되지 않은 사용자입니다.' }, { status: 401 })
    }

    // 광고주 ID 가져오기
    const providerId = user.id
    
    // 기본 쿼리 설정 - 리뷰 정보와 함께 조회
    const { data: reviewsData, error: reviewsError } = await supabase
      .from('reviews')
      .select('id')
      .or(`provider1.eq.${providerId},provider2.eq.${providerId},provider3.eq.${providerId}`)
    
    if (reviewsError) {
      throw reviewsError
    }
    
    if (!reviewsData || reviewsData.length === 0) {
      return NextResponse.json({
        data: [],
        count: 0,
        page,
        pageSize,
        totalPages: 0
      })
    }
    
    // 리뷰 ID 배열 생성
    const reviewIds = reviewsData.map(review => review.id)
    
    // 이 리뷰 ID에 참여한 사용자 데이터 조회
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
          provider1,
          provider2,
          provider3
        )
      `, { count: 'exact' })
      .in('review_id', reviewIds)
    
    // 검색어가 있는 경우 필터 추가
    if (searchTerm) {
      if (searchCategory === 'name') {
        query = query.ilike('name', `%${searchTerm}%`)
      } else if (searchCategory === 'phone') {
        query = query.ilike('phone', `%${searchTerm}%`)
      } else if (searchCategory === 'email') {
        query = query.ilike('login_account', `%${searchTerm}%`)
      } else if (searchCategory === 'eventAccount') {
        query = query.ilike('event_account', `%${searchTerm}%`)
      }
    }
    
    // 범위 지정하여 데이터 가져오기
    const { data, count, error } = await query
      .order('created_at', { ascending: false })
      .range(start, end)
    
    if (error) {
      throw error
    }
    
    return NextResponse.json({ 
      data, 
      count: count || 0, 
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize)
    })
  } catch (error) {
    console.error('Error fetching participants:', error)
    return NextResponse.json({ error: '참가자 데이터를 불러오는 중 오류가 발생했습니다.' }, { status: 500 })
  }
} 