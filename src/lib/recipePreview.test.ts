import { describe, it, expect } from 'vitest'
import { recipePreview } from './recipePreview'

describe('recipePreview', () => {
  it('첫 본문 줄에서 마크다운 마커를 제거해 한 줄 미리보기를 만든다 (happy)', () => {
    const reply =
      '## 다이어트 떡볶이\n\n### 재료\n- 곤약 떡 200g (22kcal)\n' +
      '\n---\n🛒 사용된 제품 구매 정보\n곤약 떡 22kcal | 약 180g 1개 899원 | 쿠팡'

    // 헤딩(#)·구매 정보(🛒)는 제외하고 제목 텍스트만 남는다
    expect(recipePreview(reply)).toBe('다이어트 떡볶이')
  })

  it('날씨 헤더(📅)는 건너뛰고 본문 첫 줄을 쓴다 (edge — GENERAL_RECIPE)', () => {
    const reply =
      '📅 현재 날짜/시간: 2026년 06월 01일 16:02 | 날씨: 맑음 | 기온: 27.4°C\n\n' +
      '오늘처럼 따뜻한 날엔 **오이냉국**을 추천드려요.\n'

    expect(recipePreview(reply)).toBe('오늘처럼 따뜻한 날엔 오이냉국을 추천드려요.')
  })

  it('본문이 비면 빈 문자열을 반환한다 (edge — 빈 입력)', () => {
    expect(recipePreview('')).toBe('')
  })

  it('maxLength 를 넘으면 말줄임표를 붙인다 (boundary)', () => {
    const reply = '가나다라마바사아자차카타파하'
    expect(recipePreview(reply, 5)).toBe('가나다라마…')
  })
})
