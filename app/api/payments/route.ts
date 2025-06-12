import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { PaymentResponse } from '@/app/admin/payment/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    const searchCategory = searchParams.get('searchCategory') || 'name';
    const searchTerm = searchParams.get('searchTerm') || '';
    const paymentStatus = searchParams.get('paymentStatus') || 'all';
    const startDate = searchParams.get('startDate') || '';
    const endDate = searchParams.get('endDate') || '';
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    const offset = (page - 1) * pageSize;
    
        // 기본 쿼리 구성
    let query = supabase
      .from('slot_submissions')
      .select(`
        *,
        reviews(title, product_name, platform)
      `, { count: 'exact' })
      .eq('approval', true); // 승인된 제출만
    
    // 검색 조건 적용
    if (searchTerm) {
      if (searchCategory === 'name') {
        query = query.ilike('name', `%${searchTerm}%`);
      } else if (searchCategory === 'phone') {
        query = query.ilike('phone', `%${searchTerm}%`);
      } else if (searchCategory === 'nickname') {
        query = query.ilike('nickname', `%${searchTerm}%`);
      }
    }
    
    // 상태 필터링
    if (paymentStatus !== 'all') {
      query = query.eq('payment_status', paymentStatus);
    }
    
    // 날짜 범위 필터링
    if (startDate) {
      query = query.gte('payment_created_at', startDate);
    }
    if (endDate) {
      query = query.lte('payment_created_at', endDate);
    }
    
    // 정렬 및 페이징
    const { data, error, count } = await query
      .order('payment_created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);
    
    if (error) {
      return NextResponse.json(
        { error: '데이터를 불러오는데 실패했습니다' },
        { status: 500 }
      );
    }
    
    // 데이터 변환
    const payments = data?.map((item: any) => ({
      id: item.id,
      slot_id: item.slot_id,
      user_id: item.user_id,
      name: item.name,
      phone: item.phone,
      nickname: item.nickname,
      payment_status: item.payment_status,
      payment_amount: item.payment_amount,
      payment_method: item.payment_method,
      payment_note: item.payment_note,
      payment_created_at: item.payment_created_at,
      payment_processed_at: item.payment_processed_at,
      admin_id: item.admin_id,
      submitted_at: item.submitted_at,
      updated_at: item.updated_at,
      approval: item.approval,
      review_id: item.review_id,
      review_title: item.reviews?.title,
      product_name: item.reviews?.product_name,
      platform: item.reviews?.platform,
      user_bank_name: null, // 별도 조회 필요
      user_account_number: null, // 별도 조회 필요
      admin_name: null // 별도 조회 필요
    })) || [];
    
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    const response: PaymentResponse = {
      data: payments,
      pagination: {
        page,
        limit: pageSize,
        total: totalCount,
        totalPages
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { ids, status, note, amount } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: '업데이트할 항목을 선택해주세요' },
        { status: 400 }
      );
    }

    // 사용자 정보 확인
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    const updateData: any = {
      payment_status: status,
      updated_at: new Date().toISOString(),
      admin_id: user.id
    };

    if (note) updateData.payment_note = note;
    if (amount !== undefined) updateData.payment_amount = amount;
    if (status === 'completed') {
      updateData.payment_processed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('slot_submissions')
      .update(updateData)
      .in('id', ids)
      .select();

    if (error) {
      return NextResponse.json(
        { error: '상태 업데이트에 실패했습니다' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: '상태가 성공적으로 업데이트되었습니다',
      data: data
    });

  } catch (error) {
    return NextResponse.json(
      { error: '서버 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 