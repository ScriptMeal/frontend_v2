# API 명세 요약

> 원본: `API_SPEC.md` · Base URL(로컬): `http://localhost:8000` · 인증 없음 · `Content-Type: application/json`
> 세션은 클라이언트가 `session_id` 문자열로 관리.

## 엔드포인트 목록

| Method | Path | 설명 | Swagger |
|---|---|---|---|
| POST | `/api/chat/stream` | 챗봇 스트리밍 응답 (SSE, 주력) | ❌ |
| POST | `/api/chat` | 챗봇 일반 응답 (테스트용) | ✅ |
| POST | `/api/history` | 히스토리 저장 | ✅ |
| GET | `/api/history?session_id=` | 히스토리 조회 (최신순, 최대 30건) | ✅ |
| POST | `/api/favorites` | 즐겨찾기 저장 | ✅ |
| GET | `/api/favorites?session_id=` | 즐겨찾기 조회 (최신순, 전체) | ✅ |
| DELETE | `/api/favorites/{id}` | 즐겨찾기 삭제 | ✅ |
| GET | `/health` | 헬스체크 | ✅ |

## 주요 응답 스키마

### POST `/api/chat/stream` — SSE 이벤트

각 이벤트는 `data: {JSON}\n\n` 형식. 타입 3종:

```jsonc
{ "type": "tool_start", "tool": "get_diet_products" }   // 툴 실행 시작 (로딩 표시용)
{ "type": "chunk",      "value": "## 다이어트 떡볶이\n" } // 텍스트 조각 (누적)
{ "type": "done",       "value": "\n---\n🛒 구매 정보..." } // 종료 + 구매정보(없으면 "")
```

intent는 응답에 없음 → `tool` 값으로 추론:
`get_diet_products`·`search_recipe` → `SPECIFIC_FOOD` / `get_weather_recipe` → `GENERAL_RECIPE` / 툴 없음 → `OFF_TOPIC`

### POST `/api/chat` — 비스트리밍 (테스트용)

```json
{
  "reply": "## 다이어트 떡볶이\n...",
  "intent": "SPECIFIC_FOOD"
}
```

### 히스토리 / 즐겨찾기 레코드 (공통 스키마)

`POST /api/history`, `GET /api/history`, `POST /api/favorites`, `GET /api/favorites` 모두 동일 구조.

```json
{
  "id": 1,
  "session_id": "my-session",
  "user_message": "떡볶이 먹고 싶어",
  "recipe_reply": "## 다이어트 떡볶이\n...",
  "intent": "SPECIFIC_FOOD",
  "created_at": "2026-05-31T16:02:00.000Z"
}
```

- 저장 요청 본문: `session_id`, `user_message`, `recipe_reply`, `intent` (id·created_at은 서버 생성)
- 저장 응답: `201 Created` + 위 레코드
- 조회 응답: `200 OK` + 위 레코드 **배열**

### DELETE `/api/favorites/{id}`

```json
{ "message": "삭제되었습니다." }
```

성공 `200 OK` / 없는 id `404`

### GET `/health`

```json
{ "status": "ok" }
```

## 참고: 레시피 텍스트 포맷

`reply`·`chunk` 누적값은 마크다운. `---` 구분선 기준으로 **레시피 본문 / 구매 정보** 분리 (구매 정보 없으면 `---` 이하 없음).
