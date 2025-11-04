-- media_urls 컬럼 추가 (Supabase SQL Editor에서 실행)
-- 이 SQL을 실행하여 media_urls 컬럼을 추가하세요

-- 컬럼이 이미 존재하는지 확인하고 없으면 추가
ALTER TABLE diary_entries 
  ADD COLUMN IF NOT EXISTS media_urls TEXT[];

-- 컬럼이 제대로 추가되었는지 확인
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'diary_entries' 
  AND column_name = 'media_urls';

-- 참고: Supabase 대시보드에서 Table Editor를 새로고침하면 
-- 스키마 캐시가 업데이트됩니다.

