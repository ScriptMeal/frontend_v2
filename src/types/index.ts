export interface Message {
  role: 'user' | 'assistant'
  content: string
  /**
   * assistant 턴에 한해 저장되는 의도. 즐겨찾기/히스토리 저장 payload 구성에 쓴다.
   * 채팅 요청(`/api/chat/stream`)의 history 에는 포함하지 않는다(role·content 만 전송).
   */
  intent?: Intent
}

export interface Session {
  id: string
  createdAt: string
  preview?: string
}

/** API_SPEC.md — SPECIFIC_FOOD / GENERAL_RECIPE / OFF_TOPIC */
export type Intent = 'SPECIFIC_FOOD' | 'GENERAL_RECIPE' | 'OFF_TOPIC'

/**
 * 히스토리·즐겨찾기 레코드 (API_SPEC.md — 두 엔드포인트 응답 구조 동일).
 */
export interface RecipeRecord {
  id: number
  session_id: string
  user_message: string
  recipe_reply: string
  intent: Intent
  created_at: string
}

export type HistoryRecord = RecipeRecord

/**
 * 즐겨찾기 레코드 — 기본 레코드에 `history_id`(원본 히스토리 레코드의 id)가 추가된다.
 * 읽기전용 채팅 진입 시 이 값으로 어떤 히스토리 턴이 저장됐는지 대조한다.
 */
export type FavoriteRecord = RecipeRecord & { history_id: number }

/** 히스토리 저장 요청 본문 */
export interface SaveHistoryPayload {
  session_id: string
  user_message: string
  recipe_reply: string
  intent: Intent
}

/**
 * 즐겨찾기 저장 요청 본문 — 히스토리 payload + `history_id`(필수).
 * history_id 없는 저장은 금지(UI 게이팅으로 누락 차단). 타입 차원에서도 필수.
 */
export type SaveFavoritePayload = SaveHistoryPayload & { history_id: number }

export interface StreamEvent {
  type: 'tool_start' | 'chunk' | 'done'
  value?: string
  tool?: string
}

/** POST /api/chat/stream 요청 본문 (session_id 미포함 — 세션은 프론트 전담) */
export interface ChatRequest {
  message: string
  history: Message[]
}
