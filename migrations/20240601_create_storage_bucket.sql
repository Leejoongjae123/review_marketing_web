-- 동영상 저장용 스토리지 버킷 생성
INSERT INTO storage.buckets (id, name, public, avif_autodetection)
VALUES ('notice_videos', 'notice_videos', true, false)
ON CONFLICT (id) DO NOTHING;

-- 모든 사용자가 버킷 내 파일을 볼 수 있도록 정책 설정
CREATE POLICY "공개 읽기 접근 정책"
ON storage.objects FOR SELECT
USING (bucket_id = 'notice_videos');

-- 인증된 사용자가 파일을 업로드할 수 있도록 정책 설정
CREATE POLICY "인증된 사용자만 업로드 가능"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notice_videos');

-- 인증된 사용자가 자신이 업로드한 파일을 수정할 수 있도록 정책 설정
CREATE POLICY "인증된 사용자만 수정 가능"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'notice_videos');

-- 인증된 사용자가 자신이 업로드한 파일을 삭제할 수 있도록 정책 설정
CREATE POLICY "인증된 사용자만 삭제 가능"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notice_videos'); 