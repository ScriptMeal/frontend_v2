import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ToolIndicator from './ToolIndicator'

describe('ToolIndicator', () => {
  it('get_diet_products → 제품 검색 문구를 표시한다 (happy)', () => {
    render(<ToolIndicator tool="get_diet_products" />)
    expect(screen.getByText(/관련 다이어트 제품 검색 중/)).toBeInTheDocument()
  })

  it('search_recipe → 웹 검색 문구를 표시한다', () => {
    render(<ToolIndicator tool="search_recipe" />)
    expect(screen.getByText(/레시피 웹 검색 중/)).toBeInTheDocument()
  })

  it('get_weather_recipe → 날씨 조회 문구를 표시한다', () => {
    render(<ToolIndicator tool="get_weather_recipe" />)
    expect(screen.getByText(/날씨 정보 조회 중/)).toBeInTheDocument()
  })

  it('미지의 tool → 일반 생성 중 문구로 폴백한다 (edge)', () => {
    render(<ToolIndicator tool="unknown_tool" />)
    expect(screen.getByText(/응답 생성 중/)).toBeInTheDocument()
  })

  it('tool 이 없으면(send 직후) 기본 생성 중 문구를 표시한다 (edge)', () => {
    render(<ToolIndicator tool={null} />)
    expect(screen.getByText(/응답 생성 중/)).toBeInTheDocument()
  })
})
