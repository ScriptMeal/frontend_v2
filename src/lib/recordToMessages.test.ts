import { describe, it, expect } from 'vitest'
import { recordToMessages } from './recordToMessages'
import type { HistoryRecord } from '@/types'

function makeRecord(over: Partial<HistoryRecord>): HistoryRecord {
  return {
    id: 1,
    session_id: 's1',
    user_message: 'u',
    recipe_reply: 'r',
    intent: 'OFF_TOPIC',
    created_at: '2026-06-01T00:00:00Z',
    ...over,
  }
}

describe('recordToMessages', () => {
  it('레코드 1건을 user→assistant 메시지 2건으로 평탄화한다 (happy)', () => {
    const records = [makeRecord({ user_message: '떡볶이', recipe_reply: '## 떡볶이' })]
    expect(recordToMessages(records)).toEqual([
      { role: 'user', content: '떡볶이' },
      { role: 'assistant', content: '## 떡볶이' },
    ])
  })

  it('API 최신순 정렬을 오래된→최신 순으로 뒤집어 렌더한다 (edge)', () => {
    // API_SPEC: GET /api/history 는 최신순(newest first). 채팅은 위=오래된 순.
    const records = [
      makeRecord({ id: 2, user_message: '둘째', recipe_reply: '둘째답' }),
      makeRecord({ id: 1, user_message: '첫째', recipe_reply: '첫째답' }),
    ]
    expect(recordToMessages(records)).toEqual([
      { role: 'user', content: '첫째' },
      { role: 'assistant', content: '첫째답' },
      { role: 'user', content: '둘째' },
      { role: 'assistant', content: '둘째답' },
    ])
  })

  it('빈 배열이면 빈 메시지 배열을 반환한다 (edge)', () => {
    expect(recordToMessages([])).toEqual([])
  })
})
