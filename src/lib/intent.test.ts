import { describe, it, expect } from 'vitest'
import { toolToIntent, isFavoritableIntent } from './intent'

describe('toolToIntent', () => {
  it('get_diet_products / search_recipe → SPECIFIC_FOOD', () => {
    expect(toolToIntent('get_diet_products')).toBe('SPECIFIC_FOOD')
    expect(toolToIntent('search_recipe')).toBe('SPECIFIC_FOOD')
  })

  it('get_weather_recipe → GENERAL_RECIPE', () => {
    expect(toolToIntent('get_weather_recipe')).toBe('GENERAL_RECIPE')
  })

  it('undefined 또는 미지의 tool → OFF_TOPIC (기본값)', () => {
    expect(toolToIntent(undefined)).toBe('OFF_TOPIC')
    expect(toolToIntent('unknown_tool')).toBe('OFF_TOPIC')
  })
})

describe('isFavoritableIntent', () => {
  it('SPECIFIC_FOOD / GENERAL_RECIPE → true (happy)', () => {
    expect(isFavoritableIntent('SPECIFIC_FOOD')).toBe(true)
    expect(isFavoritableIntent('GENERAL_RECIPE')).toBe(true)
  })

  it('OFF_TOPIC → false (즐겨찾기 불가)', () => {
    expect(isFavoritableIntent('OFF_TOPIC')).toBe(false)
  })

  it('intent 미상(undefined) → false (edge)', () => {
    expect(isFavoritableIntent(undefined)).toBe(false)
  })
})
