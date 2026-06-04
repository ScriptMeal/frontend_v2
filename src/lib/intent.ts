import type { Intent } from '@/types'

/**
 * 스트리밍 `tool_start` 이벤트의 tool 값으로 intent를 추론한다.
 * (API_SPEC.md — intent 추론 방법)
 */
export function toolToIntent(tool: string | undefined): Intent {
  if (tool === 'get_diet_products' || tool === 'search_recipe') return 'SPECIFIC_FOOD'
  if (tool === 'get_weather_recipe') return 'GENERAL_RECIPE'
  return 'OFF_TOPIC'
}

/**
 * 즐겨찾기 가능한 응답인지 판별한다.
 * 레시피 추천 응답(SPECIFIC_FOOD·GENERAL_RECIPE)만 저장 대상이며,
 * OFF_TOPIC·후속 질문(intent 미상)은 즐겨찾기 버튼을 노출하지 않는다.
 */
export function isFavoritableIntent(intent: Intent | undefined): boolean {
  return intent === 'SPECIFIC_FOOD' || intent === 'GENERAL_RECIPE'
}
