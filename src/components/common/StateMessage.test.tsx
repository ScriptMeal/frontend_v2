import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import StateMessage from './StateMessage'

describe('StateMessage', () => {
  it('전달한 메시지를 렌더한다 (happy)', () => {
    render(<StateMessage variant="empty">아직 없습니다</StateMessage>)
    expect(screen.getByText('아직 없습니다')).toBeInTheDocument()
  })

  it('error 변형은 role=alert 로 노출한다 (a11y)', () => {
    render(<StateMessage variant="error">실패했습니다</StateMessage>)
    expect(screen.getByRole('alert')).toHaveTextContent('실패했습니다')
  })

  it('loading 변형은 role=status 로 노출한다 (a11y)', () => {
    render(<StateMessage variant="loading">불러오는 중…</StateMessage>)
    expect(screen.getByRole('status')).toHaveTextContent('불러오는 중…')
  })
})
