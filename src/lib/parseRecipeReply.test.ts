import { describe, it, expect } from 'vitest'
import { parseRecipeReply } from './parseRecipeReply'

describe('parseRecipeReply', () => {
  it('🛒 마커 이후를 구매 항목(name | detail | store)으로 분리한다 (happy — SPECIFIC_FOOD)', () => {
    const content =
      '## 다이어트 떡볶이\n\n### 재료\n- 곤약 떡 200g (22kcal)\n\n' +
      '---\n🛒 사용된 제품 구매 정보\n' +
      '곤약 떡 22kcal | 약 180g 1개 899원 | 쿠팡\n' +
      '저당 양념 55kcal | 100g 1,200원 | 마켓컬리'

    const result = parseRecipeReply(content)

    expect(result.weather).toBeNull()
    expect(result.purchase).toEqual([
      { name: '곤약 떡 22kcal', detail: '약 180g 1개 899원', store: '쿠팡' },
      { name: '저당 양념 55kcal', detail: '100g 1,200원', store: '마켓컬리' },
    ])
    // body 에는 마커·--- 구분선이 남지 않는다
    expect(result.body).toContain('## 다이어트 떡볶이')
    expect(result.body).not.toContain('🛒')
    expect(result.body).not.toContain('---')
  })

  it('📅 헤더 첫 줄을 날씨 정보로 분리한다 (happy — GENERAL_RECIPE)', () => {
    const content =
      '📅 현재 날짜/시간: 2026년 06월 02일 13:40 | 날씨: 맑음 | 기온: 20.0°C\n\n' +
      '오이냉국을 추천드립니다.'

    const result = parseRecipeReply(content)

    expect(result.weather).toEqual({
      datetime: '2026년 06월 02일 13:40',
      weather: '맑음',
      temp: '20.0°C',
    })
    expect(result.body).toBe('오이냉국을 추천드립니다.')
    expect(result.purchase).toEqual([])
  })

  it('마커가 없으면 본문 전체를 body 로 두고 weather/purchase 는 비운다 (OFF_TOPIC)', () => {
    const content = '스플렌다는 설탕 대체 감미료로 칼로리가 거의 없습니다.'

    const result = parseRecipeReply(content)

    expect(result.weather).toBeNull()
    expect(result.purchase).toEqual([])
    expect(result.body).toBe(content)
  })

  it('빈 문자열도 예외 없이 처리한다 (edge)', () => {
    const result = parseRecipeReply('')
    expect(result).toEqual({ weather: null, body: '', purchase: [] })
  })

  it('구매 항목에 store 가 없어도 빈 문자열로 채운다 (edge)', () => {
    const content = '🛒 사용된 제품 구매 정보\n현미곤약밥 130kcal | 150g 1,500원'

    const result = parseRecipeReply(content)

    expect(result.purchase).toEqual([
      { name: '현미곤약밥 130kcal', detail: '150g 1,500원', store: '' },
    ])
  })

  it('스트리밍 중 📅 줄이 줄바꿈 전이라도 가능한 필드만 채운다 (edge)', () => {
    const content = '📅 현재 날짜/시간: 2026년 06월 02일 13:40'

    const result = parseRecipeReply(content)

    expect(result.weather).toEqual({
      datetime: '2026년 06월 02일 13:40',
      weather: '',
      temp: '',
    })
    expect(result.body).toBe('')
  })
})
