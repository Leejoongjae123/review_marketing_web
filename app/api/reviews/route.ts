import { createClient } from "@/utils/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const searchCategory = searchParams.get("searchCategory") || "";
  const searchTerm = searchParams.get("searchTerm") || "";
  const startDate = searchParams.get("startDate") || "";
  const endDate = searchParams.get("endDate") || "";
  const platformFilter = searchParams.get("platformFilter") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "10");

  const supabase = await createClient();

  try {
    let query = supabase.from("reviews").select("*", { count: "exact" });

    // 검색어 필터링
    if (searchTerm) {
      query = query.ilike(searchCategory, `%${searchTerm}%`);
    }

    // 플랫폼 필터링
    if (platformFilter && platformFilter !== "전체") {
      query = query.eq("platform", platformFilter);
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

    // 각 리뷰에 대해 provider 정보와 slots 정보 가져오기
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

        // 구좌 정보 가져오기
        const { data: slotsData, error: slotsError } = await supabase
          .from("slots")
          .select("*")
          .eq("review_id", review.id)
          .order("slot_number", { ascending: true });

        if (!slotsError && slotsData) {
          reviewWithProviders.slots = slotsData;
        } else {
          reviewWithProviders.slots = [];
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

// base64 이미지를 스토리지에 업로드하는 함수
async function uploadBase64Image(
  base64Data: string,
  supabase: any,
  prefix: string = "slot"
): Promise<string | null> {
  try {
    // base64 형식에서 실제 바이너리 데이터로 변환
    const base64WithoutPrefix = base64Data.split(",")[1];
    const buffer = Buffer.from(base64WithoutPrefix, "base64");

    // 파일 확장자 추출 (데이터 URL에서)
    const mimeType = base64Data.split(";")[0].split(":")[1];
    const extension = mimeType.split("/")[1];

    // Supabase Storage에 업로드
    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${extension}`;
    const { data, error } = await supabase.storage
      .from("reviews")
      .upload(`public/${fileName}`, buffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      console.error("이미지 업로드 오류:", error);
      return null;
    }

    // 업로드된 이미지 URL 반환
    const { data: urlData } = supabase.storage
      .from("reviews")
      .getPublicUrl(`public/${fileName}`);

    return urlData.publicUrl;
  } catch (error) {
    console.error("base64 이미지 업로드 처리 오류:", error);
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
    console.log('받은 formData: ', JSON.stringify({
      platform: formData.platform,
      productName: formData.productName,
      storeName: formData.storeName,
      store_name: formData.store_name,
      productUrl: formData.productUrl,
      storeUrl: formData.storeUrl,
      store_url: formData.store_url
    }, null, 2))
    // 사용자 정보 가져오기
    const userData = session.user;
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
          .from("reviews")
          .upload(`public/${fileName}`, buffer, {
            contentType: "image/jpeg",
            upsert: false,
          });

        if (error) {
          throw error;
        }

        // 업로드된 이미지 URL 저장
        const { data: urlData } = supabase.storage
          .from("reviews")
          .getPublicUrl(`public/${fileName}`);

        imageUrls.push(urlData.publicUrl);
      }
    }
    console.log('imageUrls: ', imageUrls)
    
    // 플랫폼별 데이터 매핑
    const isProductPlatform = formData.platform === "쿠팡" || formData.platform === "스토어";
    
    // 리뷰 데이터 저장
    const reviewData = {
      platform: formData.platform,
      // 제품명 (쿠팡, 스토어인 경우에만)
      product_name: isProductPlatform ? formData.productName : null,
      // 상호명 - 모든 플랫폼에서 저장 (프론트엔드에서 보내는 값 사용)
      store_name: formData.store_name || formData.storeName || null,
      // 옵션명 또는 추가 정보 
      option_name: formData.optionName || null,
      // 가격 정보 (원래 가격)
      price: formData.price ? parseInt(formData.price) : 0,
      // 배송비 (원래 배송비)
      shipping_fee: formData.shippingFee ? parseInt(formData.shippingFee) : 0,
      // 판매자 정보
      seller: formData.seller || null,
      // 참여자 정보는 별도 테이블로 처리하므로 null로 설정
      participants: null,
      provider1: formData.providers_data?.[0]?.id || null,
      provider2: formData.providers_data?.[1]?.id || null,
      provider3: formData.providers_data?.[2]?.id || null,
      status: formData.status || "approved",
      start_date: formData.startDate,
      end_date: formData.endDate,
      title: formData.title,
      content: formData.content || "리뷰 내용",
      rating: parseInt(formData.rating) || 3,
      // 제품 URL (쿠팡, 스토어인 경우에만)
      product_url: isProductPlatform ? formData.productUrl : null,
      // 상호 URL - 모든 플랫폼에서 저장 (프론트엔드에서 보내는 값 사용)
      store_url: formData.store_url || formData.storeUrl || null,
      image_url: imageUrls.length > 0 ? imageUrls[0] : null,
      // 새로운 필드들 추가
      search_keyword: formData.searchKeyword || null,
      review_fee: formData.reviewFee ? parseInt(formData.reviewFee) : 0,
      reservation_amount: formData.reservationAmount ? parseInt(formData.reservationAmount) : null,
      daily_count: formData.dailyCount ? parseInt(formData.dailyCount) : 0,
      purchase_cost: formData.purchaseCost ? parseInt(formData.purchaseCost) : null,
    };
    
    console.log('저장할 reviewData: ', JSON.stringify({
      platform: reviewData.platform,
      product_name: reviewData.product_name,
      store_name: reviewData.store_name,
      product_url: reviewData.product_url,
      store_url: reviewData.store_url,
      isProductPlatform: isProductPlatform,
      formData_productName: formData.productName,
      formData_storeName: formData.storeName,
      formData_store_name: formData.store_name,
      formData_productUrl: formData.productUrl,
      formData_storeUrl: formData.storeUrl,
      formData_store_url: formData.store_url
    }, null, 2))

    // 리뷰 데이터 저장
    const { data: reviewResult, error: reviewError } = await supabase
      .from("reviews")
      .insert(reviewData)
      .select("id")
      .single();
    console.log('reviewResult: ', reviewResult)
    console.log('reviewError: ', reviewError)

    if (reviewError || !reviewResult) {
      return NextResponse.json(
        { error: "리뷰 등록에 실패했습니다." },
        { status: 500 }
      );
    }

    const reviewId = reviewResult.id;

    // 구좌 데이터 저장
    if (formData.quotas_data && formData.quotas_data.length > 0) {
      console.log('구좌 데이터 처리 시작:', formData.quotas_data.length);
      
      const slotsToInsert = [];
      
      for (const quotaData of formData.quotas_data) {
        const slotNumber = quotaData.quotaNumber;
        const imageUrls = [];
        const receiptUrls = [];
        const currentTime = new Date().toISOString();
        let imagesUpdatedAt = null;
        let receiptsUpdatedAt = null;

        // 구좌 이미지 업로드
        if (quotaData.images && quotaData.images.length > 0) {
          for (const imageData of quotaData.images) {
            const uploadedUrl = await uploadBase64Image(
              imageData.base64,
              supabase,
              `slot-${slotNumber}-image`
            );
            if (uploadedUrl) {
              imageUrls.push(uploadedUrl);
            }
          }
          // 이미지가 있으면 images_updated_at 설정
          if (imageUrls.length > 0) {
            imagesUpdatedAt = currentTime;
          }
        }

        // 구좌 영수증 업로드
        if (quotaData.receipts && quotaData.receipts.length > 0) {
          for (const receiptData of quotaData.receipts) {
            const uploadedUrl = await uploadBase64Image(
              receiptData.base64,
              supabase,
              `slot-${slotNumber}-receipt`
            );
            if (uploadedUrl) {
              receiptUrls.push(uploadedUrl);
            }
          }
          // 영수증이 있으면 receipts_updated_at 설정
          if (receiptUrls.length > 0) {
            receiptsUpdatedAt = currentTime;
          }
        }

        // slots 데이터를 배열에 추가
        const slotData = {
          review_id: reviewId,
          slot_number: slotNumber,
          images: imageUrls,
          receipts: receiptUrls,
          images_updated_at: imagesUpdatedAt,
          receipts_updated_at: receiptsUpdatedAt,
        };
        
        slotsToInsert.push(slotData);
      }

      // 모든 구좌 데이터를 한꺼번에 insert
      if (slotsToInsert.length > 0) {
        const { error: slotsError } = await supabase
          .from("slots")
          .insert(slotsToInsert);

        if (slotsError) {
          console.error('구좌 데이터 일괄 저장 실패:', slotsError);
          // 구좌 저장 실패해도 리뷰는 성공으로 처리
        } else {
          console.log(`${slotsToInsert.length}개 구좌 데이터 일괄 저장 성공`);
        }
      }
    }

    // 리뷰 참가자 테이블에 데이터 추가
    

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
