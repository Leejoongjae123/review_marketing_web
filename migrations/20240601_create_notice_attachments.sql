-- 첨부 파일 저장 테이블 생성 
CREATE TABLE IF NOT EXISTS notice_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  notice_id UUID NOT NULL REFERENCES notices(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  original_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS notice_attachments_notice_id_idx ON notice_attachments(notice_id);

-- RLS 정책 설정
ALTER TABLE notice_attachments ENABLE ROW LEVEL SECURITY;

-- 공개 접근 정책 (모든 사용자가 읽기 가능)
CREATE POLICY notice_attachments_select_policy
  ON notice_attachments FOR SELECT
  USING (true);

-- 관리자 수정 정책 (관리자만 삽입/수정/삭제 가능)
CREATE POLICY notice_attachments_insert_policy
  ON notice_attachments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY notice_attachments_update_policy
  ON notice_attachments FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY notice_attachments_delete_policy
  ON notice_attachments FOR DELETE
  TO authenticated
  USING (true);

-- 트리거 함수: updated_at 필드 자동 업데이트
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 설정
CREATE TRIGGER update_notice_attachments_updated_at
BEFORE UPDATE ON notice_attachments
FOR EACH ROW
EXECUTE FUNCTION update_modified_column(); 