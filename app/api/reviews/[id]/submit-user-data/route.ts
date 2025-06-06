import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviewId = id;
  
  try {
    const supabase = await createClient();
    
    // 현재 로그인한 사용자 정보 가져오기
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: "로그인이 필요합니다." },
        { status: 401 }
      );
    }

    const userId = session.user.id;
    
    // FormData 파싱
    const formData = await request.formData();
    const slotId = formData.get('slotId') as string;
    const name = formData.get('name') as string;
    const phone = formData.get('phone') as string;
    const nickname = formData.get('nickname') as string;
    
    if (!slotId || !name || !phone || !nickname) {
      return NextResponse.json(
        { error: "필수 정보가 누락되었습니다." },
        { status: 400 }
      );
    }
    
    // 해당 슬롯이 현재 사용자가 예약한 것인지 확인
    const { data: slot, error: slotError } = await supabase
      .from("slots")
      .select("*")
      .eq("id", slotId)
      .eq("review_id", reviewId)
      .eq("reservation_user_id", userId)
      .single();
    
    if (slotError || !slot) {
      return NextResponse.json(
        { error: "해당 슬롯에 대한 권한이 없습니다." },
        { status: 403 }
      );
    }
    
    // 기존 이미지 URL들 처리
    const existingImages: string[] = [];
    for (let i = 0; ; i++) {
      const existingImage = formData.get(`existingImages[${i}]`) as string;
      if (!existingImage) break;
      existingImages.push(existingImage);
    }
    
    // 새로 업로드할 이미지 파일들 처리
    const userImages = formData.getAll('userImages') as File[];
    let newImageUrls: string[] = [];
    
    if (userImages.length > 0) {
      for (let i = 0; i < userImages.length; i++) {
        const file = userImages[i];
        if (file.size > 0) { // 실제 파일인지 확인
          const fileExt = file.name.split('.').pop();
          const fileName = `${reviewId}/${slotId}/user_images/${Date.now()}_${i}.${fileExt}`;
          
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('review-files')
            .upload(fileName, file);
          
          if (uploadError) {
            return NextResponse.json(
              { error: `이미지 업로드 실패: ${uploadError.message}` },
              { status: 500 }
            );
          }
          
          // 공개 URL 생성
          const { data: urlData } = supabase.storage
            .from('review-files')
            .getPublicUrl(fileName);
          
          newImageUrls.push(urlData.publicUrl);
        }
      }
    }
    
    // 기존 이미지와 새 이미지를 합침
    const userImageUrls = [...existingImages, ...newImageUrls];
    
    // 기존 제출 데이터가 있는지 확인
    const { data: existingSubmission } = await supabase
      .from("slot_submissions")
      .select("*")
      .eq("slot_id", slotId)
      .single();
    
    // 사용자 정보를 slot_submissions 테이블에 저장
    const submissionData = {
      slot_id: slotId,
      user_id: userId,
      review_id: reviewId,
      name,
      phone,
      nickname,
      user_images: userImageUrls,
      ...(existingSubmission ? 
        { updated_at: new Date().toISOString() } : 
        { submitted_at: new Date().toISOString() }
      )
    };

    const { data: savedSubmissionData, error: submissionError } = await supabase
      .from("slot_submissions")
      .upsert(submissionData, {
        onConflict: 'slot_id'
      })
      .select()
      .single();
    
    if (submissionError) {
      return NextResponse.json(
        { error: `사용자 정보 저장 중 오류가 발생했습니다. ${submissionError.message}` },
        { status: 500 }
      );
    }

    // 슬롯 상태를 'complete'로 업데이트
    const { error: statusUpdateError } = await supabase
      .from("slots")
      .update({ status: 'complete' })
      .eq("id", slotId);
    
    if (statusUpdateError) {
      return NextResponse.json(
        { error: `슬롯 상태 업데이트 중 오류가 발생했습니다. ${statusUpdateError.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      message: existingSubmission ? 
        "사용자 정보와 이미지가 성공적으로 수정되었습니다." : 
        "사용자 정보와 이미지가 성공적으로 제출되었습니다.",
      data: savedSubmissionData
    });
    
  } catch (error) {
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 