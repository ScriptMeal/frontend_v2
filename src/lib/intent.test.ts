import { describe, it, expect } from 'vitest'
import { toolToIntent } from './intent'

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
