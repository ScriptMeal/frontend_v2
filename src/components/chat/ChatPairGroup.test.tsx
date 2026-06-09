import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import ChatPairGroup from './ChatPairGroup'

describe('ChatPairGroup — 렌더', () => {
  it('userBubble 과 assistantBubble 을 렌더한다 (happy)', () => {
    render(
      <ChatPairGroup
        userBubble={<div>user message</div>}
        assistantBubble={<div>assistant message</div>}
      />,
    )
    expect(screen.getByText('user message')).toBeInTheDocument()
    expect(screen.getByText('assistant message')).toBeInTheDocument()
  })

  it('assistantBubble 이 없어도 예외 없이 렌더한다 (edge)', () => {
    render(<ChatPairGroup userBubble={<div>user only</div>} />)
    expect(screen.getByText('user only')).toBeInTheDocument()
  })

  it('한 turn 을 그룹 경계(role=group)로 묶는다 (happy)', () => {
    render(
      <ChatPairGroup userBubble={<div>u</div>} assistantBubble={<div>a</div>} />,
    )
    expect(screen.getByRole('group')).toBeInTheDocument()
  })
})
