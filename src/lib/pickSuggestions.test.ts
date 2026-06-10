import { describe, it, expect } from 'vitest'
import { pickSuggestions } from './pickSuggestions'
import { suggestedQuestions } from './suggestedQuestions'
import type { SuggestionPool } from './suggestedQuestions'

// 무작위 함수라 단일 실행만으로는 불변식을 확신할 수 없다 → 여러 번 돌려 매번 성립하는지 본다.
const RUNS = 50

const pool: SuggestionPool = {
  specificFood: ['특정1', '특정2', '특정3', '특정4', '특정5'],
  generalRecipe: ['조건1', '조건2', '조건3', '조건4', '조건5'],
}

describe('pickSuggestions', () => {
  it('기본값으로 3개를 반환한다 (happy)', () => {
    expect(pickSuggestions(pool)).toHaveLength(3)
  })

  it('항상 specific_food 2 : general_recipe 1 비율을 지킨다 (여러 번 실행)', () => {
    for (let i = 0; i < RUNS; i++) {
      const picked = pickSuggestions(pool)
      const specific = picked.filter((q) => q.intent === 'SPECIFIC_FOOD')
      const general = picked.filter((q) => q.intent === 'GENERAL_RECIPE')
      expect(specific).toHaveLength(2)
      expect(general).toHaveLength(1)
    }
  })

  it('결과에 중복이 없다 (여러 번 실행)', () => {
    for (let i = 0; i < RUNS; i++) {
      const picked = pickSuggestions(pool)
      const texts = picked.map((q) => q.text)
      expect(new Set(texts).size).toBe(texts.length)
    }
  })

  it('카테고리별 개수를 직접 지정할 수 있다', () => {
    const picked = pickSuggestions(pool, { specificFood: 3, generalRecipe: 2 })
    expect(picked.filter((q) => q.intent === 'SPECIFIC_FOOD')).toHaveLength(3)
    expect(picked.filter((q) => q.intent === 'GENERAL_RECIPE')).toHaveLength(2)
  })

  it('한 풀이 요청 개수보다 적어도 교차 채움 없이 가능한 만큼만 반환한다 (edge)', () => {
    const small: SuggestionPool = { specificFood: ['a'], generalRecipe: ['b', 'c'] }
    const picked = pickSuggestions(small, { specificFood: 2, generalRecipe: 1 })
    // specific 풀이 1개뿐 → specific 1 + general 1 = 2개. 부족분을 general 로 메우지 않는다.
    expect(picked.filter((q) => q.intent === 'SPECIFIC_FOOD')).toHaveLength(1)
    expect(picked.filter((q) => q.intent === 'GENERAL_RECIPE')).toHaveLength(1)
    expect(picked).toHaveLength(2)
  })

  it('0개로 지정한 카테고리는 포함하지 않는다 (경계)', () => {
    const picked = pickSuggestions(pool, { specificFood: 0, generalRecipe: 2 })
    expect(picked).toHaveLength(2)
    expect(picked.every((q) => q.intent === 'GENERAL_RECIPE')).toBe(true)
  })

  it('실제 질문 풀로도 specific 2 + general 1 = 3개를 반환한다', () => {
    const picked = pickSuggestions(suggestedQuestions)
    expect(picked).toHaveLength(3)
    expect(picked.filter((q) => q.intent === 'SPECIFIC_FOOD')).toHaveLength(2)
    expect(picked.filter((q) => q.intent === 'GENERAL_RECIPE')).toHaveLength(1)
  })
})
