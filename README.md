# moon-diary

moon-diary는 하루의 감정을 달의 모양으로 기록하고 시각화하는 감정 일기 프로젝트입니다. 하루의 감정이 쌓여 하나의 달 주기를 이루며, 시간에 따라 변화하는 감정의 흐름을 직관적으로 볼 수 있습니다.

## 감정 매핑

- 🌑 **신월** → 우울/무기력
- 🌓 **상현달** → 집중/성취
- 🌕 **보름달** → 기쁨/에너지 충만
- 🌗 **하현달** → 평온/안정

## 주요 기능

- 🔐 **인증 시스템**: NextAuth.js 기반 로그인/회원가입
- ✨ **감정 기록**: 달의 모양으로 감정 상태 선택 및 기록
- 📝 **일기 작성**: 텍스트 메모 및 이미지/동영상 첨부
- 📅 **캘린더 뷰**: 지난 감정들을 캘린더 형태로 한눈에 보기
- 📊 **통계 분석**: 감정 통계, 차트 시각화, AI 기반 감정 분석
- 👤 **프로필 관리**: 닉네임 수정, 통계 조회, 회원탈퇴
- 🌙 **평균 감정**: 우주 배경과 함께 평균 감정 달 이모지 표시
- 🎲 **랜덤 일기**: 과거 일기 랜덤 보기 기능
- 🌓 **다크 모드**: 라이트/다크 테마 지원

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Charts**: Recharts
- **3D Graphics**: Three.js, React Three Fiber
- **Authentication**: NextAuth.js v5
- **Backend**: Supabase (Database, Storage)
- **Form Handling**: React Hook Form

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. 환경 변수 설정

프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# NextAuth.js 설정
NEXTAUTH_SECRET=your_nextauth_secret_here
NEXTAUTH_URL=http://localhost:3000
AUTH_SECRET=your_auth_secret_here
```

**환경 변수 가져오기:**

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. 프로젝트의 **Settings > API**에서 다음 정보를 확인합니다:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

**⚠️ 보안 주의사항:**

- `.env.local` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 포함되어 있어야 합니다)
- 프로덕션 환경에서는 환경 변수를 안전하게 관리하세요

**NEXTAUTH_SECRET 생성:**
터미널에서 다음 명령어를 실행하여 안전한 시크릿 키를 생성하세요:

```bash
openssl rand -base64 32
```

### 3. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 프로젝트 구조

```
src/
├── app/                      # Next.js App Router 페이지
│   ├── page.tsx             # 홈 페이지 (일기 피드)
│   ├── login/               # 로그인 페이지
│   ├── signup/              # 회원가입 페이지
│   ├── write/               # 일기 작성 페이지
│   │   ├── page.tsx
│   │   └── WriteContent.tsx
│   ├── diary/               # 일기 페이지 (캘린더 뷰)
│   ├── profile/             # 프로필 및 통계 페이지
│   ├── api/                 # API 라우트
│   │   ├── auth/            # NextAuth API
│   │   └── account/         # 계정 관리 API
│   ├── Providers.tsx        # 프로바이더 설정
│   └── layout.tsx           # 루트 레이아웃
├── components/               # React 컴포넌트
│   ├── DiaryFeed.tsx        # 일기 피드 컴포넌트
│   ├── DiaryForm.tsx        # 일기 작성 폼
│   ├── MoodSelector.tsx     # 감정 선택 컴포넌트
│   ├── CalendarView.tsx     # 캘린더 뷰
│   ├── StatisticsChart.tsx  # 통계 차트
│   ├── BottomNavigation.tsx # 하단 네비게이션
│   ├── DateFilter.tsx       # 날짜 필터
│   ├── RandomDiaryModal.tsx # 랜덤 일기 모달
│   └── ThemeToggle.tsx      # 테마 토글
├── contexts/                 # React Context
│   ├── AuthContext.tsx      # 인증 컨텍스트
│   └── ThemeContext.tsx     # 테마 컨텍스트
├── lib/                      # 유틸리티 및 클라이언트
│   ├── supabase.ts          # Supabase 클라이언트 및 서비스
│   ├── supabaseAdmin.ts     # Supabase Admin 클라이언트
│   ├── auth.ts              # NextAuth 설정
│   ├── analyzeStats.ts      # 통계 분석 유틸리티
│   └── dateUtils.ts         # 날짜 유틸리티
└── types/                    # TypeScript 타입 정의
    ├── diary.ts              # 일기 관련 타입
    └── next-auth.d.ts        # NextAuth 타입 확장
```

## 주요 기능 설명

### 인증 시스템

- **로그인/회원가입**: 이메일과 비밀번호 기반 인증
- **세션 관리**: NextAuth.js를 통한 JWT 기반 세션 관리 (30일 유지)
- **프로필 관리**: 닉네임 수정, 회원탈퇴 기능

### 일기 작성 (/write)

- 날짜 선택: 원하는 날짜를 선택하여 일기 작성 가능
- 감정 선택: 달의 모양(신월, 상현달, 보름달, 하현달)으로 감정 상태 선택
- 메모 작성: 텍스트 메모 작성
- 미디어 첨부: 이미지 및 동영상 업로드 (최대 100MB)
- 여러 일기: 같은 날짜에 여러 개의 일기 작성 가능

### 일기 피드 (홈)

- 최신순으로 일기 목록 표시
- 날짜 필터: 월별로 일기 필터링
- 랜덤 일기: 과거 일기 랜덤 보기 기능
- 일기 수정/삭제: 각 일기별 수정 및 삭제 기능

### 캘린더 뷰 (/diary)

- 선택한 월의 모든 날짜를 캘린더 형태로 표시
- 기록된 날짜는 해당하는 달의 이모지가 표시됩니다
- 오늘 날짜는 강조 표시됩니다

### 통계 및 프로필 (/profile)

- **통계 요약**:
  - 우주 배경과 함께 평균 감정 달 이모지 표시
  - 총 기록일, 기록률 표시
  - AI 기반 감정 분석 요약
- **감정별 통계**: 각 감정별 기록일 수 및 비율 표시
- **기간별 통계**: 월별/년별/전체 기간 선택 가능
- **활동 차트**: 월별/년별 활동을 막대 차트로 시각화
- **일별 감정 기록**: 월별 모드에서 날짜별 감정 목록 표시
- **캘린더 뷰**: 선택한 월의 캘린더와 평균 감정 이모지 표시

## 라이선스

이 프로젝트는 개인 프로젝트입니다.
