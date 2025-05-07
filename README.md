# 리뷰 커뮤니티 플랫폼

리뷰 커뮤니티 플랫폼은 관리자, 광고주, 리뷰어가 각각의 역할에 맞게 사용할 수 있는 웹 서비스입니다.

## 주요 기능

### 관리자
- 리뷰 목록 관리
- 회원 관리
- 회원 이력 검색

### 광고주
- 리뷰 목록 확인
- 회원 이력 검색

### 리뷰어
- 리뷰 목록 확인
- 참여 이력 확인

## 프로젝트 구조

```
/
├── app/                    # Next.js App Router 디렉토리
│   ├── admin/              # 관리자 관련 페이지
│   │   ├── auth/           # 관리자 인증
│   │   ├── history/        # 회원 이력 관리
│   │   ├── members/        # 회원 관리
│   │   └── reviews/        # 리뷰 관리
│   ├── provider/           # 광고주 관련 페이지
│   │   ├── auth/           # 광고주 인증
│   │   ├── history/        # 회원 이력 확인
│   │   └── reviews/        # 리뷰 확인
│   ├── client/             # 리뷰어 관련 페이지
│   │   ├── auth/           # 리뷰어 인증
│   │   ├── participation/  # 참여 이력
│   │   └── reviews/        # 리뷰 확인
│   ├── layout.tsx          # 앱 레이아웃
│   └── page.tsx            # 메인 페이지
├── components/             # 공통 컴포넌트
│   ├── ui/                 # UI 컴포넌트
│   ├── common/             # 공통 사용 컴포넌트
│   └── layout/             # 레이아웃 컴포넌트
├── lib/                    # 유틸리티 라이브러리
├── types/                  # 타입 정의
└── utils/                  # 유틸리티 함수
```

## 기술 스택

- **프레임워크**: Next.js (App Router)
- **스타일링**: Tailwind CSS
- **UI 컴포넌트**: shadcn/ui
- **백엔드**: Supabase
- **인증**: Supabase Auth
- **언어**: TypeScript

## 로컬 개발 환경 설정

1. 저장소 클론
   ```bash
   git clone [repository-url]
   cd [repository-name]
   ```

2. 의존성 설치
   ```bash
   npm install
   ```

3. 환경 변수 설정
   `.env.local` 파일을 생성하고 다음 변수를 설정합니다:
   ```
   NEXT_PUBLIC_SUPABASE_URL=[YOUR_SUPABASE_URL]
   NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR_SUPABASE_ANON_KEY]
   ```

4. 개발 서버 실행
   ```bash
   npm run dev
   ```

5. 브라우저에서 [http://localhost:3000](http://localhost:3000)로 접속합니다.

## 배포

프로젝트는 Vercel을 통해 배포할 수 있습니다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=[repository-url])
