import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError) {
    return NextResponse.json({ message: `사용자 정보를 불러오는데 실패했습니다: ${userError.message}` }, { status: 500 });
  }

  if (!user) {
    return NextResponse.json({ message: '인증되지 않은 사용자입니다.' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('searchTerm') || '';
  const searchCategory = searchParams.get('searchCategory') || 'title';
  const startDate = searchParams.get('startDate') || '';
  const endDate = searchParams.get('endDate') || '';
  const currentPage = parseInt(searchParams.get('currentPage') || '1', 10);
  const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);

  let query = supabase
    .from('user_activities') // 적절한 테이블 이름으로 변경해주세요
    .select('*', { count: 'exact' })
    .eq('user_id', user.id);

  if (searchTerm) {
    if (searchCategory === 'title') {
      query = query.ilike('title', `%${searchTerm}%`);
    } else if (searchCategory === 'type') {
      query = query.eq('type', searchTerm);
    } else if (searchCategory === 'status') {
      query = query.eq('status', searchTerm);
    }
  }

  if (startDate) {
    query = query.gte('created_at', startDate);
  }

  if (endDate) {
    query = query.lte('created_at', `${endDate}T23:59:59Z`);
  }

  const from = (currentPage - 1) * pageSize;
  const to = currentPage * pageSize - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    return NextResponse.json({ message: `활동 내역을 불러오는데 실패했습니다: ${error.message}` }, { status: 500 });
  }

  return NextResponse.json({
    activities: data || [],
    totalCount: count || 0,
    totalPages: Math.ceil((count || 0) / pageSize),
  });
} 