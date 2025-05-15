import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

// 모든 회원 정보 조회 with 페이지네이션
export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    
    // 검색 필터 파라미터
    const searchTerm = searchParams.get('searchTerm') || '';
    const searchCategory = searchParams.get('searchCategory') || 'full_name';
    const role = searchParams.get('role') || '';
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }
    
    // 관리자 권한 확인
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!adminCheck || adminCheck.role !== 'master') {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 기본 쿼리 설정
    let query = supabase
      .from('profiles')
      .select('*', { count: 'exact' });
    
    // 검색 필터 적용
    if (searchTerm) {
      const searchValue = `%${searchTerm}%`;
      query = query.ilike(searchCategory, searchValue);
    }
    
    // 역할 필터 적용
    if (role === 'admin') {
      query = query.in('role', ['admin', 'master']);
    } else if (role === 'provider') {
      query = query.eq('role', 'provider');
    } else if (role === 'client') {
      query = query.or(`role.is.null,role.eq.client`);
    } else if (role && role !== 'all') {
      query = query.eq('role', role);
    }
    
    // 페이지네이션과 정렬 적용
    const { data: profiles, error, count } = await query
      .order('updated_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      return NextResponse.json(
        { error: '회원 정보를 가져오는데 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }
    
    // 역할별 회원 수 카운트를 위한 쿼리
    const { count: adminCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .in('role', ['admin', 'master']);
      
    const { count: providerCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'provider');
      
    const { count: clientCount } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .or(`role.is.null,role.eq.client`);
    
    const roleCounts = {
      admin: adminCount || 0,
      provider: providerCount || 0,
      client: clientCount || 0,
      total: (adminCount || 0) + (providerCount || 0) + (clientCount || 0)
    };
    
    // 결과를 포맷팅하여 반환
    return NextResponse.json({
      members: profiles,
      pagination: {
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      },
      counts: roleCounts
    });
  } catch (error: any) {
    console.error('회원 정보 조회 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
}

// 회원 정보 수정
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();
    
    // 관리자 권한 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증되지 않은 사용자입니다.' },
        { status: 401 }
      );
    }
    
    // 관리자 권한 확인
    const { data: adminCheck } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
      
    if (!adminCheck || adminCheck.role !== 'master') {
      return NextResponse.json(
        { error: '관리자 권한이 없습니다.' },
        { status: 403 }
      );
    }
    
    // 요청 본문에서 회원 정보 가져오기
    const { id, ...updateData } = await request.json();
    
    if (!id) {
      return NextResponse.json(
        { error: '회원 ID가 필요합니다.' },
        { status: 400 }
      );
    }
    
    // 회원 정보 업데이트
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json(
        { error: '회원 정보 업데이트에 실패했습니다.', details: error.message },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true, member: data });
  } catch (error: any) {
    console.error('회원 정보 업데이트 오류:', error);
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다.', details: error.message },
      { status: 500 }
    );
  }
} 