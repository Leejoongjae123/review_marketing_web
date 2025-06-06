import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // 현재 리뷰 정보 가져오기
    const { data: review, error: reviewError } = await supabase
      .from("reviews")
      .select("daily_count, start_date, end_date, status")
      .eq("id", id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json(
        { error: "리뷰를 찾을 수 없습니다." },
        { status: 404 }
      );
    }

    // 승인된 리뷰만 처리
    if (review.status !== "approved") {
      return NextResponse.json(
        { error: "승인된 리뷰만 동기화할 수 있습니다." },
        { status: 400 }
      );
    }

    const now = new Date();
    const startDate = new Date(review.start_date);
    const endDate = new Date(review.end_date);

    // 리뷰 기간 확인
    if (now < startDate || now > endDate) {
      return NextResponse.json(
        { message: "리뷰 기간이 아닙니다." },
        { status: 200 }
      );
    }

    const today = new Date().toISOString().split('T')[0];
    const dailyCount = review.daily_count;

    // 1. 오늘 날짜의 일별 할당량 정보 확인 및 생성/업데이트
    const { data: existingQuota } = await supabase
      .from("slot_daily_quotas")
      .select("*")
      .eq("review_id", id)
      .eq("date", today)
      .single();

    let quotaData;
    if (!existingQuota) {
      // 오늘 날짜의 할당량 정보가 없으면 생성
      const { data: newQuota, error: createQuotaError } = await supabase
        .from("slot_daily_quotas")
        .insert({
          review_id: id,
          date: today,
          available_slots: dailyCount,
          reserved_slots: 0,
          last_refreshed: new Date().toISOString()
        })
        .select()
        .single();

      if (createQuotaError) {
        // 중복으로 인한 오류인 경우 기존 데이터 조회
        const { data: retryQuota } = await supabase
          .from("slot_daily_quotas")
          .select("*")
          .eq("review_id", id)
          .eq("date", today)
          .single();
        
        quotaData = retryQuota;
      } else {
        quotaData = newQuota;
      }
    } else {
      // 기존 할당량 정보가 있으면 available_slots만 업데이트
      const { data: updatedQuota, error: updateQuotaError } = await supabase
        .from("slot_daily_quotas")
        .update({
          available_slots: dailyCount,
          last_refreshed: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq("review_id", id)
        .eq("date", today)
        .select()
        .single();

      if (updateQuotaError) {
        return NextResponse.json(
          { error: "일별 할당량 업데이트에 실패했습니다." },
          { status: 500 }
        );
      }
      quotaData = updatedQuota;
    }

    if (!quotaData) {
      return NextResponse.json(
        { error: "일별 할당량 정보를 처리할 수 없습니다." },
        { status: 500 }
      );
    }

    // 2. 현재 슬롯 상태 확인
    const { data: slots, error: slotsError } = await supabase
      .from("slots")
      .select("id, slot_number, status, opened_date, reservation_user_id")
      .eq("review_id", id)
      .order("slot_number", { ascending: true });

    if (slotsError) {
      return NextResponse.json(
        { error: "슬롯 정보를 가져올 수 없습니다." },
        { status: 500 }
      );
    }

    // 3. 슬롯 상태 분석 및 수정
    let updatedSlots = [];
    let slotsOpened = 0;
    let slotsClosed = 0;
    let statusFixed = 0;

    // 예약된 슬롯 수 계산 (reserved, complete 상태)
    const reservedSlots = slots.filter(slot => 
      slot.status === 'reserved' || slot.status === 'complete'
    );
    const currentReservedCount = reservedSlots.length;

    // 오늘 오픈되어야 할 슬롯들 (opened_date가 오늘이거나 이전 날짜)
    const shouldBeOpenToday = slots.filter(slot => {
      if (!slot.opened_date) return false;
      const openDate = new Date(slot.opened_date);
      const todayDate = new Date(today);
      return openDate <= todayDate;
    });

    // 잘못된 상태의 슬롯들 수정
    for (const slot of slots) {
      let needsUpdate = false;
      let newStatus = slot.status;
      let newOpenedDate = slot.opened_date;

      // 1) 예약자가 있는데 status가 available인 경우
      if (slot.reservation_user_id && slot.status === 'available') {
        newStatus = 'reserved';
        needsUpdate = true;
        statusFixed++;
      }
      
      // 2) 예약자가 없는데 status가 reserved나 complete인 경우
      if (!slot.reservation_user_id && (slot.status === 'reserved' || slot.status === 'complete')) {
        newStatus = 'available';
        needsUpdate = true;
        statusFixed++;
      }

      // 3) opened_date가 있는데 status가 unopened인 경우
      if (slot.opened_date && slot.status === 'unopened') {
        newStatus = 'available';
        needsUpdate = true;
        statusFixed++;
      }

      // 4) opened_date가 없는데 status가 available, reserved, complete인 경우
      if (!slot.opened_date && (slot.status === 'available' || slot.status === 'reserved' || slot.status === 'complete')) {
        // 예약자가 있는 경우는 오늘 날짜로 설정
        if (slot.reservation_user_id) {
          newOpenedDate = today;
        } else {
          // 예약자가 없으면 unopened로 변경
          newStatus = 'unopened';
          newOpenedDate = null;
        }
        needsUpdate = true;
        statusFixed++;
      }

      if (needsUpdate) {
        const { error: updateError } = await supabase
          .from("slots")
          .update({
            status: newStatus,
            opened_date: newOpenedDate
          })
          .eq("id", slot.id);

        if (!updateError) {
          updatedSlots.push({
            id: slot.id,
            slot_number: slot.slot_number,
            old_status: slot.status,
            new_status: newStatus,
            action: 'status_fixed'
          });
        }
      }
    }

    // 4. 최신 슬롯 상태 다시 조회
    const { data: updatedSlotsData } = await supabase
      .from("slots")
      .select("id, slot_number, status, opened_date, reservation_user_id")
      .eq("review_id", id)
      .order("slot_number", { ascending: true });

    const currentSlots = updatedSlotsData || slots;

    // 오늘 오픈된 슬롯들 재계산
    const todayOpenedSlots = currentSlots.filter(slot => 
      slot.opened_date === today && 
      (slot.status === 'available' || slot.status === 'reserved' || slot.status === 'complete')
    );

    const unopenedSlots = currentSlots.filter(slot => slot.status === 'unopened');
    const targetOpenCount = quotaData.available_slots;
    const currentOpenCount = todayOpenedSlots.length;

    // 5. 슬롯 오픈/닫기 처리
    if (currentOpenCount < targetOpenCount) {
      // 슬롯을 더 열어야 하는 경우
      const slotsToOpen = targetOpenCount - currentOpenCount;
      
      if (unopenedSlots.length > 0) {
        const slotsToUpdate = unopenedSlots.slice(0, slotsToOpen);
        
        for (const slot of slotsToUpdate) {
          const { error: updateError } = await supabase
            .from("slots")
            .update({
              status: 'available',
              opened_date: today
            })
            .eq("id", slot.id);

          if (!updateError) {
            updatedSlots.push({
              id: slot.id,
              slot_number: slot.slot_number,
              old_status: 'unopened',
              new_status: 'available',
              action: 'opened'
            });
            slotsOpened++;
          }
        }
      }
    } else if (currentOpenCount > targetOpenCount) {
      // 슬롯을 닫아야 하는 경우 (일건수가 줄어든 경우)
      const slotsToClose = currentOpenCount - targetOpenCount;
      
      // available 상태인 슬롯들 중에서 닫기 (reserved나 complete는 건드리지 않음)
      const availableSlotsToClose = todayOpenedSlots
        .filter(slot => slot.status === 'available')
        .sort((a, b) => b.slot_number - a.slot_number) // 큰 번호부터 닫기
        .slice(0, slotsToClose);
        
      for (const slot of availableSlotsToClose) {
        const { error: updateError } = await supabase
          .from("slots")
          .update({
            status: 'unopened',
            opened_date: null
          })
          .eq("id", slot.id);

        if (!updateError) {
          updatedSlots.push({
            id: slot.id,
            slot_number: slot.slot_number,
            old_status: 'available',
            new_status: 'unopened',
            action: 'closed'
          });
          slotsClosed++;
        }
      }
    }

    // 6. reserved_slots 수 업데이트
    const finalReservedCount = currentReservedCount;
    await supabase
      .from("slot_daily_quotas")
      .update({
        reserved_slots: finalReservedCount,
        last_refreshed: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq("review_id", id)
      .eq("date", today);

    return NextResponse.json({
      message: "슬롯 동기화가 완료되었습니다.",
      data: {
        dailyCount,
        availableSlots: targetOpenCount,
        currentOpenCount: currentOpenCount + slotsOpened - slotsClosed,
        targetOpenCount,
        slotsOpened,
        slotsClosed,
        statusFixed,
        totalChanges: slotsOpened + slotsClosed + statusFixed,
        updatedSlots,
        reservedSlots: finalReservedCount
      }
    });

  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 