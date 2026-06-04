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
  it('기본 count(3)만큼 반환한다 (happy)', () => {
    expect(pickSuggestions(pool)).toHaveLength(3)
  })

  it('두 카테고리를 모두 최소 1개씩 포함한다 (여러 번 실행)', () => {
    for (let i = 0; i < RUNS; i++) {
      const picked = pickSuggestions(pool, 3)
      const intents = picked.map((q) => q.intent)
      expect(intents).toContain('SPECIFIC_FOOD')
      expect(intents).toContain('GENERAL_RECIPE')
    }
  })

  it('결과에 중복이 없다 (여러 번 실행)', () => {
    for (let i = 0; i < RUNS; i++) {
      const picked = pickSuggestions(pool, 3)
      const texts = picked.map((q) => q.text)
      expect(new Set(texts).size).toBe(texts.length)
    }
  })

  it('count=2 면 카테고리 1:1 로 구성된다 (여러 번 실행)', () => {
    for (let i = 0; i < RUNS; i++) {
      const picked = pickSuggestions(pool, 2)
      const specific = picked.filter((q) => q.intent === 'SPECIFIC_FOOD')
      const general = picked.filter((q) => q.intent === 'GENERAL_RECIPE')
      expect(specific).toHaveLength(1)
      expect(general).toHaveLength(1)
    }
  })

  it('풀 총량이 count보다 작으면 가능한 만큼만 반환한다 (edge)', () => {
    const small: SuggestionPool = { specificFood: ['a'], generalRecipe: ['b'] }
    expect(pickSuggestions(small, 3)).toHaveLength(2)
  })

  it('한 카테고리가 비어도 다른 카테고리에서 채운다 (edge)', () => {
    const onlyFood: SuggestionPool = {
      specificFood: ['a', 'b', 'c', 'd'],
      generalRecipe: [],
    }
    const picked = pickSuggestions(onlyFood, 3)
    expect(picked).toHaveLength(3)
    expect(picked.every((q) => q.intent === 'SPECIFIC_FOOD')).toBe(true)
  })

  it('count=0 이면 빈 배열을 반환한다 (경계)', () => {
    expect(pickSuggestions(pool, 0)).toEqual([])
  })

  it('실제 질문 풀로도 두 카테고리를 포함해 3개를 반환한다', () => {
    const picked = pickSuggestions(suggestedQuestions, 3)
    expect(picked).toHaveLength(3)
    const intents = picked.map((q) => q.intent)
    expect(intents).toContain('SPECIFIC_FOOD')
    expect(intents).toContain('GENERAL_RECIPE')
  })
})
