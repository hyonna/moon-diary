-- Moon-Mood Diary 테이블 생성
-- Supabase SQL Editor에서 이 스크립트를 실행하세요

CREATE TABLE IF NOT EXISTS diary_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL UNIQUE,
  mood VARCHAR(20) NOT NULL CHECK (mood IN ('new', 'waxing', 'full', 'waning')),
  note TEXT,
  media_urls TEXT[], -- 이미지/동영상 URL 배열
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (날짜로 빠른 조회)
CREATE INDEX IF NOT EXISTS idx_diary_entries_date ON diary_entries(date);

-- RLS (Row Level Security) 활성화
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽고 쓸 수 있도록 정책 설정 (인증 필요 시 수정 가능)
-- 예시: 인증된 사용자만 접근 가능하게 하려면 아래 주석을 해제하고 위의 정책을 삭제하세요

-- 인증된 사용자만 읽기/쓰기 가능 (인증 기능 사용 시)
-- CREATE POLICY "Users can read own entries" ON diary_entries
--   FOR SELECT USING (auth.uid() IS NOT NULL);
-- 
-- CREATE POLICY "Users can insert own entries" ON diary_entries
--   FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
-- 
-- CREATE POLICY "Users can update own entries" ON diary_entries
--   FOR UPDATE USING (auth.uid() IS NOT NULL);

-- 현재는 모든 사용자가 접근 가능 (개인 프로젝트용)
CREATE POLICY "Allow all operations" ON diary_entries
  FOR ALL USING (true) WITH CHECK (true);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_diary_entries_updated_at
  BEFORE UPDATE ON diary_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 기존 테이블에 media_urls 컬럼 추가 (마이그레이션용)
-- 이미 테이블이 생성되어 있다면 이 SQL만 실행하세요
ALTER TABLE diary_entries 
  ADD COLUMN IF NOT EXISTS media_urls TEXT[];
