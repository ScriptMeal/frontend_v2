import type { HistoryRecord, Session } from '@/types'

/**
 * DEV 전용 — 백엔드 없이 "과거 세션 조회(읽기 전용)" 흐름을 사이드바에서 그대로
 * 확인하기 위한 mock 기록.
 *
 * - `mockSessions`: 사이드바에 노출할 세션 목록(최신순)
 * - `mockHistoryBySession`: 세션별 `GET /api/history` 응답. API 와 동일하게
 *   **최신순(newest first)** 으로 둔다. `recordToMessages` 가 역순으로 펼쳐
 *   위=오래된 순으로 렌더한다.
 *
 * `seedDevData`(src/lib/devSeed.ts)가 이 데이터를 store·Query 캐시에 시드한다.
 */

function record(over: Partial<HistoryRecord> & Pick<HistoryRecord, 'id' | 'session_id' | 'user_message' | 'recipe_reply'>): HistoryRecord {
  return {
    intent: 'SPECIFIC_FOOD',
    created_at: '2026-06-01T16:00:00.000Z',
    ...over,
  }
}

export const mockHistoryBySession: Record<string, HistoryRecord[]> = {
  'demo-tteokbokki': [
    record({
      id: 12,
      session_id: 'demo-tteokbokki',
      user_message: '양념 더 매콤하게 하려면?',
      recipe_reply:
        '고춧가루 1작은술과 청양고추 1/2개를 추가하면 칼로리는 거의 그대로(+8kcal) 매운맛만 올릴 수 있어요.',
      created_at: '2026-06-01T16:04:00.000Z',
    }),
    record({
      id: 11,
      session_id: 'demo-tteokbokki',
      user_message: '떡볶이 먹고 싶어',
      recipe_reply:
        '## 다이어트 떡볶이\n\n### 재료\n- 곤약 떡 200g (22kcal)\n- 저당 떡볶이양념 100g (55kcal)\n- 어묵 50g (40kcal)\n\n### 조리법\n1. 곤약 떡을 물에 헹군다.\n2. 양념과 물 200ml를 넣고 끓인다.\n3. 어묵을 넣고 5분 더 졸인다.\n\n### 칼로리\n- 곤약 떡 + 양념 + 어묵 = **총 117kcal**\n\n---\n🛒 사용된 제품 구매 정보\n곤약 떡 22kcal | 약 180g 1개 899원 | 쿠팡\n저당 양념 55kcal | 100g 1,200원 | 마켓컬리',
      created_at: '2026-06-01T16:00:00.000Z',
    }),
  ],
  'demo-dubai': [
    record({
      id: 21,
      session_id: 'demo-dubai',
      user_message: '두바이 초콜릿 레시피 알려줘',
      recipe_reply:
        '## 다이어트 두바이 초콜릿\n\n### 재료\n- 카다이프 50g (180kcal)\n- 무설탕 다크초콜릿 80g (320kcal)\n- 피스타치오버터 30g\n\n### 조리법\n1. 카다이프를 팬에 노릇하게 볶는다.\n2. 피스타치오버터와 섞는다.\n3. 녹인 다크초콜릿에 넣어 굳힌다.\n\n---\n🛒 사용된 제품 구매 정보\n무설탕 다크초콜릿 320kcal | 80g 3,900원 | 쿠팡',
      created_at: '2026-06-01T15:40:00.000Z',
    }),
  ],
  'demo-weather': [
    record({
      id: 31,
      session_id: 'demo-weather',
      intent: 'GENERAL_RECIPE',
      user_message: '오늘 날씨에 맞는 메뉴 추천해줘',
      recipe_reply:
        '📅 현재 날짜/시간: 2026년 06월 01일 16:02 | 날씨: 맑음 | 기온: 27.4°C\n\n오늘처럼 따뜻한 날엔 **오이냉국**을 추천드려요.\n\n### 재료\n- 오이 1개 (14kcal)\n- 식초·국간장 약간\n- 얼음물 300ml\n\n### 조리법\n1. 오이를 채 썬다.\n2. 식초·국간장으로 간한다.\n3. 얼음물을 붓는다.',
      created_at: '2026-06-01T15:20:00.000Z',
    }),
  ],
  'demo-chicken': [
    record({
      id: 42,
      session_id: 'demo-chicken',
      user_message: '닭가슴살 질리는데 다른 단백질 없어?',
      recipe_reply:
        '두부(100g 84kcal), 그릭요거트(100g 59kcal), 계란(1개 78kcal)을 번갈아 드시면 질림을 줄일 수 있어요. 특히 두부는 들기름·간장만으로도 든든합니다.',
      created_at: '2026-06-01T15:05:00.000Z',
    }),
    record({
      id: 41,
      session_id: 'demo-chicken',
      user_message: '닭가슴살 요리 추천해줘',
      recipe_reply:
        '## 닭가슴살 데리야키\n\n### 재료\n- 닭가슴살 120g (132kcal)\n- 저당 데리야키소스 20g (18kcal)\n- 양파 1/4개 (12kcal)\n\n### 조리법\n1. 닭가슴살을 한입 크기로 썬다.\n2. 양파와 함께 팬에 굽는다.\n3. 소스를 넣고 졸인다.\n\n### 칼로리\n- 총 **162kcal**',
      created_at: '2026-06-01T15:00:00.000Z',
    }),
  ],
}

/**
 * 로드 실패 UI 확인용 데모 세션 id. `mockHistoryBySession` 에 의도적으로 기록을 두지 않고,
 * DEV 의 `getHistory` 가 이 id 에 대해 결정적으로 throw 하도록 한다(api/user.ts).
 * 사이드바에서 이 세션을 누르면 ReadOnlyChat 의 에러 상태를 볼 수 있다.
 */
export const DEMO_ERROR_SESSION_ID = 'demo-error'

/** 사이드바에 노출할 mock 세션(최신순). preview 는 각 세션의 첫 user 메시지. */
export const mockSessions: Session[] = [
  { id: 'demo-tteokbokki', createdAt: '2026-06-01T16:00:00.000Z', preview: '떡볶이 먹고 싶어' },
  { id: 'demo-dubai', createdAt: '2026-06-01T15:40:00.000Z', preview: '두바이 초콜릿 레시피 알려줘' },
  { id: 'demo-weather', createdAt: '2026-06-01T15:20:00.000Z', preview: '오늘 날씨에 맞는 메뉴 추천해줘' },
  { id: 'demo-chicken', createdAt: '2026-06-01T15:00:00.000Z', preview: '닭가슴살 요리 추천해줘' },
  { id: DEMO_ERROR_SESSION_ID, createdAt: '2026-06-01T14:00:00.000Z', preview: '⚠️ (데모) 로드 실패 세션' },
]
