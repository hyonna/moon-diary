# Supabase MCP 서버 설정 가이드

## 설치 방법

Supabase MCP 서버는 npm 패키지가 아닌 **HTTP 서버**로 제공됩니다. Cursor에서 연결하는 방법은 다음과 같습니다:

### 방법 1: Supabase 대시보드에서 자동 설정 (권장)

1. [Supabase 대시보드](https://app.supabase.com)에 로그인
2. 프로젝트 선택
3. 왼쪽 메뉴에서 **"Connect"** 클릭
4. **"MCP"** 탭 선택
5. 원하는 기능 그룹 선택
6. **Cursor**에 대한 원클릭 설치 프로그램 사용

### 방법 2: 수동 설정

1. **Cursor 설정 열기**
   - Cursor 메뉴 → Settings → MCP

2. **새 MCP 서버 추가**
   - "Add New MCP Server" 클릭
   - 이름: `supabase`
   - Type: `http`
   - URL: `https://mcp.supabase.com/mcp`

3. **인증**
   - 설정 중 브라우저 창이 열리며 Supabase에 로그인 요청
   - 로그인 후 MCP 클라이언트에 대한 액세스 허용
   - 작업할 프로젝트가 포함된 조직 선택

### 프로젝트별 설정

프로젝트 루트에 `.cursor/mcp.json` 파일이 생성되어 있습니다:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

### 참고

- 로컬 Supabase CLI를 사용하는 경우: `http://localhost:54321/mcp` 사용 가능
- 보안 모범 사례: AI 도구와 Supabase를 연결할 때 보안 위험을 고려하세요

## 추가 정보

- [Supabase MCP 문서](https://supabase.com/features/mcp-server)
- [Cursor MCP 문서](https://docs.cursor.com)

