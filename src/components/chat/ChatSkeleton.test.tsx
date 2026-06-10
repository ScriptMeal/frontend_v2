import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatSkeleton from './ChatSkeleton'

describe('ChatSkeleton', () => {
  it('role=status 로 로딩을 알린다 (happy)', () => {
    render(<ChatSkeleton />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('스크린리더용 로딩 라벨을 노출한다 (a11y)', () => {
    render(<ChatSkeleton />)
    expect(screen.getByText('대화 기록을 불러오는 중…')).toBeInTheDocument()
  })

  it('좌/우 교차 버블 자리표시를 여러 개 렌더한다 (structure)', () => {
    render(<ChatSkeleton />)
    const bubbles = screen.getAllByTestId('chat-skeleton-bubble')
    expect(bubbles.length).toBeGreaterThanOrEqual(3)
    // 최소 한 개는 좌측(assistant), 한 개는 우측(user) 정렬이어야 한다.
    expect(bubbles.some((b) => b.className.includes('mr-auto'))).toBe(true)
    expect(bubbles.some((b) => b.className.includes('ml-auto'))).toBe(true)
  })
})
