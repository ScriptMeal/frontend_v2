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

/**
 * 카테고리 균형 추첨 — 각 카테고리(비어있지 않은)에서 최소 1개씩 먼저 뽑고,
 * 남은 슬롯은 두 카테고리의 잔여 합집합에서 무작위로 채운다(중복 없음).
 * 최종 순서도 셔플해 특정 카테고리가 항상 앞에 오지 않게 한다.
 * 풀 총량이 count보다 작으면 가능한 만큼만 반환한다.
 * 관련: .claude/decisions/20260604-home-suggested-questions.md (B안)
 */
export function pickSuggestions(pool: SuggestionPool, count = 3): SuggestedQuestion[] {
  if (count <= 0) return []

  const tag = (
    texts: string[],
    intent: SuggestedQuestion['intent'],
  ): SuggestedQuestion[] => texts.map((text) => ({ text, intent }))

  // 카테고리별로 미리 셔플해 "첫 1개"와 잔여 모두 무작위가 되게 한다.
  const byCategory = [
    shuffle(tag(pool.specificFood, 'SPECIFIC_FOOD')),
    shuffle(tag(pool.generalRecipe, 'GENERAL_RECIPE')),
  ]

  const picked: SuggestedQuestion[] = []

  // 1단계: 각 카테고리에서 최소 1개씩(슬롯이 남는 한)
  for (const category of byCategory) {
    if (picked.length >= count) break
    const first = category.shift()
    if (first) picked.push(first)
  }

  // 2단계: 남은 슬롯을 두 카테고리 잔여 합집합에서 무작위로 채움
  const rest = shuffle(byCategory.flat())
  for (const item of rest) {
    if (picked.length >= count) break
    picked.push(item)
  }

  // 3단계: 최종 순서 셔플(카테고리 편향 제거)
  return shuffle(picked)
}
