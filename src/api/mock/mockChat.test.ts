import { describe, it, expect } from 'vitest'
import { mockStreamChat, mockScenarios } from './mockChat'
import type { StreamEvent } from '@/types'

async function collect(message: string): Promise<StreamEvent[]> {
  const events: StreamEvent[] = []
  for await (const event of mockStreamChat({ message, history: [] }, { delayMs: 0 })) {
    events.push(event)
  }
  return events
}

describe('mockStreamChat', () => {
  it('특정 음식("떡볶이") → get_diet_products 툴 + done 에 구매정보가 담긴다 (happy)', async () => {
    const events = await collect('떡볶이 먹고 싶어')
    expect(events[0]).toEqual({ type: 'tool_start', tool: 'get_diet_products' })
    expect(events.some((e) => e.type === 'chunk')).toBe(true)
    const done = events.at(-1)
    expect(done?.type).toBe('done')
    expect(done?.value).toContain('구매 정보')
  })

  it('날씨 추천 → get_weather_recipe 툴 + 빈 done (edge: 구매정보 없음)', async () => {
    const events = await collect('오늘 날씨에 맞는 메뉴 추천해줘')
    expect(events[0]).toEqual({ type: 'tool_start', tool: 'get_weather_recipe' })
    expect(events.at(-1)).toEqual({ type: 'done', value: '' })
  })

  it('오프토픽/후속질문 → tool_start 없이 chunk + done 만 (edge)', async () => {
    const events = await collect('스플렌다가 뭐야?')
    expect(events.some((e) => e.type === 'tool_start')).toBe(false)
    expect(events.at(-1)?.type).toBe('done')
  })

  it('"에러" 키워드 → 스트림이 예외를 던진다 (error)', async () => {
    await expect(collect('에러 테스트')).rejects.toThrow()
  })

  it('mockScenarios 는 데모 버튼용 시나리오 목록을 노출한다', () => {
    expect(mockScenarios.length).toBeGreaterThan(0)
    for (const s of mockScenarios) {
      expect(s.id).toBeTruthy()
      expect(s.label).toBeTruthy()
      expect(s.message).toBeTruthy()
    }
  })
})
