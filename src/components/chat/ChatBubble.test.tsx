import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatBubble from './ChatBubble'

describe('ChatBubble', () => {
  it('user 메시지는 마크다운 파싱 없이 평문으로 렌더한다 (happy)', () => {
    render(<ChatBubble role="user" content="## 그냥 텍스트" />)
    expect(screen.getByText('## 그냥 텍스트')).toBeInTheDocument()
    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
  })

  it('assistant 메시지는 마크다운으로 렌더한다 (## → heading, 리스트 → listitem)', () => {
    render(<ChatBubble role="assistant" content={'## 떡볶이\n\n- 곤약\n- 양념'} />)
    expect(screen.getByRole('heading', { level: 2, name: '떡볶이' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('빈 content 도 예외 없이 렌더한다 (edge)', () => {
    const { container } = render(<ChatBubble role="assistant" content="" />)
    expect(container.firstChild).not.toBeNull()
  })
})
