# 동영상 업로드 기능 사용 가이드

## 개요
텍스트 에디터에서 동영상을 삽입하는 두 가지 방법을 지원합니다:
1. **URL 입력**: YouTube, Vimeo 등의 동영상 URL 직접 입력
2. **파일 업로드**: 로컬 동영상 파일을 Supabase Storage에 업로드

## 지원 기능

### URL 기반 동영상
- YouTube URL 자동 embed 변환
- Vimeo URL 자동 embed 변환
- 커스텀 iframe 지원

### 파일 업로드
- 지원 형식: MP4, WebM, OGG, AVI, MOV, WMV
- 최대 파일 크기: 100MB
- Supabase Storage 저장
- 커스텀 비디오 플레이어 제공

## 사용 방법

### 1. 텍스트 에디터에서 동영상 버튼 클릭
```jsx
// ToolbarPlugin에서 동영상 버튼
<button onClick={insertVideo}>
  <MdVideoLibrary />
</button>
```

### 2. 동영상 삽입 대화상자에서 방법 선택
- **URL 입력 탭**: YouTube나 Vimeo URL 입력
- **파일 업로드 탭**: 로컬 동영상 파일 선택

### 3. 동영상 설정
- 너비/높이 조정 (px 단위)
- 정렬 방식 선택 (왼쪽/가운데/오른쪽)

## API 엔드포인트

### 동영상 업로드
```
POST /api/upload/video
Content-Type: multipart/form-data

FormData:
- video: File
```

### 동영상 삭제
```
DELETE /api/upload/video/delete?fileName=파일명
```

## 컴포넌트 구조

### VideoUploadDialog.js
- 동영상 업로드 대화상자
- URL 입력과 파일 업로드 탭 지원
- 파일 유효성 검사
- 업로드 진행률 표시

### VideoPlayer.js
- 동영상 재생 컴포넌트
- URL 기반: iframe 사용
- 업로드 기반: HTML5 video 태그 사용
- 커스텀 컨트롤 제공

### VideoNode.js
- Lexical 에디터용 동영상 노드
- VideoPlayer 컴포넌트 래핑
- JSON 직렬화/역직렬화 지원

## Supabase 설정

### Storage 버킷
```sql
-- videos 버킷 생성
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES ('videos', 'videos', true, 104857600, ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/wmv']);
```

### Storage 정책
```sql
-- 업로드 권한
CREATE POLICY "Allow authenticated users to upload videos" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'videos' AND auth.role() = 'authenticated');

-- 읽기 권한
CREATE POLICY "Allow public access to videos" ON storage.objects
    FOR SELECT USING (bucket_id = 'videos');

-- 삭제 권한
CREATE POLICY "Allow users to delete their own videos" ON storage.objects
    FOR DELETE USING (bucket_id = 'videos' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 사용 예시

### 에디터에서 동영상 삽입
```jsx
import VideoUploadDialog from './VideoUploadDialog';

function MyEditor() {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  
  const onVideoInsert = (videoData) => {
    // videoData 구조:
    // {
    //   src: string,
    //   width: number,
    //   height: number,
    //   align: string,
    //   type: 'url' | 'upload',
    //   fileName?: string
    // }
  };
  
  return (
    <>
      <button onClick={() => setShowVideoDialog(true)}>
        동영상 삽입
      </button>
      
      <VideoUploadDialog
        isOpen={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        onInsert={onVideoInsert}
      />
    </>
  );
}
```

### 동영상 플레이어 사용
```jsx
import VideoPlayer from './VideoPlayer';

function MyContent() {
  return (
    <VideoPlayer
      src="https://www.youtube.com/watch?v=..."
      width={560}
      height={315}
      align="center"
      type="url"
    />
  );
}
```

## 주의사항

1. **파일 크기 제한**: 100MB를 초과하는 파일은 업로드할 수 없습니다.
2. **인증 필요**: 파일 업로드는 인증된 사용자만 가능합니다.
3. **브라우저 호환성**: HTML5 video 태그를 지원하는 브라우저에서만 업로드된 동영상 재생이 가능합니다.
4. **Storage 비용**: Supabase Storage 사용량에 따라 비용이 발생할 수 있습니다. 