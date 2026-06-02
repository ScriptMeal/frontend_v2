import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import WeatherHeader from './WeatherHeader'

describe('WeatherHeader', () => {
  it('날짜/시간·날씨·기온을 모두 표시한다 (happy)', () => {
    render(
      <WeatherHeader
        weather={{ datetime: '2026년 06월 02일 13:40', weather: '맑음', temp: '20.0°C' }}
      />,
    )
    expect(screen.getByText('2026년 06월 02일 13:40')).toBeInTheDocument()
    expect(screen.getByText('맑음')).toBeInTheDocument()
    expect(screen.getByText('20.0°C')).toBeInTheDocument()
  })

  it('날씨·기온이 비면 해당 칩은 생략한다 (edge — 스트리밍 부분 수신)', () => {
    render(
      <WeatherHeader weather={{ datetime: '2026년 06월 02일 13:40', weather: '', temp: '' }} />,
    )
    expect(screen.getByText('2026년 06월 02일 13:40')).toBeInTheDocument()
    expect(screen.queryByText('맑음')).not.toBeInTheDocument()
  })
})
