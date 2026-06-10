import { describe, it, expect } from 'vitest'
import { recordToMessages, recordToHistoryIds } from './recordToMessages'
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
  it('레코드 1건을 user→assistant 메시지 2건으로 평탄화하고 assistant 에 intent 를 담는다 (happy)', () => {
    const records = [
      makeRecord({ user_message: '떡볶이', recipe_reply: '## 떡볶이', intent: 'SPECIFIC_FOOD' }),
    ]
    expect(recordToMessages(records)).toEqual([
      { role: 'user', content: '떡볶이', clientId: expect.any(String) },
      { role: 'assistant', content: '## 떡볶이', intent: 'SPECIFIC_FOOD', clientId: expect.any(String) },
    ])
  })

  it('API 최신순 정렬을 오래된→최신 순으로 뒤집어 렌더한다 (edge)', () => {
    // API_SPEC: GET /api/history 는 최신순(newest first). 채팅은 위=오래된 순.
    const records = [
      makeRecord({ id: 2, user_message: '둘째', recipe_reply: '둘째답' }),
      makeRecord({ id: 1, user_message: '첫째', recipe_reply: '첫째답' }),
    ]
    expect(recordToMessages(records)).toEqual([
      { role: 'user', content: '첫째', clientId: expect.any(String) },
      { role: 'assistant', content: '첫째답', intent: 'OFF_TOPIC', clientId: expect.any(String) },
      { role: 'user', content: '둘째', clientId: expect.any(String) },
      { role: 'assistant', content: '둘째답', intent: 'OFF_TOPIC', clientId: expect.any(String) },
    ])
  })

  it('빈 배열이면 빈 메시지 배열을 반환한다 (edge)', () => {
    expect(recordToMessages([])).toEqual([])
  })
})

describe('recordToHistoryIds', () => {
  it('recordToMessages 와 동일한 순서로 assistant 메시지 index → history_id 를 만든다 (happy)', () => {
    // recordToMessages 가 reverse+flatten 하므로, 최신순 입력의 assistant index 는 2*r+1
    const records = [
      makeRecord({ id: 2, user_message: '둘째' }),
      makeRecord({ id: 1, user_message: '첫째' }),
    ]
    // 뒤집힌 순서: [첫째(id1)=assistant idx1, 둘째(id2)=assistant idx3]
    expect(recordToHistoryIds(records)).toEqual({ 1: 1, 3: 2 })
  })

  it('messages 의 assistant 위치와 정확히 정렬된다 (정합성, edge)', () => {
    const records = [
      makeRecord({ id: 2, recipe_reply: '둘째답' }),
      makeRecord({ id: 1, recipe_reply: '첫째답' }),
    ]
    const messages = recordToMessages(records)
    const ids = recordToHistoryIds(records)
    // 맵의 각 key 위치 메시지는 assistant 여야 하고, 그 외 index 엔 키가 없어야 한다
    messages.forEach((m, i) => {
      if (m.role === 'assistant') expect(ids).toHaveProperty(String(i))
      else expect(ids).not.toHaveProperty(String(i))
    })
  })

  it('빈 배열이면 빈 맵을 반환한다 (edge)', () => {
    expect(recordToHistoryIds([])).toEqual({})
  })
})
