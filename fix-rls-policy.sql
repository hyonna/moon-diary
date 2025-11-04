-- RLS 정책 수정/생성
-- Supabase SQL Editor에서 이 스크립트를 실행하세요

-- 기존 정책이 있다면 삭제
DROP POLICY IF EXISTS "Allow all operations" ON diary_entries;

-- 모든 사용자가 읽고 쓸 수 있도록 정책 재생성
CREATE POLICY "Allow all operations" ON diary_entries
  FOR ALL 
  USING (true) 
  WITH CHECK (true);

-- 정책이 제대로 적용되었는지 확인
SELECT * FROM pg_policies WHERE tablename = 'diary_entries';

