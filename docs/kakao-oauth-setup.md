# 카카오 로그인 설정 가이드

이 가이드는 Supabase와 카카오 로그인을 연동하는 방법을 설명합니다.

## 1. 카카오 개발자 계정 설정

1. [카카오 개발자 사이트](https://developers.kakao.com/)에 로그인합니다.
2. 애플리케이션 추가를 클릭하고 앱을 생성합니다.
3. 생성된 앱의 '앱 키' 섹션에서 'REST API 키'를 확인합니다 (Client ID로 사용됩니다).
4. '제품 설정' > '카카오 로그인'으로 이동합니다.
5. '활성화 설정'에서 카카오 로그인을 활성화합니다.
6. 'Redirect URI'에 다음 URL을 추가합니다:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
7. '동의항목'에서 필요한 항목(이메일, 프로필 정보 등)을 설정합니다.

## 2. Supabase 설정

1. [Supabase 대시보드](https://app.supabase.com/)에 로그인합니다.
2. 해당 프로젝트로 이동합니다.
3. 왼쪽 메뉴에서 'Authentication' > 'Providers'로 이동합니다.
4. 'Kakao' 제공자를 찾아 활성화합니다.
5. 카카오 개발자 사이트에서 얻은 'REST API 키'를 'Client ID' 필드에 입력합니다.
6. 카카오 개발자 사이트의 '제품 설정' > '카카오 로그인' > '보안'에서 'Client Secret'을 생성하고, Supabase의 'Client Secret' 필드에 입력합니다.
7. 'Redirect URL'은 자동으로 생성됩니다. 이 URL을 카카오 개발자 사이트의 'Redirect URI'에 등록했는지 확인하세요.
8. '저장' 버튼을 클릭하여 설정을 완료합니다.

## 3. 환경 변수 설정

프로젝트의 루트 디렉토리에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<your-supabase-project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
NEXT_PUBLIC_SITE_URL=<your-site-url> # 개발 시에는 http://localhost:3000
```

## 4. 테스트

1. 애플리케이션을 실행합니다: `npm run dev`
2. `/client/auth` 페이지로 이동하여 '카카오로 로그인' 버튼을 클릭합니다.
3. 카카오 로그인 페이지로 리다이렉션되어 로그인 프로세스를 완료한 후, 애플리케이션으로 다시 리다이렉션되어야 합니다.

## 문제 해결

- **리다이렉션 오류**: 카카오 개발자 사이트의 Redirect URI와 Supabase 설정이 정확히 일치하는지 확인하세요.
- **권한 오류**: 카카오 개발자 사이트에서 필요한 동의항목이 올바르게 설정되었는지 확인하세요.
- **로그인 실패**: 브라우저 콘솔과 서버 로그를 확인하여 오류 메시지를 확인하세요. 