import { createClient } from "@/utils/supabase/server";

// 한국시간 기준 날짜 계산 함수
function getKoreanDate(): string {
  const now = new Date();
  const koreanTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
  return koreanTime.toISOString().split('T')[0];
}

export async function updateDailySlotsToAvailable(reviewId: string, date: string = getKoreanDate()) {
  const supabase = await createClient();
  
  try {
    // 리뷰의 daily_count 가져오기
    const { data: reviewData, error: reviewError } = await supabase
      .from("reviews")
      .select("daily_count")
      .eq("id", reviewId)
      .single();

    if (reviewError || !reviewData) {
      return { success: false, error: "리뷰 정보를 찾을 수 없습니다." };
    }

    const dailyCount = reviewData.daily_count || 0;
    
    if (dailyCount <= 0) {
      return { success: false, error: "일일 할당량이 설정되지 않았습니다." };
    }

    // 해당 날짜에 이미 할당된 슬롯 수 확인 (reserved + complete)
    const { data: allocatedSlots, error: allocatedError } = await supabase
      .from("slots")
      .select("id")
      .eq("review_id", reviewId)
      .eq("opened_date", date)
      .in("status", ["reserved", "complete"]);

    if (allocatedError) {
      return { success: false, error: "할당된 슬롯 확인 중 오류가 발생했습니다." };
    }

    // 현재 available 상태인 슬롯 수 확인
    const { data: availableSlots, error: availableError } = await supabase
      .from("slots")
      .select("id")
      .eq("review_id", reviewId)
      .eq("opened_date", date)
      .eq("status", "available");

    if (availableError) {
      return { success: false, error: "사용 가능한 슬롯 확인 중 오류가 발생했습니다." };
    }

    const allocatedCount = allocatedSlots?.length || 0;
    const currentAvailableCount = availableSlots?.length || 0;
    const totalActiveSlots = allocatedCount + currentAvailableCount;
    
    // 남은 할당량 계산
    const remainingQuota = dailyCount - allocatedCount;
    const slotsToActivate = Math.max(0, remainingQuota - currentAvailableCount);

    if (slotsToActivate <= 0) {
      return { success: true, message: "이미 충분한 슬롯이 활성화되어 있습니다.", activated: 0 };
    }

    // unopened 상태의 슬롯을 available로 변경
    const { data: updatedSlots, error: updateError } = await supabase
      .from("slots")
      .update({ status: "available" })
      .eq("review_id", reviewId)
      .eq("opened_date", date)
      .eq("status", "unopened")
      .is("reservation_user_id", null)
      .order("slot_number", { ascending: true })
      .limit(slotsToActivate)
      .select();

    if (updateError) {
      return { success: false, error: "슬롯 상태 업데이트 중 오류가 발생했습니다." };
    }

    return { 
      success: true, 
      message: `${updatedSlots?.length || 0}개의 슬롯이 활성화되었습니다.`, 
      activated: updatedSlots?.length || 0 
    };

  } catch (error) {
    return { success: false, error: "슬롯 관리 중 오류가 발생했습니다." };
  }
}

export async function checkAndCreateDailyQuota(reviewId: string, date: string = getKoreanDate()) {
  const supabase = await createClient();
  
  try {
    // 일별 할당량이 이미 존재하는지 확인
    const { data: existingQuota, error: quotaError } = await supabase
      .from("slot_daily_quotas")
      .select("*")
      .eq("review_id", reviewId)
      .eq("date", date)
      .single();

    if (quotaError && quotaError.code !== 'PGRST116') {
      return { success: false, error: "일별 할당량 확인 중 오류가 발생했습니다." };
    }

    // 일별 할당량이 없으면 생성
    if (!existingQuota) {
      const { data: reviewData, error: reviewError } = await supabase
        .from("reviews")
        .select("daily_count")
        .eq("id", reviewId)
        .single();

      if (reviewError || !reviewData) {
        return { success: false, error: "리뷰 정보를 찾을 수 없습니다." };
      }

      const { error: createError } = await supabase
        .from("slot_daily_quotas")
        .insert({
          review_id: reviewId,
          date: date,
          available_slots: reviewData.daily_count || 0,
          reserved_slots: 0
        });

      if (createError) {
        return { success: false, error: "일별 할당량 생성 중 오류가 발생했습니다." };
      }
    }

    return { success: true, message: "일별 할당량이 준비되었습니다." };

  } catch (error) {
    return { success: false, error: "일별 할당량 관리 중 오류가 발생했습니다." };
  }
} 