export interface Message {
  role: 'user' | 'assistant'
  content: string
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
export type FavoriteRecord = RecipeRecord

/** 히스토리·즐겨찾기 저장 요청 본문 */
export interface SaveRecipePayload {
  session_id: string
  user_message: string
  recipe_reply: string
  intent: Intent
}

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
