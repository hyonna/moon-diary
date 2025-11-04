# Supabase Storage 정책 설정 가이드

## Storage 버킷 정책 설정

1. Supabase 대시보드 → **Storage** → **Policies** 이동
2. `diary-media` 버킷 선택
3. **New Policy** 클릭

### 정책 1: 파일 읽기 (SELECT)
- **Policy name**: Allow public read access
- **Allowed operations**: SELECT
- **Policy definition**: `true`

### 정책 2: 파일 업로드 (INSERT)
- **Policy name**: Allow public uploads
- **Allowed operations**: INSERT
- **Policy definition**: `true`

### 정책 3: 파일 업데이트 (UPDATE)
- **Policy name**: Allow public updates
- **Allowed operations**: UPDATE
- **Policy definition**: `true`

### 정책 4: 파일 삭제 (DELETE)
- **Policy name**: Allow public deletes
- **Allowed operations**: DELETE
- **Policy definition**: `true`

또는 더 간단하게:

### 모든 작업 허용 정책
- **Policy name**: Allow all storage operations
- **Allowed operations**: SELECT, INSERT, UPDATE, DELETE
- **Policy definition**: `true`

## 참고
- 개인 프로젝트용이므로 모든 사용자에게 접근 권한을 부여합니다.
- 프로덕션 환경에서는 인증된 사용자만 접근 가능하도록 정책을 수정하세요.

