import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchCategory = searchParams.get("searchCategory") || "";
  const searchTerm = searchParams.get("searchTerm") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const supabase = await createClient();

  try {
    let query = supabase.from("reviews").select("*", { count: "exact" });

    // 검색어 필터링
    if (searchTerm) {
      query = query.ilike(searchCategory, `%${searchTerm}%`);
    }

    // 날짜 필터링
    if (startDate) {
      query = query.gte("start_date", startDate);
    }
    if (endDate) {
      query = query.lte("end_date", endDate);
    }

    // 페이지네이션
    const start = (page - 1) * pageSize;
    query = query.range(start, start + pageSize - 1);

    const { data: reviews, count, error } = await query;

    if (error) {
      throw error;
    }

    // 각 리뷰에 대해 provider 정보 가져오기
    const reviewsWithProviders = await Promise.all(
      reviews.map(async (review) => {
        const reviewWithProviders = { ...review };

        // provider1 정보 가져오기
        if (review.provider1) {
          const { data: provider1Data, error: provider1Error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.provider1)
            .single();

          if (!provider1Error && provider1Data) {
            reviewWithProviders.provider1_name = provider1Data.full_name;
          }
        }

        // provider2 정보 가져오기
        if (review.provider2) {
          const { data: provider2Data, error: provider2Error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.provider2)
            .single();

          if (!provider2Error && provider2Data) {
            reviewWithProviders.provider2_name = provider2Data.full_name;
          }
        }

        // provider3 정보 가져오기
        if (review.provider3) {
          const { data: provider3Data, error: provider3Error } = await supabase
            .from("profiles")
            .select("full_name")
            .eq("id", review.provider3)
            .single();

          if (!provider3Error && provider3Data) {
            reviewWithProviders.provider3_name = provider3Data.full_name;
          }
        }

        return reviewWithProviders;
      })
    );

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return NextResponse.json({
      reviews: reviewsWithProviders,
      totalCount,
      totalPages,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "리뷰를 불러오는데 실패했습니다." },
      { status: 500 }
    );
  }
}

// 이미지 파일을 슈파베이스 스토리지에 업로드하는 함수
async function uploadImage(file: File, supabase: any): Promise<string | null> {
  try {
    // 파일 형식 확인
    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `reviews/${fileName}`;

    // 파일을 ArrayBuffer로 변환
    const arrayBuffer = await file.arrayBuffer();
    const fileData = new Uint8Array(arrayBuffer);

    // 슈파베이스 스토리지에 업로드
    const { data, error } = await supabase.storage
      .from("reviews")
      .upload(filePath, fileData, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error("이미지 업로드 오류:", error);
      return null;
    }

    // 업로드된 이미지의 공개 URL 가져오기
    const {
      data: { publicUrl },
    } = supabase.storage.from("reviews").getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("이미지 업로드 처리 오류:", error);
    return null;
  }
}

export async function POST(req: Request) {
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
    // 클라이언트에서 전송한 데이터 파싱
    const formData = await req.json();
    console.log('formData: ', formData)
    // 사용자 정보 가져오기
    const userData = session.user.user_metadata || {};
    console.log('userData: ', userData)
    

    // 이미지 저장 처리
    const imageUrls = [];
    if (formData.imageFiles && formData.imageFiles.length > 0) {
      for (const base64Data of formData.imageFiles) {
        // base64 형식에서 실제 바이너리 데이터로 변환
        const base64WithoutPrefix = base64Data.split(",")[1];
        const buffer = Buffer.from(base64WithoutPrefix, "base64");

        // Supabase Storage에 업로드
        const fileName = `review-image-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
        const { data, error } = await supabase.storage
          .from("review-images")
          .upload(`public/${fileName}`, buffer, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // 업로드된 이미지 URL 저장
        const { data: urlData } = supabase.storage
          .from("review-images")
          .getPublicUrl(`public/${fileName}`);

        imageUrls.push(urlData.publicUrl);
      }
    }

    // 리뷰 데이터 저장
    const reviewData = {
      user_id: userId,
      platform: formData.platform,
      product_name: formData.productName,
      option_name: formData.optionName,
      price: formData.price ? parseInt(formData.price) : 0,
      shipping_fee: formData.shippingFee ? parseInt(formData.shippingFee) : 0,
      seller: formData.seller,
      provider1: formData.providers_data?.[0]?.id || null,
      provider2: formData.providers_data?.[1]?.id || null,
      provider3: formData.providers_data?.[2]?.id || null,
      status: formData.status || "approved",
      start_date: formData.startDate,
      end_date: formData.endDate,
      title: formData.title,
      content: formData.content,
      rating: formData.rating ? parseInt(formData.rating) : 3,
      product_url: formData.productUrl,
      product_image: imageUrls.length > 0 ? imageUrls[0] : null,
    };

    // 리뷰 데이터 저장
    const { data: reviewResult, error: reviewError } = await supabase
      .from("reviews")
      .insert(reviewData)
      .select("id")
      .single();

    if (reviewError || !reviewResult) {
      return NextResponse.json(
        { error: "리뷰 등록에 실패했습니다." },
        { status: 500 }
      );
    }

    const reviewId = reviewResult.id;

    // 리뷰 참가자 테이블에 데이터 추가
    const { error: participantError } = await supabase
      .from("review_participants")
      .insert({
        review_id: reviewId,
        reviewer_id: userId,
        name: userData.full_name || "리뷰어",
        phone: userData.phone || "",
        login_account: session.user.email || "",
        event_account: session.user.email || "",
        nickname: userData.username || "리뷰어",
        review_image: imageUrls.length > 0 ? imageUrls[0] : null,
      });

    if (participantError) {
      // 참가자 등록 실패 시 로그 기록
      console.log("리뷰 참가자 등록 중 오류:", participantError);
      console.log("참가자 데이터:", {
        review_id: reviewId,
        reviewer_id: userId,
        user_data: userData,
      });

      // 여기서 리뷰를 삭제하지는 않지만, 참가자 등록 실패를 보고합니다
      return NextResponse.json(
        {
          warning: "리뷰는 등록되었지만 참가자 정보 등록에 실패했습니다.",
          reviewId: reviewId,
          success: true,
        },
        { status: 201 }
      );
    }

    return NextResponse.json({ 
      success: true,
      reviewId: reviewId 
    }, { status: 201 });
  } catch (error) {
    console.log("리뷰 등록 중 오류:", error);
    return NextResponse.json(
      { error: "리뷰 등록에 실패했습니다." },
      { status: 500 }
    );
  }
}
