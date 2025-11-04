-- 같은 날짜에 여러 일기 허용하도록 UNIQUE 제약조건 제거
-- Supabase SQL Editor에서 이 스크립트를 실행하세요

-- 기존 UNIQUE 제약조건 제거
ALTER TABLE diary_entries 
  DROP CONSTRAINT IF EXISTS diary_entries_date_key;

-- date 컬럼에 UNIQUE 인덱스가 있다면 제거
DROP INDEX IF EXISTS diary_entries_date_key;

-- 참고: 이제 같은 날짜에 여러 개의 일기를 저장할 수 있습니다.
-- 각 일기는 고유한 ID로 구분됩니다.

