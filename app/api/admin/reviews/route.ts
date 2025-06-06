import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  
  // URL 파라미터 파싱
  const url = new URL(request.url);
  const searchCategory = url.searchParams.get("searchCategory") || "";
  const searchTerm = url.searchParams.get("searchTerm") || "";
  const startDate = url.searchParams.get("startDate") || "";
  const endDate = url.searchParams.get("endDate") || "";
  const platformFilter = url.searchParams.get("platformFilter") || "";
  const page = parseInt(url.searchParams.get("page") || "1");
  const pageSize = parseInt(url.searchParams.get("pageSize") || "10");
  
  // 페이지네이션 계산
  const offset = (page - 1) * pageSize;
  
  // 기본 쿼리 설정
  let query = supabase
    .from("reviews")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });
  
  // 검색 조건 적용
  if (searchTerm && searchCategory) {
    query = query.ilike(searchCategory, `%${searchTerm}%`);
  }

  // 플랫폼 필터링 적용
  if (platformFilter) {
    query = query.eq("platform", platformFilter);
  }
  
  // 날짜 필터링 적용
  if (startDate) {
    query = query.gte("start_date", startDate);
  }
  
  if (endDate) {
    // endDate에 하루를 더해 해당 날짜의 끝까지 포함
    const nextDay = new Date(endDate);
    nextDay.setDate(nextDay.getDate() + 1);
    query = query.lt("end_date", nextDay.toISOString());
  }
  
  // 정렬 및 페이지네이션 적용
  const { data: reviews, error, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);
  
  if (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "리뷰 데이터를 불러오는데 실패했습니다" },
      { status: 500 }
    );
  }

  // 각 리뷰에 대해 구좌 정보 추가
  const reviewsWithSlots = await Promise.all(
    reviews.map(async (review) => {
      // 구좌 정보 가져오기
      const { data: slotsData, error: slotsError } = await supabase
        .from("slots")
        .select("*")
        .eq("review_id", review.id)
        .order("slot_number", { ascending: true });

      return {
        ...review,
        slots: slotsData || []
      };
    })
  );
  
  // 총 페이지 수 계산
  const totalPages = Math.ceil((count || 0) / pageSize);
  
  return NextResponse.json({
    reviews: reviewsWithSlots,
    totalCount: count || 0,
    totalPages,
    currentPage: page,
    pageSize,
  });
} 