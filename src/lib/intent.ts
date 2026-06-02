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
