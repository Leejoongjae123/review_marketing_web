import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import * as XLSX from 'xlsx';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const downloadType = searchParams.get('type') || 'current';
    
    // 현재 화면 데이터인 경우 파라미터에서 데이터 가져오기
    if (downloadType === 'current') {
      const pendingData = searchParams.get('pendingData');
      const processedData = searchParams.get('processedData');
      
      if (!pendingData || !processedData) {
        return NextResponse.json(
          { error: '현재 화면 데이터가 없습니다.' },
          { status: 400 }
        );
      }
      
      try {
        const pendingPayments = JSON.parse(decodeURIComponent(pendingData));
        const processedPayments = JSON.parse(decodeURIComponent(processedData));
        
        return generateExcelFile(pendingPayments, processedPayments);
      } catch (parseError) {
        return NextResponse.json(
          { error: '데이터 파싱 중 오류가 발생했습니다.' },
          { status: 400 }
        );
      }
    }
    
    // 전체 데이터 다운로드 - 단계별로 조회
    const [pendingSubmissions, processedSubmissions] = await Promise.all([
      // 미정산 내역 조회
      supabase
        .from('slot_submissions')
        .select('id, name, payment_amount, submitted_at, payment_status, user_id')
        .eq('payment_status', 'pending')
        .order('submitted_at', { ascending: false }),
      
      // 처리결과 조회
      supabase
        .from('slot_submissions')
        .select('id, name, payment_amount, submitted_at, payment_processed_at, payment_status, payment_note, reason, user_id')
        .in('payment_status', ['completed', 'failed'])
        .order('payment_processed_at', { ascending: false })
    ]);

    if (pendingSubmissions.error || processedSubmissions.error) {
      return NextResponse.json(
        { error: '데이터 조회 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    // 사용자 ID 목록 수집
    const allUserIds = [
      ...pendingSubmissions.data.map(item => item.user_id),
      ...processedSubmissions.data.map(item => item.user_id)
    ].filter(Boolean);

    // 프로필 정보 조회
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, bank_name, account_number, full_name')
      .in('id', allUserIds);

    // 프로필 정보를 맵으로 변환
    const profileMap = new Map();
    profiles?.forEach(profile => {
      profileMap.set(profile.id, profile);
    });

    const pendingPayments = pendingSubmissions.data.map(item => {
      const profile = profileMap.get(item.user_id);
      return {
        id: item.id,
        name: item.name || '정보없음',
        bank: profile?.bank_name || '정보없음',
        accountNumber: profile?.account_number || '정보없음',
        amount: item.payment_amount || 0,
        createdAt: item.submitted_at,
        status: item.payment_status
      };
    });

    const processedPayments = processedSubmissions.data.map(item => {
      const profile = profileMap.get(item.user_id);
      return {
        id: item.id,
        name: item.name || '정보없음',
        bank: profile?.bank_name || '정보없음',
        accountNumber: profile?.account_number || '정보없음',
        amount: item.payment_amount || 0,
        createdAt: item.submitted_at,
        updatedAt: item.payment_processed_at,
        status: item.payment_status,
        reason: item.payment_note || item.reason || ''
      };
    });

    return generateExcelFile(pendingPayments, processedPayments);

  } catch (error) {
    console.log('엑셀 다운로드 오류:', error);
    return NextResponse.json(
      { error: '엑셀 파일 생성 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

function generateExcelFile(pendingPayments: any[], processedPayments: any[]) {
  // 워크북 생성
  const workbook = XLSX.utils.book_new();

  // 데이터 정제 함수
  const formatAmount = (amount: any) => {
    if (!amount || amount === 0) return '0';
    return typeof amount === 'number' ? amount.toLocaleString() : String(amount);
  };

  const formatDate = (dateString: any) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('ko-KR');
    } catch {
      return '';
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'completed': return '입금완료';
      case 'failed': return '입금불가';
      case 'pending': return '미정산';
      case 'processing': return '처리대기';
      default: return status || '';
    }
  };

  // 미정산 내역 시트 데이터 준비
  const pendingSheetData = [
    ['이름', '은행', '계좌번호', '금액', '신청일'],
    ...pendingPayments.map(payment => [
      payment.name || '정보없음',
      payment.bank || '정보없음', 
      payment.accountNumber || '정보없음',
      formatAmount(payment.amount),
      formatDate(payment.createdAt)
    ])
  ];

  // 처리결과 시트 데이터 준비
  const processedSheetData = [
    ['이름', '은행', '계좌번호', '금액', '신청일', '처리일자', '상태', '사유'],
    ...processedPayments.map(payment => [
      payment.name || '정보없음',
      payment.bank || '정보없음',
      payment.accountNumber || '정보없음', 
      formatAmount(payment.amount),
      formatDate(payment.createdAt),
      formatDate(payment.updatedAt),
      formatStatus(payment.status),
      payment.reason || ''
    ])
  ];

  // 시트 생성 및 워크북에 추가
  const pendingSheet = XLSX.utils.aoa_to_sheet(pendingSheetData);
  const processedSheet = XLSX.utils.aoa_to_sheet(processedSheetData);

  // 컬럼 너비 설정
  pendingSheet['!cols'] = [
    { width: 15 }, // 이름
    { width: 15 }, // 은행
    { width: 20 }, // 계좌번호
    { width: 15 }, // 금액
    { width: 15 }  // 신청일
  ];

  processedSheet['!cols'] = [
    { width: 15 }, // 이름
    { width: 15 }, // 은행
    { width: 20 }, // 계좌번호
    { width: 15 }, // 금액
    { width: 15 }, // 신청일
    { width: 15 }, // 처리일자
    { width: 12 }, // 상태
    { width: 30 }  // 사유
  ];

  XLSX.utils.book_append_sheet(workbook, pendingSheet, '미정산내역');
  XLSX.utils.book_append_sheet(workbook, processedSheet, '처리결과');

  // 엑셀 파일 생성
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

  // 파일명 생성 (현재 날짜 포함)
  const today = new Date().toISOString().split('T')[0];
  const filename = `정산관리_${today}.xlsx`;

  // 응답 헤더 설정
  const headers = new Headers();
  headers.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  headers.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);

  return new NextResponse(excelBuffer, { headers });
} 