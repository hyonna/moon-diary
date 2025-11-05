# NextAuth.js 설정 가이드

이 프로젝트는 NextAuth.js와 Supabase를 함께 사용하여 JWT 기반 인증을 구현합니다.

## 환경 변수 설정

`.env.local` 파일에 다음 환경 변수를 추가하세요:

```env
# 기존 Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# NextAuth.js 설정
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
```

## NEXTAUTH_SECRET 생성 방법

터미널에서 다음 명령어를 실행하여 안전한 시크릿 키를 생성하세요:

```bash
openssl rand -base64 32
```

또는 온라인 생성기를 사용할 수 있습니다:
- https://generate-secret.vercel.app/32

## 프로덕션 환경 설정

프로덕션 환경에서는 `NEXTAUTH_URL`을 실제 도메인으로 변경하세요:

```env
NEXTAUTH_URL=https://your-domain.com
```

## 작동 방식

1. **인증 흐름**:
   - 사용자가 로그인 시도 → NextAuth.js Credentials Provider
   - Credentials Provider가 Supabase Auth로 인증 요청
   - 인증 성공 시 JWT 토큰 생성 (NextAuth.js)
   - JWT 토큰에 사용자 정보 (id, email, nickname) 저장

2. **세션 관리**:
   - NextAuth.js가 JWT 기반 세션 관리
   - 세션은 30일간 유지
   - 세션 갱신 시 Supabase에서 최신 프로필 정보 가져오기

3. **Supabase 통합**:
   - Supabase는 데이터베이스 및 RLS 정책 용도로 사용
   - NextAuth.js는 인증 및 세션 관리 용도로 사용
   - 두 시스템이 함께 작동하여 안전한 인증 제공

## API 라우트

NextAuth.js API 라우트는 `/api/auth/[...nextauth]`에 위치합니다:
- `GET /api/auth/session` - 현재 세션 정보 조회
- `POST /api/auth/signin` - 로그인
- `POST /api/auth/signout` - 로그아웃
- `GET /api/auth/csrf` - CSRF 토큰

## 사용 예시

```typescript
import { useSession } from 'next-auth/react'

function MyComponent() {
  const { data: session, status } = useSession()

  if (status === 'loading') return <div>Loading...</div>
  if (status === 'unauthenticated') return <div>Please sign in</div>

  return <div>Welcome {session?.user?.nickname}!</div>
}
```

## 문제 해결

### "NEXTAUTH_SECRET is not set" 오류
- `.env.local` 파일에 `NEXTAUTH_SECRET`이 설정되어 있는지 확인
- 개발 서버를 재시작하세요

### 세션이 유지되지 않는 경우
- `NEXTAUTH_URL`이 올바르게 설정되어 있는지 확인
- 브라우저 쿠키가 활성화되어 있는지 확인

### Supabase 인증 오류
- Supabase 프로젝트 설정 확인
- RLS 정책이 올바르게 설정되어 있는지 확인

