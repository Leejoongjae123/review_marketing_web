-- Add new fields to reviews table for better data organization
-- 20241220_add_review_fields.sql

-- 검색어 필드 추가
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS search_keyword TEXT;

-- 리뷰비 필드 추가
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_fee INTEGER DEFAULT 0;

-- 구매비용 필드 추가
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS purchase_cost INTEGER;

-- 일건수 필드 추가
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS daily_count INTEGER DEFAULT 0;

-- 예약금액 필드 추가
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reservation_amount INTEGER;

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_reviews_search_keyword ON reviews(search_keyword);
CREATE INDEX IF NOT EXISTS idx_reviews_review_fee ON reviews(review_fee);
CREATE INDEX IF NOT EXISTS idx_reviews_daily_count ON reviews(daily_count);

-- 기존 데이터 정리를 위한 코멘트 추가
COMMENT ON COLUMN reviews.search_keyword IS '검색어 (쿠팡, 스토어 플랫폼에서 사용)';
COMMENT ON COLUMN reviews.review_fee IS '리뷰비 (모든 플랫폼에서 사용)';
COMMENT ON COLUMN reviews.purchase_cost IS '구매비용 (쿠팡, 스토어 플랫폼에서 사용)';
COMMENT ON COLUMN reviews.daily_count IS '일건수 (모든 플랫폼에서 사용)';
COMMENT ON COLUMN reviews.reservation_amount IS '예약금액 (예약자리뷰 플랫폼에서 사용)'; 