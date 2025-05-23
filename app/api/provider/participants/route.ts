import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // 페이지네이션 파라미터
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "10");
    
    // 검색 파라미터
    const searchTerm = searchParams.get("searchTerm") || "";
    const searchCategory = searchParams.get("searchCategory") || "name";
    
    // 현재 로그인한 사용자(광고주) 정보 가져오기
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { error: "인증된 사용자가 아닙니다." },
        { status: 401 }
      );
    }
    
    const providerId = userData.user.id;
    
    // 쿼리 빌더 시작
    let query = supabase
      .from("review_participants")
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
      .or(`reviews.provider1.eq.${providerId},reviews.provider2.eq.${providerId},reviews.provider3.eq.${providerId}`);
    
    // 검색어가 있는 경우 검색 조건 추가
    if (searchTerm) {
      switch (searchCategory) {
        case "name":
          query = query.ilike("name", `%${searchTerm}%`);
          break;
        case "phone":
          query = query.ilike("phone", `%${searchTerm}%`);
          break;
        case "email":
          query = query.ilike("login_account", `%${searchTerm}%`);
          break;
        case "eventAccount":
          query = query.ilike("event_account", `%${searchTerm}%`);
          break;
        default:
          query = query.ilike("name", `%${searchTerm}%`);
      }
    }
    
    // 페이지네이션 적용
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    // 최종 쿼리 실행
    const { data, error, count } = await query
      .range(from, to)
      .order("created_at", { ascending: false });
    
    if (error) {
      return NextResponse.json(
        { error: "데이터 조회 중 오류가 발생했습니다." },
        { status: 500 }
      );
    }
    
    // 응답 데이터 구성
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);
    
    return NextResponse.json({
      data,
      count: totalCount,
      page,
      pageSize,
      totalPages
    });
  } catch (error) {
    console.log("Error fetching participants:", error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 