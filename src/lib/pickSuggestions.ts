import type { SuggestedQuestion, SuggestionPool } from '@/lib/suggestedQuestions'

/** Fisher–Yates 셔플 — 원본 불변, 새 배열 반환. */
function shuffle<T>(items: T[]): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

/** 카테고리별로 뽑을 개수. 홈 추천 칩은 specific 2 : general 1 로 고정한다. */
export interface PickCounts {
  specificFood: number
  generalRecipe: number
}

const DEFAULT_COUNTS: PickCounts = { specificFood: 2, generalRecipe: 1 }

/**
 * 카테고리별 고정 비율 추첨 — 각 카테고리에서 요청 개수만큼 무작위로 뽑아 합치고 최종 셔플한다.
 * 비율을 보장하기 위해 카테고리 간 교차 채움은 하지 않는다(풀이 짧으면 그 카테고리만 적게 나온다).
 * generalRecipe 풀의 의도적 중복은 단일 추첨에 영향 없다 — 카테고리당 distinct 슬롯만큼만 뽑는다.
 * 관련: .claude/decisions/20260604-home-suggested-questions.md
 */
export function pickSuggestions(
  pool: SuggestionPool,
  counts: PickCounts = DEFAULT_COUNTS,
): SuggestedQuestion[] {
  const take = (
    texts: string[],
    intent: SuggestedQuestion['intent'],
    n: number,
  ): SuggestedQuestion[] =>
    shuffle(texts)
      .slice(0, Math.max(0, n))
      .map((text) => ({ text, intent }))

  const picked = [
    ...take(pool.specificFood, 'SPECIFIC_FOOD', counts.specificFood),
    ...take(pool.generalRecipe, 'GENERAL_RECIPE', counts.generalRecipe),
  ]

  // 최종 순서 셔플 — 특정 카테고리가 항상 앞/뒤에 오지 않게 한다.
  return shuffle(picked)
}
