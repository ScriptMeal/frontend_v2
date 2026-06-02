import type { Message, RecipeRecord } from '@/types'

/**
 * `GET /api/history`·`GET /api/favorites` 레코드(user_message + recipe_reply 쌍)를
 * 채팅 뷰가 쓰는 `Message[]`(role/content)로 평탄화한다.
 *
 * API_SPEC: 조회 응답은 최신순(newest first)이므로, 위=오래된 순으로 보여주기 위해
 * 역순으로 뒤집은 뒤 각 레코드를 user→assistant 두 메시지로 펼친다.
 */
export function recordToMessages(records: RecipeRecord[]): Message[] {
  return [...records].reverse().flatMap((record) => [
    { role: 'user', content: record.user_message } satisfies Message,
    {
      role: 'assistant',
      content: record.recipe_reply,
      intent: record.intent,
    } satisfies Message,
  ])
}
