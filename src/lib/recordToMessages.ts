import type { Message, RecipeRecord } from '@/types'
import { generateUUID } from '@/lib/utils'

/**
 * `GET /api/history`·`GET /api/favorites` 레코드(user_message + recipe_reply 쌍)를
 * 채팅 뷰가 쓰는 `Message[]`(role/content)로 평탄화한다.
 *
 * API_SPEC: 조회 응답은 최신순(newest first)이므로, 위=오래된 순으로 보여주기 위해
 * 역순으로 뒤집은 뒤 각 레코드를 user→assistant 두 메시지로 펼친다.
 */
export function recordToMessages(records: RecipeRecord[]): Message[] {
  return [...records].reverse().flatMap((record) => [
    { role: 'user', content: record.user_message, clientId: generateUUID() } satisfies Message,
    {
      role: 'assistant',
      content: record.recipe_reply,
      intent: record.intent,
      clientId: generateUUID(),
    } satisfies Message,
  ])
}

/**
 * `recordToMessages` 와 **동일한 reverse+flatten 순서**로,
 * 평탄화된 메시지 배열에서 assistant 메시지의 index → 해당 레코드 id(history_id) 맵을 만든다.
 *
 * 즐겨찾기는 history_id 로 식별되므로, 읽기전용 채팅이 이 맵으로
 * (1) 저장 시 보낼 history_id 와 (2) 이미 저장된 버블 판정을 연결한다.
 * reverse 후 r 번째 레코드는 user=2r, assistant=2r+1 위치를 차지한다(=recordToMessages 와 정합).
 */
export function recordToHistoryIds(records: RecipeRecord[]): Record<number, number> {
  const map: Record<number, number> = {}
  ;[...records].reverse().forEach((record, r) => {
    map[2 * r + 1] = record.id
  })
  return map
}
