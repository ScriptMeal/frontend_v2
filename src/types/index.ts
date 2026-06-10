export interface Message {
  role: 'user' | 'assistant'
  content: string
  /**
   * assistant 턴에 한해 저장되는 의도. 즐겨찾기/히스토리 저장 payload 구성에 쓴다.
   * 채팅 요청(`/api/chat/stream`)의 history 에는 포함하지 않는다(role·content 만 전송).
   */
  intent?: Intent
  /**
   * 메시지 생성 시점에 고정되는 클라이언트 측 안정 식별자.
   * React key 의 입력으로 사용해, history_id 도착 등 생애주기 도중 데이터 변경에 의한
   * 의도치 않은 remount 를 방지한다. addMessage / recordToMessages 에서 자동 부여된다.
   */
  clientId: string
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
  /** 요청에는 role·content 만 전송한다(intent·clientId 등 로컬 메타 제외). */
  history: Pick<Message, 'role' | 'content'>[]
}
