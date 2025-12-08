-- NextAuth 사용 시 RLS 정책 수정
-- Supabase SQL Editor에서 이 스크립트를 실행하세요

-- 1. user_id 컬럼 추가 (없는 경우)
ALTER TABLE diary_entries 
  ADD COLUMN IF NOT EXISTS user_id UUID;

-- 2. user_id에 인덱스 추가 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_diary_entries_user_id ON diary_entries(user_id);

-- 3. 기존 RLS 정책 삭제
DROP POLICY IF EXISTS "Allow all operations" ON diary_entries;
DROP POLICY IF EXISTS "Users can read own entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can insert own entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can update own entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can delete own entries" ON diary_entries;

-- 4. NextAuth 사용 시 모든 작업 허용 정책 생성
-- (NextAuth는 Supabase auth를 사용하지 않으므로 auth.uid()가 작동하지 않음)
CREATE POLICY "Allow all operations for NextAuth" ON diary_entries
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 5. 정책 확인
SELECT * FROM pg_policies WHERE tablename = 'diary_entries';

