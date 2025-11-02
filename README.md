# moon-diary

moon-diary는 하루의 감정을 달의 모양으로 기록하고 시각화하는 감정 일기 프로젝트입니다. 하루의 감정이 쌓여 하나의 달 주기를 이루며, 시간에 따라 변화하는 감정의 흐름을 직관적으로 볼 수 있습니다.

## 감정 매핑

- 🌑 **신월** → 우울/무기력
- 🌓 **상현달** → 집중/성취
- 🌕 **보름달** → 기쁨/에너지 충만
- 🌗 **하현달** → 평온/안정

## 기능

- ✨ 달의 모양으로 감정 상태 선택 및 기록
- 📅 캘린더 형태로 지난 감정들을 한눈에 보기
- 📊 감정 통계 및 시각화 (파이 차트)
- 📝 간단한 메모 작성

## 기술 스택

- **Frontend**: Next.js 16, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Charts**: Recharts
- **Backend**: Supabase

## 시작하기

### 1. 의존성 설치

```bash
pnpm install
```

### 2. Supabase 설정

1. [Supabase](https://supabase.com)에서 새 프로젝트를 생성합니다.
2. 프로젝트의 **Settings > API**에서 다음 정보를 확인합니다:
   - `Project URL` (예: `https://xxxxx.supabase.co`)
   - `anon public` key
3. 프로젝트 루트에 `.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. 데이터베이스 테이블 생성

Supabase 대시보드의 **SQL Editor**에서 `supabase-schema.sql` 파일의 내용을 실행합니다.

### 4. 개발 서버 실행

```bash
pnpm dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인합니다.

## 프로젝트 구조

```
src/
├── app/                  # Next.js App Router 페이지
│   ├── page.tsx         # 홈 페이지
│   ├── diary/           # 일기 페이지
│   │   └── page.tsx
│   └── layout.tsx       # 루트 레이아웃
├── components/           # React 컴포넌트
│   ├── DiaryForm.tsx    # 일기 작성 폼
│   ├── MoodSelector.tsx # 감정 선택 컴포넌트
│   ├── CalendarView.tsx # 캘린더 뷰
│   └── StatisticsChart.tsx # 통계 차트
├── lib/                  # 유틸리티 및 클라이언트
│   └── supabase.ts      # Supabase 클라이언트 및 서비스
└── types/                # TypeScript 타입 정의
    └── diary.ts          # 일기 관련 타입
```

## 주요 기능 설명

### 일기 작성 (DiaryForm)
- 오늘 날짜의 감정 상태를 선택하고 메모를 기록할 수 있습니다.
- 이미 기록이 있는 경우 자동으로 불러와서 수정할 수 있습니다.

### 캘린더 뷰 (CalendarView)
- 선택한 월의 모든 날짜를 캘린더 형태로 표시합니다.
- 기록된 날짜는 해당하는 달의 이모지가 표시됩니다.
- 오늘 날짜는 보라색 테두리로 강조됩니다.

### 통계 차트 (StatisticsChart)
- 지금까지 기록한 모든 감정 상태를 파이 차트로 시각화합니다.
- 각 감정 상태별로 몇 일을 기록했는지 확인할 수 있습니다.
